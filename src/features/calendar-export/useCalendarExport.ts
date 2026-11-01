import { useMemo } from 'react';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { oneDayOverlaps } from '@/engine/agenda';
import {
  buildIcs,
  googleCalendarUrl,
  occurrenceToIcsEvent,
  type ExportOptions,
  type IcsEvent,
} from '@/engine/ics';
import { localDateOf } from '@/engine/time';
import { useOccurrences } from '@/hooks/useOccurrences';
import { appBaseUrl } from '@/lib/base';
import { downloadText } from '@/lib/download';
import { strings } from '@/strings/en';

/**
 * Export actions for one occurrence, plus the one-day events running during it (when it is a
 * long-running event) that the user can add to the same .ics file.
 */
export function useCalendarExport(occurrence: Occurrence) {
  const { version, catalog, region, userTimeZone, hiddenCategories } = useVersionView();
  const def = catalog[occurrence.eventId];
  const options: ExportOptions = {
    appUrl: typeof window === 'undefined' ? undefined : appBaseUrl(),
    tentativeLabel: strings.calendarExport.tentative,
    locationLabel: strings.eventSheet.location,
  };
  const toIcs = (o: Occurrence): IcsEvent | null => {
    const d = catalog[o.eventId];
    return d ? occurrenceToIcsEvent(o, d, options) : null;
  };
  const event = toIcs(occurrence);

  const during = useOccurrences(
    version,
    region.id,
    localDateOf(occurrence.start, userTimeZone),
    localDateOf(occurrence.end, userTimeZone),
    userTimeZone,
    catalog,
    hiddenCategories,
  );
  const overlaps = useMemo(() => oneDayOverlaps(during, occurrence), [during, occurrence]);

  return {
    googleUrl: event ? googleCalendarUrl(event) : '',
    /** One-day occurrences of other events during this one; empty for a one-day event. */
    overlaps,
    googleUrlFor(o: Occurrence): string {
      const e = toIcs(o);
      return e ? googleCalendarUrl(e) : '';
    },
    /** Saves this occurrence, plus `extras`, as one .ics file. */
    download(extras: Occurrence[] = []) {
      if (!event || !def) return;
      const events = [event, ...extras.flatMap((o) => toIcs(o) ?? [])];
      downloadText(`${def.id}-${localDateOf(occurrence.start, 'UTC')}.ics`, buildIcs({ events }));
    },
  };
}
