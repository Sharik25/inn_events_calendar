# Innkeeper's Almanac — conventions

Fan-made calendar of in-game events for classic WoW versions. Full spec: `PLAN.md` (build phase by phase, §12).

## Commands

Node 22 is required (`nvm use`; see `.nvmrc`). The system default Node 18 is too old for Vite 8 / Playwright.

| Command                                                 | What it does                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                                           | Vite dev server                                                    |
| `npm run build`                                         | `validate-data` → `build-ics` → `tsc -b` → `vite build`            |
| `npm test`                                              | Vitest unit tests (jsdom)                                          |
| `npm run coverage`                                      | Unit tests + coverage (≥ 90% enforced on `src/engine/`)            |
| `npm run e2e`                                           | Playwright, projects `mobile` (iPhone 13) and `desktop` (1280×800) |
| `npm run lint` / `npm run typecheck` / `npm run format` | ESLint / tsc / Prettier                                            |

## Hard rules

1. **Never invent event dates.** Every explicit date in `src/data/**` has `verified: boolean` and `source`. If a date can't be verified against Wowhead, Blizzard news, or the in-game calendar, keep `verified: false`; the UI marks it "unconfirmed".
2. **No Blizzard assets.** No ripped textures, icons, logos, music or client font. All art is original CSS/SVG. Use event names only descriptively. Keep the disclaimer in the footer and About.
3. **Mobile = desktop priority.** Check every component at 360px and 1280px. No horizontal scroll at 360px. Tap targets ≥ 48×48px.
4. **No backend in v1.** Static site + build-time `.ics` feeds.
5. **Data, not code.** Adding an event, theme, version or year must only touch `src/data/**` / `src/themes/**` plus one registry line (PLAN.md §13).

## Folder rules (PLAN.md §4)

- Dependency direction is one-way: **data → engine → UI**.
- `src/domain/`: types + Zod schemas only.
- `src/engine/`: pure TS, **no React, no DOM**. Unit-test heavily (`__tests__/`).
- `src/data/events/`: one file per event (version-agnostic). `src/data/versions/<id>/`: `version.ts` + `schedule-<year>.json`.
- `src/themes/<id>/`: one folder per theme; registry in `src/themes/index.ts` (lazy loaders, `base` bundled).
- `src/features/<feature>/`: views and feature components. `src/ui/`: design-system primitives.
- `src/strings/`: **all UI copy**, in `en.ts` (reference) plus `de.ts`, `fr.ts`, `ru.ts` typed against it (`Strings`), so a missing key fails `tsc`. Import `strings` from `@/strings` (a live binding for the active language), never from a language file. Don't hardcode user-facing strings or locales in components; dates go through `src/lib/format.ts`. Event content in `src/data/**` stays English.
- Styling: CSS Modules + CSS custom properties (tokens in `src/styles/tokens.css`). No CSS-in-JS. CSS-only animation, always respect `prefers-reduced-motion`.
- Imports: use the `@/` alias for `src/`. Use `import type` for type-only imports.

## Stack notes

- React 18, TypeScript strict (`noUncheckedIndexedAccess` on).
- Routing uses **React Router v7** (`react-router` package) in data-router mode, instead of v6 as written in PLAN.md. The API is the same as v6, and v6 has unpatched security advisories.
- Build scripts (`scripts/*.ts`, run with `tsx`) load app data through `scripts/lib/load-data.ts`, which uses Vite's module runner. That keeps `import.meta.glob` and the `@/` alias working outside Vite.

## Data notes

