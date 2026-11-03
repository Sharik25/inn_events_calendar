import { useEffect, useMemo, useState } from 'react';
import {
  Outlet,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useParams,
} from 'react-router';
import { startOfWeek } from '@/engine/calendar';
import { findRegion } from '@/engine/expand';
import { addDays, addMonths, localDateOf, monthOf, type LocalDate } from '@/engine/time';
import { switchVersionPath, versionStatus } from '@/engine/version';
import { MoreSheet } from '@/features/settings/MoreSheet';
import { takeReopenSettings } from '@/features/settings/reopen';
import { SupportLink } from '@/features/support/SupportLink';
import { LaunchScreen } from '@/features/version-switcher/LaunchScreen';
import { VersionPicker } from '@/features/version-switcher/VersionPicker';
import { dominantThemeId, monthThemeId } from '@/hooks/useDominantTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNow } from '@/hooks/useNow';
import { useOccurrences } from '@/hooks/useOccurrences';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSwipeNav } from '@/hooks/useSwipeNav';
import { useTheme } from '@/hooks/useTheme';
import { useRegionId, userTimeZone, useSettings } from '@/state/settings';
import { strings } from '@/strings';
import {
  ActionBar,
  ActionBarDivider,
  ActionButton,
  AmbientParticles,
  FestiveGarland,
  Icon,
  ThemeDecorations,
  ThemeScope,
} from '@/ui';
import { paths, type ViewMode } from '../paths';
import type { VersionView } from '../versionView';
import type { VersionLoaderData } from './loaders';
import styles from './VersionLayout.module.css';

/**
 * Shell for /:versionId/*: themed by the viewed date's dominant event (Month view: by the month's
 * longest-running event), with top bar + action bar.
 */
