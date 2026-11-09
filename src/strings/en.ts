/**
 * English UI copy: the reference language. de/fr/ru must match this shape (`Strings`); components
 * read the active language through `strings` from `@/strings`, never from this file directly.
 */
export const en = {
  meta: {
    /** BCP 47 locale for dates and numbers. */
    locale: 'en-US',
    /** The language's own name, for the language picker. */
    name: 'English',
  },
  /** Compact durations: "4d 22h", "3h 12m". */
  units: {
    d: (n: number) => `${n}d`,
    h: (n: number) => `${n}h`,
    m: (n: number) => `${n}m`,
    lessThanMinute: '<1m',
    lessThanHour: '<1h',
  },
  app: {
    name: "Innkeeper's Almanac",
    tagline: 'What is happening in Azeroth today — pull up a chair by the hearth.',
  },
  common: {
    close: 'Close',
    unconfirmed: 'Unconfirmed',
    unconfirmedHint: 'Date not yet confirmed for this version. Check the in-game calendar.',
    estimated: 'Estimated',
    estimatedHint: 'Date estimated from the standard yearly schedule.',
    estimatedWeeklyHint: 'Time estimated from the standard weekly schedule.',
  },
  actionBar: {
    label: 'Views and actions',
    day: 'Day',
    week: 'Week',
    month: 'Month',
    version: 'Version',
    more: 'More',
    today: 'Today',
  },
  today: {
    title: 'Today',
    quietDay: 'A quiet day at the inn',
    startsIn: (d: string) => `Starts in ${d}`,
    endsIn: (d: string) => `Ends in ${d}`,
    ended: (time: string) => `Ended at ${time}`,
    at: (time: string) => `At ${time}`,
    alsoToday: 'Also on this day',
    comingSoon: 'Coming soon',
    comingSoonEmpty: 'Nothing else in the next 30 days.',
    inDistance: (d: string) => `in ${d}`,
    details: 'Details',
    detailsFor: (name: string) => `Details for ${name}`,
    previousDay: 'Previous day',
    nextDay: 'Next day',
    backToToday: 'Back to today',
  },
  calendar: {
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    thisWeek: 'This week',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    thisMonth: 'This month',
    weekTitle: (range: string) => `Week of ${range}`,
    moreEvents: (n: number) => `+${n} more`,
    noEvents: 'No events',
    openDay: 'Open day view',
    dayLabel: (day: string, events: string) => (events ? `${day}: ${events}` : day),
    today: 'Today',
  },
  eventSheet: {
    location: 'Location',
    highlights: 'Highlights',
    notes: 'Notes',
    links: 'Learn more',
    dateSource: 'Date source',
    experience: 'Experience & rewards',
    xpBonus: 'Experience bonus',
    levels: 'Levels',
    levelRange: (min: number, max?: number) =>
      max === undefined ? `${min}+` : min === max ? `${min}` : `${min}–${max}`,
    quests: 'Quests',
    rewards: 'Rewards',
    experienceSource: 'Rewards source',
    notFound: 'This event has no dates in this version.',
    opensInNewTab: '(opens in a new tab)',
  },
  categories: {
    holiday: 'Holiday',
    faire: 'Faire',
    fishing: 'Fishing',
    world: 'World event',
    pvp: 'PvP',
    launch: 'Launch',
    milestone: 'Milestone',
  },
  calendarExport: {
    addToCalendar: 'Add to calendar',
    scope: 'Add',
    scopeEvent: 'Whole event',
    scopeDay: (day: string) => `Only ${day}`,
    dayTitle: (name: string, day: string) => `${name} (${day})`,
    google: 'Google Calendar',
    appleOutlook: 'Apple / Outlook (.ics)',
    tentative: 'tentative',
    alwaysIncluded: 'Always included',
    oneDayDuring: (name: string) => `One-day events during ${name}`,
    oneDayHint: 'Pick any to add to the .ics file as well.',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    eventCount: (n: number) => (n === 1 ? '1 event in the file' : `${n} events in the file`),
    googleOnePerLink: 'Google Calendar adds one event per link, or import the .ics file there.',
    googleFor: (name: string, day: string) => `Google Calendar: ${name}, ${day}`,
    reminder: 'Reminder',
    reminderOff: 'None',
    reminder15: '15 min',
    reminder60: '1 hour',
    reminder1440: '1 day',
    reminderHint:
      'Apple Calendar and Outlook alert you before each event. Google Calendar uses your own default notifications instead.',
    subscribe: 'Subscribe to all events',
    subscribeHint: (version: string, region: string) =>
      `A live calendar of every ${version} event in ${region} server time. Your calendar app keeps it up to date.`,
    feedUrl: 'Feed address',
    copy: 'Copy',
    copied: 'Copied!',
    openApple: 'Apple Calendar',
    openGoogle: 'Google Calendar',
    outlookHow: 'Outlook: Add calendar → Subscribe from web, then paste the feed address.',
    downloadFeed: 'Download .ics instead',
    needsHttps: 'Subscriptions work on the published site (HTTPS). Here you can download the file.',
  },
  versions: {
    choose: 'Choose version',
    live: 'Live',
    retired: 'Retired',
    launches: (date: string) => `Launches ${date}`,
    current: 'Current',
    launchesIn: (d: string) => `Launches in ${d}`,
    launchTime: (when: string) => `${when} your time`,
    regionLaunch: (region: string, when: string) => `${region}: ${when}`,
  },
  topBar: {
    versionChip: (version: string, region: string) => `${version} · ${region}`,
    openSettings: 'Settings',
  },
  more: {
    title: 'Settings & info',
    about: 'About',
    aboutText:
      'A fan-made calendar of in-game events for classic World of Warcraft. Dates come from community sources and official news; unconfirmed dates are marked.',
  },
  notFound: {
    title: 'Lost in the Twisting Nether',
    text: "That page doesn't exist.",
    home: 'Return to the inn',
  },
  settings: {
    region: 'Server region',
    serverTime: (region: string) => `${region} server time`,
    display: 'Display',
    timeDisplay: 'Show times in',
    localTime: 'Your time',
    serverTimeShort: 'Server time',
    weekStart: 'Week starts on',
    sunday: 'Sunday',
    monday: 'Monday',
    motion: 'Animations',
    motionSystem: 'System',
    motionReduced: 'Reduced',
    motionFull: 'Full',
    eventsShown: 'Events shown',
    eventsShownHint: 'Hidden kinds of events disappear from every view.',
    language: 'Language',
  },
  support: {
    beer: 'Buy me a beer',
    choose: 'Pick a way to tip the innkeeper:',
  },
  legal: {
    disclaimer:
      'Fan-made. Not affiliated with or endorsed by Blizzard Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc.',
  },
} as const;

/** Deep shape of `en` with literal strings widened, so other languages can fill it in. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : { readonly [K in keyof T]: Widen<T[K]> };

export type Strings = Widen<typeof en>;
