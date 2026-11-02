import { useEffect, useRef } from 'react';
import type { VersionConfig } from '@/domain/types';
import { launchInstant, versionStatus } from '@/engine/version';
import { useTheme } from '@/hooks/useTheme';
import { formatDateTime } from '@/lib/format';
import { strings } from '@/strings';
import { uniqueSvgIds } from '@/themes/art/helpers';
import { Icon, ThemeScope } from '@/ui';
import styles from './VersionPicker.module.css';

function VersionOption({
  version,
  current,
  now,
  timeZone,
  onSelect,
}: {
  version: VersionConfig;
  current: boolean;
  now: Date;
  timeZone: string;
  onSelect: () => void;
}) {
  const theme = useTheme(version.baseThemeId);
  const status = versionStatus(version, now);
  const launch = launchInstant(version);
  const statusText =
    status === 'upcoming' && launch
      ? strings.versions.launches(formatDateTime(launch, timeZone))
      : status === 'retired'
        ? strings.versions.retired
        : strings.versions.live;

  return (
    <li>
      <ThemeScope as="span" themeId={version.baseThemeId} className={styles.themed}>
        <button
          type="button"
          className={styles.option}
          aria-current={current || undefined}
          onClick={onSelect}
        >
          <span className={styles.medallion} aria-hidden="true">
            {theme.emblem ? (
              <span
                className={styles.emblem}
                // Static, bundled art from theme files (never user input).
                dangerouslySetInnerHTML={{ __html: uniqueSvgIds(theme.emblem, `vp${version.id}`) }}
              />
            ) : (
              <Icon name="version" size={22} />
            )}
          </span>
          <span className={styles.text}>
            <span className={styles.name}>{version.name}</span>
            <span className={styles.status} data-status={status}>
              {statusText}
            </span>
          </span>
          {current && <Icon name="today" size={18} title={strings.versions.current} />}
        </button>
      </ThemeScope>
    </li>
  );
}

/**
 * Version picker popover above the action bar (PLAN.md §8.3). Escape or a click outside closes it;
 * focus moves into it on open and back to the trigger on close; ↑/↓ move between versions.
 */
export function VersionPicker({
  open,
  onClose,
  versions,
  currentId,
  now,
  timeZone,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  versions: VersionConfig[];
  currentId: string;
  now: Date;
  timeZone: string;
  onSelect: (versionId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = [...(ref.current?.querySelectorAll<HTMLElement>('button') ?? [])];
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      e.preventDefault();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!ref.current?.contains(target) && !target.closest('[data-version-trigger]')) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div ref={ref} className={styles.popover} role="dialog" aria-label={strings.versions.choose}>
      <p className={styles.title}>{strings.versions.choose}</p>
      <ul className={styles.list}>
        {versions.map((v) => (
          <VersionOption
            key={v.id}
            version={v}
            current={v.id === currentId}
            now={now}
            timeZone={timeZone}
            onSelect={() => onSelect(v.id)}
          />
        ))}
      </ul>
    </div>
  );
}
