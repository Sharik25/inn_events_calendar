import { useSettings } from '@/state/settings';
import { strings } from '@/strings';
import { Segmented } from '@/ui';

/** Time display, week start and animation preferences (PLAN.md §15). */
export function DisplaySettings() {
  const timeDisplay = useSettings((s) => s.timeDisplay);
  const weekStartsOn = useSettings((s) => s.weekStartsOn);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const { setTimeDisplay, setWeekStartsOn, setReducedMotion } = useSettings.getState();
  const s = strings.settings;

  return (
    <>
      <Segmented
        legend={s.timeDisplay}
        options={[
          { value: 'local', label: s.localTime },
          { value: 'server', label: s.serverTimeShort },
        ]}
        value={timeDisplay}
        onChange={setTimeDisplay}
      />
      <Segmented
        legend={s.weekStart}
        options={[
          { value: '0', label: s.sunday },
          { value: '1', label: s.monday },
        ]}
        value={String(weekStartsOn) as '0' | '1'}
        onChange={(v) => setWeekStartsOn(v === '0' ? 0 : 1)}
      />
      <Segmented
        legend={s.motion}
        options={[
          { value: 'system', label: s.motionSystem },
          { value: 'on', label: s.motionReduced },
          { value: 'off', label: s.motionFull },
        ]}
        value={reducedMotion}
        onChange={setReducedMotion}
      />
    </>
  );
}
