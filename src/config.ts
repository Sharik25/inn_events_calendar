/**
 * Features that exist but are hidden for now. Their code, strings and tests stay; set one to true
 * to show it again.
 */
export const FEATURES: { subscribe: boolean; eventFilter: boolean } = {
  /** Settings → "Subscribe to all events" (each version's .ics feed; the feeds are still built). */
  subscribe: false,
  /** Settings → "Events shown". While hidden, the default filter applies, not saved choices. */
  eventFilter: false,
};

/**
 * "Gift a beer" payment options, shown in the header's tip menu in this order. Each opens in a
 * new tab (rel="noopener noreferrer"). Add another option by adding one line; the label is the
 * provider's own name, so it isn't translated.
 */
export const SUPPORT_LINKS: readonly { id: string; label: string; url: string }[] = [
  { id: 'wise', label: 'Wise', url: 'https://wise.com/pay/me/egorr36' },
  { id: 'paypal', label: 'PayPal', url: 'https://paypal.me/EgorReviakin' },
];
