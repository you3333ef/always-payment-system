// Default shipping amounts by country and service
// المبالغ الافتراضية للشحن حسب الدولة والخدمة

export const shippingAmounts = {
  // دولة الإمارات العربية المتحدة
  AE: {
    aramex: 100,    // أرامكس
    dhl: 120,       // دي إتش إل
    fedex: 130,     // فيديكس
    ups: 125,       // يو بي إس
    empost: 80,     // البريد الإماراتي
    default: 100
  },

  // المملكة العربية السعودية
  SA: {
    smsa: 90,       // سمسا
    aramex: 95,     // أرامكس
    dhl: 110,       // دي إتش إل
    zajil: 85,      // زاجل
    naqel: 88,      // ناقل
    saudipost: 75,  // البريد السعودي
    fedex: 120,     // فيديكس
    ups: 115,       // يو بي إس
    default: 90
  },

  // دولة الكويت
  KW: {
    kwpost: 70,     // البريد الكويتي
    dhlkw: 100,     // دي إتش إل
    aramex: 85,     // أرامكس
    fedex: 110,     // فيديكس
    ups: 105,       // يو بي إس
    default: 85
  },

  // دولة قطر
  QA: {
    qpost: 75,      // البريد القطري
    dhlqa: 105,     // دي إتش إل
    aramex: 90,     // أرامكس
    fedex: 115,     // فيديكس
    ups: 110,       // يو بي إس
    default: 90
  },

  // سلطنة عُمان
  OM: {
    omanpost: 80,   // البريد العُماني
    dhlom: 110,     // دي إتش إل
    aramex: 95,     // أرامكس
    fedex: 120,     // فيديكس
    ups: 115,       // يو بي إس
    default: 95
  },

  // مملكة البحرين
  BH: {
    bahpost: 70,    // البريد البحريني
    dhlbh: 100,     // دي إتش إل
    aramex: 85,     // أرامكس
    fedex: 110,     // فيديكس
    ups: 105,       // يو بي إس
    default: 85
  }
};

/**
 * Get the default shipping amount for a specific country and service
 * الحصول على المبلغ الافتراضي للشحن لدولة وخدمة محددة
 *
 * @param countryCode - Country code (e.g., 'SA', 'AE', 'KW')
 * @param serviceKey - Service key (e.g., 'aramex', 'dhl', 'smsa')
 * @returns Default amount in SAR
 */
export const getDefaultAmount = (countryCode: string, serviceKey: string): number => {
  const country = countryCode.toUpperCase();
  const service = serviceKey.toLowerCase();

  // Check if country exists in shippingAmounts
  if (!shippingAmounts[country as keyof typeof shippingAmounts]) {
    return 500; // Fallback to 500 if country not found
  }

  const countryAmounts = shippingAmounts[country as keyof typeof shippingAmounts];

  // Return specific service amount if exists, otherwise return default
  return (countryAmounts as any)[service] || countryAmounts.default || 500;
};

/**
 * Get amount display text with currency
 * الحصول على نص المبلغ مع العملة
 *
 * @param amount - Amount in SAR
 * @returns Formatted amount string
 */
export const formatAmount = (amount: number): string => {
  return `${amount} ر.س`;
};

/**
 * Get suggested amount range for a country
 * الحصول على نطاق المبالغ المقترحة لدولة
 *
 * @param countryCode - Country code
 * @returns Object with min, max, and default values
 */
export const getAmountRange = (countryCode: string): { min: number; max: number; default: number } => {
  const country = countryCode.toUpperCase();
  const countryData = shippingAmounts[country as keyof typeof shippingAmounts];

  if (!countryData) {
    return { min: 50, max: 500, default: 100 };
  }

  const amounts = Object.values(countryData).filter(val => typeof val === 'number') as number[];
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const defaultAmount = countryData.default || 100;

  return {
    min: Math.max(10, min * 0.8), // Allow 20% below minimum
    max: max * 1.5, // Allow 50% above maximum
    default: defaultAmount
  };
};
