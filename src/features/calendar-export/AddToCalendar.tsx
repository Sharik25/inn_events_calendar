import { useId, useState } from 'react';
import { useVersionView } from '@/app/versionView';
import type { Occurrence } from '@/domain/types';
import { localDateOf } from '@/engine/time';
import { formatDay, formatRange } from '@/lib/format';
import { strings } from '@/strings/en';
import { useSettings } from '@/state/settings';
import { Badge, Checkbox, Icon, Segmented, Sheet } from '@/ui';
import { useCalendarExport } from './useCalendarExport';
import styles from './AddToCalendar.module.css';

/** Reminder choices for the .ics download, in minutes before the start. */
const REMINDERS = [
  { value: 'off', label: () => strings.calendarExport.reminderOff },
  { value: '15', label: () => strings.calendarExport.reminder15 },
  { value: '60', label: () => strings.calendarExport.reminder60 },
  { value: '1440', label: () => strings.calendarExport.reminder1440 },
] as const;
type ReminderValue = (typeof REMINDERS)[number]['value'];

/** One event in the sheet: name, time range, and an unconfirmed tag when its date is unverified. */
function EventLine({ occurrence }: { occurrence: Occurrence }) {
  const { catalog, displayTimeZone } = useVersionView();
  const def = catalog[occurrence.eventId];
  return (
    <span className={styles.eventLine}>
      <span className={styles.eventName}>{def?.name}</span>
      <time dateTime={occurrence.start.toISOString()} className={styles.eventWhen}>
        {formatRange(occurrence.start, occurrence.end, displayTimeZone)}
      </time>
      {!occurrence.verified && (
        <Badge tone="unconfirmed" className={styles.tag}>
          {strings.common.unconfirmed}
        </Badge>
      )}
    </span>
  );
}

function ExportSheet({ occurrence, onClose }: { occurrence: Occurrence; onClose: () => void }) {
  const { catalog, displayTimeZone } = useVersionView();
  const exp = useCalendarExport(occurrence);
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set());
  const countId = useId();
  const reminderMinutes = useSettings((s) => s.reminderMinutes);
  const setReminderMinutes = useSettings((s) => s.setReminderMinutes);
  const def = catalog[occurrence.eventId];
  const selected = exp.overlaps.filter((o) => picked.has(o.key));
  const allPicked = selected.length === exp.overlaps.length;

  const toggle = (key: string, on: boolean) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  return (
    <Sheet open onClose={onClose} title={strings.calendarExport.addToCalendar}>
      <div className={styles.main}>
        <EventLine occurrence={occurrence} />
        <span className={styles.included}>{strings.calendarExport.alwaysIncluded}</span>
      </div>

      {exp.overlaps.length > 0 && def && (
        <fieldset className={styles.extras}>
          <legend className={styles.legend}>{strings.calendarExport.oneDayDuring(def.name)}</legend>
          <div className={styles.extrasHead}>
            <p className={styles.hint}>{strings.calendarExport.oneDayHint}</p>
            <button
              type="button"
              className={styles.selectAll}
              onClick={() =>
                setPicked(allPicked ? new Set() : new Set(exp.overlaps.map((o) => o.key)))
              }
            >
              {allPicked ? strings.calendarExport.clearAll : strings.calendarExport.selectAll}
            </button>
          </div>
          <ul className={styles.extraList}>
            {exp.overlaps.map((o) => (
              <li key={o.key}>
                <label className={styles.extra}>
                  <Checkbox
                    checked={picked.has(o.key)}
                    onChange={(e) => toggle(o.key, e.currentTarget.checked)}
                  />
                  <EventLine occurrence={o} />
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <div className={styles.reminder}>
        <Segmented
          legend={strings.calendarExport.reminder}
          options={REMINDERS.map(({ value, label }) => ({ value, label: label() }))}
          value={String(reminderMinutes ?? 'off') as ReminderValue}
          onChange={(v) => setReminderMinutes(v === 'off' ? null : Number(v))}
        />
        <p className={styles.hint}>{strings.calendarExport.reminderHint}</p>
      </div>

      <div className={styles.download}>
        <button
          type="button"
          className={styles.primary}
          aria-describedby={countId}
          onClick={() => {
            exp.download(selected, reminderMinutes);
            onClose();
          }}
        >
          <Icon name="calendarPlus" size={18} />
          {strings.calendarExport.appleOutlook}
        </button>
        <p id={countId} className={styles.count}>
          {strings.calendarExport.eventCount(1 + selected.length)}
        </p>
      </div>

      <div className={styles.actions}>
        <a
          href={exp.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.option}
          // With extras picked, stay open so their Google links can be opened too.
          onClick={selected.length > 0 ? undefined : onClose}
        >
          <Icon name="external" size={18} />
          {strings.calendarExport.google}
        </a>
        {selected.length > 0 && (
          <>
            <p className={styles.hint}>{strings.calendarExport.googleOnePerLink}</p>
            <ul className={styles.googleList}>
              {selected.map((o) => {
                const name = catalog[o.eventId]?.name ?? o.eventId;
                const day = formatDay(localDateOf(o.start, displayTimeZone));
                return (
                  <li key={o.key}>
                    <a
                      href={exp.googleUrlFor(o)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.option}
                    >
                      <Icon name="external" size={18} />
                      {strings.calendarExport.googleFor(name, day)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Add-to-calendar button (PLAN.md §10). Opens a sheet with Google Calendar and .ics options; for a
 * long-running event it also lists the one-day events during it, to add to the .ics file.
 */
export function AddToCalendar({ occurrence }: { occurrence: Occurrence }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Icon name="calendarPlus" size={18} />
        {strings.calendarExport.addToCalendar}
      </button>
      {open && <ExportSheet occurrence={occurrence} onClose={() => setOpen(false)} />}
    </>
  );
}