export function VersionLayout() {
  const { version, versions, catalog } = useLoaderData() as VersionLoaderData;
  const params = useParams();
  const matches = useMatches();
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow();
  // Reopens after a language switch remounted the app (the picker lives in this sheet).
  const [moreOpen, setMoreOpen] = useState(takeReopenSettings);
  const [pickerOpen, setPickerOpen] = useState(false);
  const status = versionStatus(version, now);

  const chooseVersion = useSettings((s) => s.chooseVersion);
  const hiddenCategories = useSettings((s) => s.hiddenCategories);
  const timeDisplay = useSettings((s) => s.timeDisplay);
  const weekStartsOn = useSettings((s) => s.weekStartsOn);
  const region = findRegion(version, useRegionId(version));

  // On <html>, so sheets and other portals get the version's tokens too.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.versionStyle = version.uiStyle ?? 'classic';
    return () => {
      delete root.dataset.versionStyle;
    };
  }, [version.uiStyle]);

  const userTz = userTimeZone();
  const today = localDateOf(now, userTz);
  const mode =
    (matches[matches.length - 1]?.handle as { view?: ViewMode } | undefined)?.view ?? 'day';

  // The date the view is about. A week or month that contains today is "about" today (so Day/Month
  // links and keys land on today); otherwise its first day.
  const viewDate: LocalDate =
    mode === 'month' && params.month
      ? monthOf(today) === params.month
        ? today
        : `${params.month}-01`
      : mode === 'week' && params.date
        ? startOfWeek(today, weekStartsOn) === params.date
          ? today
          : params.date
        : (params.date ?? today);

  // The shell's theme: the viewed day's dominant event, or in Month view one theme for the whole
  // month (its longest-running event).
  const viewMonth = monthOf(viewDate);
  const themeFrom = mode === 'month' ? `${viewMonth}-01` : viewDate;
  const themeTo = mode === 'month' ? addDays(`${addMonths(viewMonth, 1)}-01`, -1) : viewDate;
  const themeOccurrences = useOccurrences(
    version,
    region.id,
    themeFrom,
    themeTo,
    userTz,
    catalog,
    hiddenCategories,
  );
  // Before launch the launch screen wears the version's own theme, never an event's.
  const themeId =
    status === 'upcoming'
      ? version.baseThemeId
      : mode === 'month'
        ? monthThemeId(themeOccurrences, viewMonth, userTz, catalog, version)
        : dominantThemeId(themeOccurrences, viewDate, userTz, catalog, version);
  const theme = useTheme(themeId);
  const reducedMotion = useReducedMotion();

  const view: VersionView = useMemo(() => {
    const hrefFor = (target: ViewMode, date: LocalDate) => {
      if (target === 'week') return paths.week(version.id, startOfWeek(date, weekStartsOn));
      if (target === 'month') return paths.month(version.id, monthOf(date));
      return date === today ? paths.today(version.id) : paths.day(version.id, date);
    };
    const step = (dir: 1 | -1) =>
      mode === 'month'
        ? `${addMonths(monthOf(viewDate), dir)}-01`
        : addDays(viewDate, dir * (mode === 'week' ? 7 : 1));
    const isCurrent =
      mode === 'month'
        ? monthOf(viewDate) === monthOf(today)
        : mode === 'week'
          ? startOfWeek(viewDate, weekStartsOn) === startOfWeek(today, weekStartsOn)
          : viewDate === today;

    return {
      version,
      catalog,
      region,
      userTimeZone: userTz,
      displayTimeZone: timeDisplay === 'server' ? region.timeZone : userTz,
      now,
      today,
      mode,
      viewDate,
      isToday: viewDate === today,
      weekStartsOn,
      hiddenCategories,
      nav: {
        prev: hrefFor(mode, step(-1)),
        next: hrefFor(mode, step(1)),
        current: hrefFor(mode, today),
        isCurrent,
      },
      hrefFor,
    };
  }, [
    version,
    catalog,
    region,
    userTz,
    timeDisplay,
    now,
    today,
    mode,
    viewDate,
    weekStartsOn,
    hiddenCategories,
  ]);

  useKeyboardShortcuts({
    '1': () => navigate(view.hrefFor('day', viewDate)),
    '2': () => navigate(view.hrefFor('week', viewDate)),
    '3': () => navigate(view.hrefFor('month', viewDate)),
    t: () => navigate(view.nav.current),
    v: () => setPickerOpen((open) => !open),
    ArrowLeft: () => navigate(view.nav.prev),
    ArrowRight: () => navigate(view.nav.next),
  });

  const swipe = useSwipeNav(
    () => navigate(view.nav.prev),
    () => navigate(view.nav.next),
  );

  // Picking in the switcher is the user's explicit choice: `/` opens it from now on.
  const switchTo = (versionId: string) => {
    chooseVersion(versionId);
    setPickerOpen(false);
    if (versionId !== version.id)
      navigate(switchVersionPath(location.pathname, version.id, versionId));
  };
  const liveFallback = versions.find(
    (v) => v.id !== version.id && versionStatus(v, now) === 'live',
  );

  return (
    <ThemeScope themeId={themeId} withBackground className={styles.shell}>
      <ThemeDecorations decorations={theme.decorations} reducedMotion={reducedMotion} />
      {theme.particles && !reducedMotion && <AmbientParticles kind={theme.particles} />}
      {themeId === 'winter-veil' && <FestiveGarland reducedMotion={reducedMotion} />}

      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.versionChip}
          onClick={() => setPickerOpen((open) => !open)}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          data-version-trigger
        >
          {strings.topBar.versionChip(version.shortName, region.label)}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setMoreOpen(true)}
          aria-label={strings.topBar.openSettings}
        >
          <Icon name="settings" />
        </button>
      </header>

      <main className={styles.main} {...swipe}>
        {status === 'upcoming' ? (
          <LaunchScreen view={view} fallback={liveFallback} />
        ) : (
          <Outlet context={view} />
        )}
      </main>

      <footer className={styles.footer}>
        <ThemeDecorations
          decorations={theme.decorations}
          variant="scene"
          reducedMotion={reducedMotion}
        />
        <div className={styles.footerLine}>
          <SupportLink />
          <small>{strings.legal.disclaimer}</small>
        </div>
      </footer>

      <ActionBar>
        <ActionButton
          icon="day"
          label={strings.actionBar.day}
          keybind="1"
          to={view.hrefFor('day', viewDate)}
          active={mode === 'day'}
        />
        <ActionButton
          icon="week"
          label={strings.actionBar.week}
          keybind="2"
          to={view.hrefFor('week', viewDate)}
          active={mode === 'week'}
        />
        <ActionButton
          icon="month"
          label={strings.actionBar.month}
          keybind="3"
          to={view.hrefFor('month', viewDate)}
          active={mode === 'month'}
        />
        <ActionBarDivider />
        <ActionButton
          icon="version"
          label={strings.actionBar.version}
          keybind="V"
          onClick={() => setPickerOpen((open) => !open)}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          active={pickerOpen}
          data-version-trigger
        />
      </ActionBar>

      <VersionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        versions={versions}
        currentId={version.id}
        now={now}
        timeZone={userTz}
        onSelect={switchTo}
      />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        version={version}
        catalog={catalog}
      />
    </ThemeScope>
  );
}
