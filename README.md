# Innkeeper's Almanac

A cozy, fan-made calendar of in-game events for classic World of Warcraft versions
(Anniversary, WoW: Forever): day, week and month views, event details, and Apple/Google
calendar export. Live at https://sharik25.github.io/world_of_warcraft_event_calendar/.

Not affiliated with or endorsed by Blizzard Entertainment.

## Develop

Node 22 (`nvm use`), then:

```bash
npm install
npm run dev        # dev server
npm test           # unit tests
npm run e2e        # Playwright (mobile + desktop)
npm run build      # validate data, build .ics feeds, type-check, bundle
```

Conventions for contributors (and AI agents) are in [CLAUDE.md](CLAUDE.md); hosting on a custom
domain is in [docs/custom-domain.md](docs/custom-domain.md).

## Events and versions are data

Adding an event or a version touches files in `src/data/` (and `src/themes/` for a new look),
never components. `npm run validate-data` (also part of `build`) checks everything.

### Add an event

1. Create `src/data/events/<id>.ts` and add it to the list in `src/data/events/index.ts`
   (illustrative values below; use sourced data):

   ```ts
   export const pilgrimsBounty: EventDefinition = {
     id: 'pilgrims-bounty',
     name: "Pilgrim's Bounty",
     category: 'holiday', // holiday | faire | fishing | world | pvp | milestone
     rarity: 'annual',
     themeId: 'harvest-festival', // any theme in src/themes/index.ts
     summary: 'One sentence.',
     highlights: ['Short bullet'],
     // Optional: its slot in the standard yearly calendar. Versions that estimate
     // (estimateStandard) then show it every year, marked "Estimated". A weekly event uses
     // `weekly: { weekday, startTime, durationMinutes, source }` instead (e.g. the fishing contest).
     annual: {
       anchor: { type: 'weekday', month: 11, weekday: 1, nth: 4 }, // or 'date' | 'easter' | 'lunar-new-year'
       startTime: '10:00', // server time
       durationDays: 7,
       source: 'https://…', // where that yearly slot comes from
     },
   };
   ```

2. Give it dates in a version (next section). Without dates it shows nowhere.

### Give an event dates in a version

Each version has `src/data/versions/<version>/schedule-<year>.json`. A new year is a new file.

```json
{
  "year": 2027,
  "events": {
    "hallows-end": [
      {
        "start": "2027-10-18T10:00",
        "end": "2027-11-01T10:00",
        "verified": true,
        "source": "https://…"
      }
    ]
  }
}
```

- Times are the region's server wall clock.
- `verified: true` only with a source for that version; otherwise `false` plus a `note` saying what
  is unconfirmed. The app tags it "Unconfirmed".
- Optional `location` (e.g. a Darkmoon Faire site).
- In a version that estimates yearly holidays, a date here replaces the estimate for that year.

Recurring events (weekly contests, a monthly faire) are rules in the version's `version.ts`
(`kind: 'weekly'` or `'monthly'`).

### Add a version

1. Create `src/data/versions/<id>/version.ts` and `schedule-<year>.json` files (copy
   `forever/` as a starting point), and add the version to `src/data/versions/index.ts` (list
   order = version picker order; `defaultVersionId` is where `/` goes).
2. In `version.ts`, the events come from:

   ```ts
   events: [
     ...scheduleBindings(scheduleFiles, {
       events: eventDefinitions,
       estimateStandard: true, // every event with an `annual` or `weekly` slot, marked "Estimated"
       disabled: ['new-year'], // holidays this version doesn't have
     }),
     // weekly/monthly rules, weekly reset (weeklyResetBindings), …
   ],
   ```

   With `estimateStandard: false` (as Anniversary), only the schedule files' dates show. To
   confirm a standard weekly slot for a version, add
   `{ eventId, rule: standardWeeklyRule(event, { verified: true, source }) }` (Anniversary does this
   for the fishing contest).

3. Optional: `calendarExport: { scopes: ['event', 'day'], onEveryEvent: true }` ("Add to calendar"
   for the whole event or only the viewed day, from every event's details; Forever has it), `launches` (see below), `uiStyle: 'modern'` (shape and motion tokens in
   `src/styles/version-styles.css`), `baseThemeId` for quiet days.

### Launch dates

A version's launch is data: `launches` in its config, one entry per part of the world
(`{ id, label, at, timeZone, verified, source }`; Forever's are in
`src/data/versions/forever/launches.ts`). From that list:

- each launch moment becomes one event (`launchEvents` / `launchBindings` in
  `src/data/launches.ts`): regions that open together share it ("WoW: Forever launch (Europe &
  America)"), a staggered launch gets one per moment ("… (Europe)"). It has a festive day in Day,
  Week and Month (theme `forever-launch`) and a calendar entry like any other event;
- the launch countdown under the version switcher counts down to the launches still ahead, and
  each region's line disappears at its own moment (no redeploy);
- the version turns live at the first launch, and events that ended before it are left out.

Changing a launch date is editing `at` there.
