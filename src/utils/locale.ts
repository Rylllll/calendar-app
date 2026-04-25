export function resolveCurrencyContext(
  countryCode?: string | null,
  countryName?: string | null,
) {
  const normalizedCode = countryCode?.toUpperCase();
  if (normalizedCode) {
    const directMatch =
      currencyByCountryCode[normalizedCode as keyof typeof currencyByCountryCode];
    if (directMatch) {
      return directMatch;
    }
  }

  const normalizedName = countryName?.trim().toLowerCase();
  if (normalizedName) {
    const fallbackCode = mapCountryNameToCode(normalizedName);
    if (fallbackCode) {
      return (
        currencyByCountryCode[fallbackCode as keyof typeof currencyByCountryCode] ??
        currencyByCountryCode.US
      );
    }
  }

  return currencyByCountryCode.US;
}

const currencyByCountryCode = {
  AU: { currency: 'AUD', locale: 'en-AU' },
  BR: { currency: 'BRL', locale: 'pt-BR' },
  CA: { currency: 'CAD', locale: 'en-CA' },
  CH: { currency: 'CHF', locale: 'de-CH' },
  CN: { currency: 'CNY', locale: 'zh-CN' },
  DE: { currency: 'EUR', locale: 'de-DE' },
  ES: { currency: 'EUR', locale: 'es-ES' },
  FR: { currency: 'EUR', locale: 'fr-FR' },
  GB: { currency: 'GBP', locale: 'en-GB' },
  HK: { currency: 'HKD', locale: 'zh-HK' },
  ID: { currency: 'IDR', locale: 'id-ID' },
  IE: { currency: 'EUR', locale: 'en-IE' },
  IN: { currency: 'INR', locale: 'en-IN' },
  IT: { currency: 'EUR', locale: 'it-IT' },
  JP: { currency: 'JPY', locale: 'ja-JP' },
  KR: { currency: 'KRW', locale: 'ko-KR' },
  MO: { currency: 'MOP', locale: 'zh-MO' },
  MX: { currency: 'MXN', locale: 'es-MX' },
  MY: { currency: 'MYR', locale: 'ms-MY' },
  NL: { currency: 'EUR', locale: 'nl-NL' },
  NZ: { currency: 'NZD', locale: 'en-NZ' },
  PH: { currency: 'PHP', locale: 'en-PH' },
  PT: { currency: 'EUR', locale: 'pt-PT' },
  SA: { currency: 'SAR', locale: 'ar-SA' },
  SE: { currency: 'SEK', locale: 'sv-SE' },
  SG: { currency: 'SGD', locale: 'en-SG' },
  TH: { currency: 'THB', locale: 'th-TH' },
  TW: { currency: 'TWD', locale: 'zh-TW' },
  US: { currency: 'USD', locale: 'en-US' },
  VN: { currency: 'VND', locale: 'vi-VN' },
};

function mapCountryNameToCode(countryName: string) {
  switch (countryName) {
    case 'australia':
      return 'AU';
    case 'brazil':
      return 'BR';
    case 'canada':
      return 'CA';
    case 'china':
      return 'CN';
    case 'france':
      return 'FR';
    case 'germany':
      return 'DE';
    case 'hong kong':
      return 'HK';
    case 'india':
      return 'IN';
    case 'indonesia':
      return 'ID';
    case 'ireland':
      return 'IE';
    case 'italy':
      return 'IT';
    case 'japan':
      return 'JP';
    case 'macau':
      return 'MO';
    case 'malaysia':
      return 'MY';
    case 'mexico':
      return 'MX';
    case 'netherlands':
      return 'NL';
    case 'new zealand':
      return 'NZ';
    case 'philippines':
      return 'PH';
    case 'portugal':
      return 'PT';
    case 'saudi arabia':
      return 'SA';
    case 'singapore':
      return 'SG';
    case 'south korea':
      return 'KR';
    case 'spain':
      return 'ES';
    case 'sweden':
      return 'SE';
    case 'switzerland':
      return 'CH';
    case 'taiwan':
      return 'TW';
    case 'thailand':
      return 'TH';
    case 'uk':
    case 'united kingdom':
      return 'GB';
    case 'usa':
    case 'united states':
      return 'US';
    case 'vietnam':
      return 'VN';
    default:
      return undefined;
  }
}
