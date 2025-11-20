/**
 * Payment Link Generation Utility
 * Unified function to generate dynamic payment URLs with company and country parameters
 */

/**
 * Generate a unified payment link with all parameters
 * @param invoiceId - The payment/invoice ID
 * @param company - Company key (e.g., 'dhl', 'aramex')
 * @param country - Country code (e.g., 'SA', 'AE')
 * @returns Full payment URL with query parameters
 */
export function generatePaymentLink({
  invoiceId,
  company,
  country,
}: {
  invoiceId: string;
  company: string;
  country: string;
}): string {
  // Use current domain for production
  const productionDomain = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://gentle-hamster-ed634c.netlify.app';

  // Get currency and title based on country
  const countryData = getCountryData(country);
  const title = encodeURIComponent(countryData.defaultTitle);

  // Build the URL with all parameters
  return `${productionDomain}/pay/${invoiceId}/recipient?company=${encodeURIComponent(company)}&currency=${encodeURIComponent(countryData.currency)}&title=${title}`;
}

/**
 * Get country data with fallback
 */
function getCountryData(countryCode: string) {
  const countryDataMap: Record<string, { currency: string; defaultTitle: string }> = {
    SA: {
      currency: "SAR",
      defaultTitle: "Payment in Saudi Arabia"
    },
    AE: {
      currency: "AED",
      defaultTitle: "Payment in UAE"
    },
    KW: {
      currency: "KWD",
      defaultTitle: "Payment in Kuwait"
    },
    QA: {
      currency: "QAR",
      defaultTitle: "Payment in Qatar"
    },
    OM: {
      currency: "OMR",
      defaultTitle: "Payment in Oman"
    },
    BH: {
      currency: "BHD",
      defaultTitle: "Payment in Bahrain"
    }
  };

  const code = countryCode?.toUpperCase() || 'SA';
  return countryDataMap[code] || countryDataMap.SA;
}
