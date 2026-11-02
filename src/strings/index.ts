/**
 * The active UI language. Components read `strings.x` from here: it is a live binding that
 * `setActiveLanguage` swaps, and the app re-renders on a language change (see app/providers).
 */
import { de } from './de';
import { en, type Strings } from './en';
import { fr } from './fr';
import { ru } from './ru';

export type { Strings };

export const LANGUAGES = ['en', 'de', 'fr', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

const tables: Record<Language, Strings> = { en, de, fr, ru };

export let strings: Strings = en;
let active: Language = 'en';

export function activeLanguage(): Language {
  return active;
}

export function setActiveLanguage(language: Language): void {
  active = language;
  strings = tables[language];
}

/** The language's own name ("Deutsch"), for the picker. */
export function languageName(language: Language): string {
  return tables[language].meta.name;
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

/** First supported language among the browser's preferences ("de-AT" → de); English otherwise. */
export function detectLanguage(preferred: readonly string[] = browserLanguages()): Language {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLanguage(primary)) return primary;
  }
  return 'en';
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}
