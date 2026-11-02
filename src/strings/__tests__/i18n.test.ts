import { formatDay, formatDuration } from '@/lib/format';
import { de } from '../de';
import { en } from '../en';
import { fr } from '../fr';
import { detectLanguage, LANGUAGES, languageName, setActiveLanguage, strings } from '../index';
import { ru } from '../ru';

/** Every leaf path of a strings table, with the kind of value at it. */
function shape(table: object, prefix = ''): string[] {
  return Object.entries(table).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? shape(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}:${typeof value}`],
  );
}

afterEach(() => setActiveLanguage('en'));

describe('languages', () => {
  it('detects the first supported browser language, falling back to English', () => {
    expect(detectLanguage(['de-AT', 'en-US'])).toBe('de');
    expect(detectLanguage(['ja-JP', 'FR-ca'])).toBe('fr');
    expect(detectLanguage(['ru'])).toBe('ru');
    expect(detectLanguage(['ja-JP', 'pt-BR'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
  });

  it('every translation has exactly the English keys, none empty', () => {
    for (const table of [de, fr, ru]) {
      expect(shape(table)).toEqual(shape(en));
      const texts = shape(table).filter((p) => p.endsWith(':string'));
      expect(texts.length).toBeGreaterThan(100);
    }
    for (const l of LANGUAGES) expect(languageName(l)).toMatch(/\S/);
  });

  it('pluralizes Russian counts', () => {
    expect(ru.calendarExport.eventCount(1)).toBe('1 событие в файле');
    expect(ru.calendarExport.eventCount(3)).toBe('3 события в файле');
    expect(ru.calendarExport.eventCount(5)).toBe('5 событий в файле');
    expect(ru.calendarExport.eventCount(21)).toBe('21 событие в файле');
  });

  it('switches the live strings, date formats and duration units', () => {
    const ms = (4 * 24 + 22) * 3_600_000;
    expect(formatDuration(ms)).toBe('4d 22h');
    expect(formatDay('2026-10-27')).toBe('Tue, Oct 27');

    setActiveLanguage('de');
    expect(strings.today.quietDay).toBe('Ein ruhiger Tag im Gasthaus');
    expect(formatDuration(ms)).toBe('4 T 22 Std.');
    expect(formatDay('2026-10-27')).toMatch(/^Di\.?, 27\. Okt/);

    setActiveLanguage('ru');
    expect(formatDuration(ms)).toBe('4 д 22 ч');
    expect(formatDay('2026-10-27')).toMatch(/27 окт/);
  });
});
