/**
 * "Gift a beer" payment options, shown in the header's tip menu in this order. Each opens in a
 * new tab (rel="noopener noreferrer"). Add another option by adding one line; the label is the
 * provider's own name, so it isn't translated.
 */
export const SUPPORT_LINKS: readonly { id: string; label: string; url: string }[] = [
  { id: 'wise', label: 'Wise', url: 'https://wise.com/pay/me/egorr36' },
  { id: 'paypal', label: 'PayPal', url: 'https://paypal.me/EgorReviakin' },
];
