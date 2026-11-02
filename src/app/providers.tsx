import { Fragment, useEffect, type ReactNode } from 'react';
import { activeLanguage, setActiveLanguage } from '@/strings';
import { useLanguage } from '@/state/settings';

/**
 * App-wide providers. Applies the UI language before anything renders, and remounts the app when
 * it changes, so every component reads `strings` in the new language.
 */
export function Providers({ children }: { children: ReactNode }) {
  const language = useLanguage();
  // Swap the live `strings` binding during render, before the children read it.
  if (activeLanguage() !== language) setActiveLanguage(language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <Fragment key={language}>{children}</Fragment>;
}
