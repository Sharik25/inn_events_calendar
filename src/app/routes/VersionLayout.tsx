import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
import { occurrencesOnDay } from '@/engine/dominance';
import { switchVersionPath } from '@/engine/version';
import { MoreSheet } from '@/features/settings/MoreSheet';
import { takeReopenSettings } from '@/features/settings/reopen';
import { SupportMenu } from '@/features/support/SupportMenu';
import { LaunchCountdown } from '@/features/version-switcher/LaunchCountdown';
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

  const chooseVersion = useSettings((s) => s.chooseVersion);
  const hiddenCategories = useSettings((s) => s.hiddenCategories);
  const timeDisplay = useSettings((s) => s.timeDisplay);
  const weekStartsOn = useSettings((s) => s.weekStartsOn);
  const region = findRegion(version, useRegionId(version));

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
  // The quiet day at the inn (Day view, no events) can be dressed per version (`quietDay`).
  const quiet =
    mode === 'day' && occurrencesOnDay(themeOccurrences, viewDate, userTz, catalog).length === 0;
  const quietDay = quiet ? version.quietDay : undefined;
  const themeId =
    quietDay?.themeId ??
    (mode === 'month'
      ? monthThemeId(themeOccurrences, viewMonth, userTz, catalog, version)
      : dominantThemeId(themeOccurrences, viewDate, userTz, catalog, version));
  const theme = useTheme(themeId);
  // Another theme's particles and decorations only, on top (e.g. Forever's blue stars).
  const ambientTheme = useTheme(quietDay?.ambientThemeId ?? themeId);
  const ambient = quietDay?.ambientThemeId ? ambientTheme : undefined;
  const quietAccent = ambient?.tokens['--color-accent'];
  const reducedMotion = useReducedMotion();
  const uiStyle = quietDay?.uiStyle ?? version.uiStyle ?? 'classic';

  // On <html>, so sheets and other portals get the version's tokens too.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.versionStyle = uiStyle;
    return () => {
      delete root.dataset.versionStyle;
    };
  }, [uiStyle]);

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

  return (
    <ThemeScope
      themeId={themeId}
      withBackground
      className={styles.shell}
      // The quiet day's ambient accent (Forever's blue) for the inn's own touches.
      style={quietAccent ? ({ '--quiet-accent': quietAccent } as CSSProperties) : undefined}
    >
      <ThemeDecorations decorations={theme.decorations} reducedMotion={reducedMotion} />
      {theme.particles && !reducedMotion && <AmbientParticles kind={theme.particles} />}
      {ambient && (
        // Its own tokens (particle colors) apply to these layers only; no box of its own.
        <ThemeScope themeId={ambient.id} style={{ display: 'contents' }}>
          <ThemeDecorations decorations={ambient.decorations} reducedMotion={reducedMotion} />
          {ambient.particles && !reducedMotion && <AmbientParticles kind={ambient.particles} />}
        </ThemeScope>
      )}
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
        <div className={styles.topActions}>
          <SupportMenu />
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setMoreOpen(true)}
            aria-label={strings.topBar.openSettings}
          >
            <Icon name="settings" />
          </button>
        </div>
      </header>

      <main className={styles.main} {...swipe}>
        {/* Week/Month: the launch countdown as one row; the Day view puts it in its sidebar. */}
        {mode !== 'day' && <LaunchCountdown view={view} variant="row" />}
        <Outlet context={view} />
      </main>

      <footer className={styles.footer}>
        <ThemeDecorations
          decorations={theme.decorations}
          variant="scene"
          reducedMotion={reducedMotion}
        />
        <small>{strings.legal.disclaimer}</small>
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
