import { useMemo } from 'react';
import { useVersionView } from '@/app/versionView';
import type { CalendarExportScope, Occurrence } from '@/domain/types';
import { oneDayOverlaps } from '@/engine/agenda';
import {
  buildIcs,
  googleCalendarUrl,
  occurrenceOnDay,
  occurrenceToIcsEvent,
  type ExportOptions,
  type IcsEvent,
} from '@/engine/ics';
import { localDateOf, type LocalDate } from '@/engine/time';
import { useOccurrences } from '@/hooks/useOccurrences';
import { appBaseUrl } from '@/lib/base';
import { downloadText } from '@/lib/download';
import { formatDay } from '@/lib/format';
import { strings } from '@/strings';

/**
 * Export actions for one occurrence: the whole event (`scope: 'event'`) or only `day` of it
 * (`'day'`, titled with the day; the whole event when it doesn't run that day), plus, for a
 * long-running export, the one-day events during it that the user can add to the same .ics file.
 */
export function useCalendarExport(
  occurrence: Occurrence,
  scope: CalendarExportScope = 'event',
  day?: LocalDate,
) {
  const { version, catalog, region, userTimeZone, hiddenCategories } = useVersionView();
  const def = catalog[occurrence.eventId];
  const options: ExportOptions = {
    appUrl: typeof window === 'undefined' ? undefined : appBaseUrl(),
    tentativeLabel: strings.calendarExport.tentative,
    locationLabel: strings.eventSheet.location,
  };
  const toIcs = (o: Occurrence, name?: string): IcsEvent | null => {
    const d = catalog[o.eventId];
    return d ? occurrenceToIcsEvent(o, d, options, name) : null;
  };

  const slice = useMemo(
    () => (scope === 'day' && day ? occurrenceOnDay(occurrence, day, userTimeZone) : null),
    [occurrence, scope, day, userTimeZone],
  );
  const target = slice ?? occurrence;
  const event =
    slice && def && day
      ? toIcs(slice, strings.calendarExport.dayTitle(def.name, formatDay(day)))
      : toIcs(occurrence);

  const during = useOccurrences(
    version,
    region.id,
    localDateOf(target.start, userTimeZone),
    localDateOf(new Date(target.end.getTime() - 1), userTimeZone),
    userTimeZone,
    catalog,
    hiddenCategories,
  );
  const overlaps = useMemo(() => oneDayOverlaps(during, target), [during, target]);

  return {
    /** What gets exported: the occurrence, or its part on `day`. */
    target,
    googleUrl: event ? googleCalendarUrl(event) : '',
    /** One-day occurrences of other events during the exported span; empty for a one-day event. */
    overlaps,
    googleUrlFor(o: Occurrence): string {
      const e = toIcs(o);
      return e ? googleCalendarUrl(e) : '';
    },
    /** Saves the export, plus `extras`, as one .ics file; each with a reminder if given. */
    download(extras: Occurrence[] = [], alarmMinutes: number | null = null) {
      if (!event || !def) return;
      const events = [event, ...extras.flatMap((o) => toIcs(o) ?? [])].map((e) =>
        alarmMinutes === null ? e : { ...e, alarmMinutes },
      );
      downloadText(`${def.id}-${localDateOf(target.start, 'UTC')}.ics`, buildIcs({ events }));
    },
  };
}