- Explicit dates live in `src/data/versions/<id>/schedule-<year>.json`. `version.ts` globs them, so adding a year only means adding a file.
- **Yearly holidays are declarative.** Each holiday's slot in the standard (Classic/TBC) calendar is `annual` on its event file (anchor: fixed date, nth weekday, Easter or Lunar New Year offset; start time; duration; source). Recurring weekly events have a `weekly` slot instead (weekday, start time, duration, source; e.g. the fishing contest). A version gets its dated events from `scheduleBindings(scheduleFiles, { events, estimateStandard, disabled })`: its own `schedule-<year>.json` dates win for their year; with `estimateStandard` every other year of an `annual` slot and every `weekly` slot is estimated (`verified: false`, `estimated: 'yearly' | 'weekly'`, `ESTIMATED_NOTE` / `ESTIMATED_WEEKLY_NOTE`), shown as "Estimated". `standardWeeklyRule(event, { verified: true, source })` confirms a weekly slot for one version. Anniversary: hand-tracked only. Forever: estimates. Occurrences ending before a version's first launch are dropped.
- **Launches are data.** `launches` on a version (`{ id, label, at, timeZone, verified, source }`, Forever's in `versions/forever/launches.ts`) gives one event per launch (`launchEvents` / `launchBindings` in `data/launches.ts`, a `moment` rule: one instant everywhere), the per-region launch countdown (each line drops out at its moment; `pendingLaunches`) and the switch from upcoming to live (`launchInstant` = first launch). Forever launches worldwide at one moment (Nov 4, 15:00 PT = Nov 5, 00:00 Paris), listed as Europe and America. Launch day wears the `forever-launch` theme (inn brown + sea blue, thin `burst` fireworks, `dayAccent` in week/month cells).
- **Forever is the default version.** `/` opens the version picked in the switcher (`chosenVersionId` in settings), else `defaultVersionId` (`forever`). Visiting a version is not a choice.
- **Auto-update:** Forever's dates are JSON too (`forever/schedule-<year>.json`). As of Nov 3, 2026 Wowhead lists no world events for Forever: the four Darkmoon Faire visits come from the game client (build 70707, `verified: false`, explicit `location`), and all yearly holidays are estimates. When Forever's real date for a holiday is known, add it to the schedule file; it replaces the estimate for that year. Editing one on `main` redeploys. `deploy.yml` also rebuilds daily so the `.ics` feed window rolls forward. `useNow` ticks every minute and on tab focus, so "today" never needs a deploy. There is no scraper on purpose: no official calendar API, and scraped dates can't be `verified`.
- Experience & rewards: optional `experience[<versionId>]` on an event (xp bonus, level range, quests, rewards, notes, required `source`). The event sheet shows it only when present. Same rule as dates: only facts the version-specific source states, never estimated numbers.
- Set `verified: true` only with a source specific to that version. Every unverified date needs a `note` saying what's unconfirmed (a test enforces this).
- Anniversary assumptions to re-check in-game: US event clock = Pacific time; holiday start/end time = 10:00 server; Darkmoon Faire opens 00:00 Monday after the first Friday, location rotation unknown.
- Swipe navigation uses a small touch-event hook (`src/hooks/useSwipeNav.ts`) instead of `@use-gesture/react` from PLAN.md. The library's click handling blocked link taps inside the swipe area.
- Mobile vs desktop markup differs in Week/Month (`useMediaQuery(DESKTOP_QUERY)`). Unit tests render the mobile layout unless `window.__desktop = true`.

## Themes & art (Phase 5)

- A theme is data: `src/themes/<id>/theme.ts` (tokens, background, particles, `numeral.ornament`, `decorations`) + one line in `src/themes/index.ts`. `ThemeDecorations` / `AmbientParticles` render it; no UI code per theme.
- Keep decorations minimal (PLAN.md rev. 2): garlands/edge strips, background, particles and small animated accents only, never large corner objects. A theme's `emblem` is small art for card medallions.
- Art lives in `src/themes/art/*.ts` as original SVG strings (chunky outlines, painted gradients). Never copy or trace game art.
- Several copies of the same art can be on a page: always render through `uniqueSvgIds()`, or gradients break when the first copy is hidden.
- Mobile: bottom-corner art moves from the fixed layer into the end-of-page scene so it never sits behind text.
- **Version styles:** `uiStyle` on a version (`classic` default, `modern` for Forever) sets `<html data-version-style>`; `src/styles/version-styles.css` overrides shape/depth/motion tokens only (`--radius-*`, `--frame-border`, `--shadow-*`, `--motion-scale`, `--motion-ease`, `--tracking-scale`). Use those tokens instead of literal borders, shadows and durations so both versions follow.
- A version dresses its quiet day at the inn with `quietDay: { themeId, uiStyle, ambientThemeId }` (defaults: base theme, version uiStyle, nothing extra). `ambientThemeId` layers that theme's particles and decorations only. Forever: `{ themeId: 'base', uiStyle: 'classic', ambientThemeId: 'forever' }`, i.e. the Anniversary inn exactly plus Forever's blue stars. On a quiet day "Coming soon" uses `ComingSoonCard variant="inn"` (features/today): wooden cards with the event's emblem (`EventEmblem`, shared with `EventRow`), date and distance, lit by `--quiet-accent` (the ambient theme's accent, set by VersionLayout: Forever's blue; else the theme's own). Days with events keep `variant="chip"`.
- Quiet days (no events) show `<Fireplace>` (`src/ui/Fireplace`): inline SVG, so its parts can be CSS-animated, with `useId` gradient ids. Stone, wood and trim come from theme tokens, and it stands still under reduced motion.
- `src/themes/__tests__/contrast.test.ts` enforces WCAG AA per theme and the 150 KB budget. Fix a failing theme by adjusting its tokens, not the test.

