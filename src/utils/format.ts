interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number,
  currencyOrOptions: string | CurrencyFormatOptions = 'USD',
) {
  const options =
    typeof currencyOrOptions === 'string'
      ? { currency: currencyOrOptions, locale: 'en-US' }
      : currencyOrOptions;

  return new Intl.NumberFormat(options.locale ?? 'en-US', {
    style: 'currency',
    currency: options.currency ?? 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(amount);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
