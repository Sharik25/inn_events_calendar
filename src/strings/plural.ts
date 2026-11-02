const rules = new Map<string, Intl.PluralRules>();

/** Picks the plural form for `n` in `locale` (CLDR categories: one, few, many, other). */
export function plural(
  locale: string,
  n: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string },
): string {
  let rule = rules.get(locale);
  if (!rule) {
    rule = new Intl.PluralRules(locale);
    rules.set(locale, rule);
  }
  return forms[rule.select(n)] ?? forms.other;
}