## Calendar export (Phase 6)

- `src/engine/ics.ts` is our own small RFC 5545 writer, not the `ics` package from PLAN.md. That avoids three runtime dependencies in the bundle. Output is validated in tests by parsing it with `ical.js` (dev dependency).
- Recurring events are exported as individual VEVENTs, never RRULE, because a UTC RRULE would drift by an hour across DST.
- UIDs are `Occurrence.key@innkeepers-almanac`, so they are stable across builds and re-imports.
- "Add to calendar" opens a Sheet. For a long-running event it lists the one-day events (≤ 24h, `oneDayOverlaps` in `engine/agenda.ts`) that run during it. The user can tick any of them to include in the same downloaded .ics. Google gets one link per event because its add-event URL takes a single event.
- `npm run build-ics` (also run by `dev`, `build` and the Playwright server) writes `public/calendars/<version>-<region>.ics`, covering −1 to +18 months. Set `SITE_URL` (Netlify's `URL` is used automatically) so event descriptions link back to the app.

## PWA, settings & deploy (Phase 8)

- `vite-plugin-pwa` precaches the shell, bundled data, lazy theme chunks and fonts, so the app works offline. Feeds (`/calendars/*`) use NetworkFirst and are excluded from the SPA fallback.
- Icons, favicon and the social image are generated from original SVG art: `npm run assets` (`scripts/generate-assets.ts`, art in `src/themes/art/appIcon.ts`). Re-run it after changing the art.
- Tip jar: `SUPPORT_LINKS` in `src/config.ts` (Wise, PayPal; one line per option) feeds the header's "Buy me a beer" menu next to Settings (`features/support/SupportMenu`; tankard icon: `BeerIcon` in `src/ui/Icon`). Links open in a new tab with `noopener noreferrer`. No ads, tracking or paywalls.
- Settings live in the settings sheet: region, time display, week start, animations, event categories, subscribe, About.
- Deploy target is Netlify (`netlify.toml`: Node 22, `.ics` served as `text/calendar`, no-cache service worker, security headers, SPA fallback). `SITE_URL` (or Netlify's `URL`) makes feed links and `og:image` absolute.
- CI: `.github/workflows/ci.yml` runs every gate. Lighthouse (mobile) at the end of Phase 8: Performance 96, Accessibility 100, Best Practices 100, SEO 100.
- **Live deploy: GitHub Pages** via `.github/workflows/deploy.yml` on every push to `main`, at https://sharik25.github.io/world_of_warcraft_event_calendar/ until a custom domain is set. **One setting decides where it is served:** the repo variable `CUSTOM_DOMAIN`. `scripts/lib/site.ts` (run as `scripts/site-env.ts` in the deploy) turns it into `BASE_PATH` (`/` for a domain, `/<repo>/` otherwise) and `SITE_URL`. Never hardcode a host or the repo path; steps in `docs/custom-domain.md`. Use `publicPath()` / `appBaseUrl()` from `src/lib/base.ts` for files in `public/` and absolute app links; router paths are relative to the basename automatically. `404.html` (a copy of `index.html`) makes deep links work.
