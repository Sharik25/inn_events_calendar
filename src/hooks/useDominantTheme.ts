import type { EventCatalog, Occurrence, ThemeId, VersionConfig } from '@/domain/types';
import { occurrencesOnDay, pickLongestEvent } from '@/engine/dominance';
import { monthRange, type LocalDate, type LocalMonth } from '@/engine/time';

/** Theme of the day's dominant event, or the version's base theme on a quiet day. */
export function dominantThemeId(
  occurrences: Occurrence[],
  date: LocalDate,
  timeZone: string,
  catalog: EventCatalog,
  version: VersionConfig,
): ThemeId {
  const [dominant] = occurrencesOnDay(occurrences, date, timeZone, catalog);
  return (dominant && catalog[dominant.eventId]?.themeId) || version.baseThemeId;
}

/** The month's one main theme: its longest-running event's, or the version's base theme. */
export function monthThemeId(
  occurrences: Occurrence[],
  month: LocalMonth,
  timeZone: string,
  catalog: EventCatalog,
  version: VersionConfig,
): ThemeId {
  const longest = pickLongestEvent(occurrences, monthRange(month, timeZone), catalog);
  return (longest && catalog[longest]?.themeId) || version.baseThemeId;
}
