import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ICAL from 'ical.js';
import { renderRoute } from '@/test/renderRoute';
import { feedUrls } from './feedUrls';

const NOW = new Date('2026-10-27T11:00:00Z');

/** Captures what downloadText() would save. */
function captureDownloads() {
  const files: { name: string; text: Promise<string> }[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    files.push({ name: '', text: (blob as Blob).text() });
    return 'blob:test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    const last = files[files.length - 1];
    if (last) last.name = this.download;
  });
  return files;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Parses a downloaded .ics into its events. */
async function parseEvents(file: { text: Promise<string> } | undefined) {
  const cal = new ICAL.Component(ICAL.parse(await file!.text));
  return cal.getAllSubcomponents('vevent').map((c) => new ICAL.Event(c));
}

async function openExportSheet() {
  const user = userEvent.setup();
  renderRoute('/anniversary/today');
  await screen.findByRole('heading', { level: 1, name: "Hallow's End" });
  await user.click(screen.getByRole('button', { name: 'Add to calendar' }));
  return { user, sheet: await screen.findByRole('dialog', { name: 'Add to calendar' }) };
}

describe('Add to calendar', () => {
  it('hero sheet: Google link and a single-event .ics by default', async () => {
    const files = captureDownloads();
    const { user, sheet } = await openExportSheet();

    const google = new URL(
      within(sheet).getByRole('link', { name: 'Google Calendar' }).getAttribute('href') ?? '',
    );
    expect(google.searchParams.get('text')).toBe("Hallow's End");
    expect(google.searchParams.get('dates')).toBe('20261018T080000Z/20261101T090000Z');

    const ics = within(sheet).getByRole('button', { name: 'Apple / Outlook (.ics)' });
    expect(ics).toHaveAccessibleDescription('1 event in the file');
    await user.click(ics);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(files[0]?.name).toBe('hallows-end-2026-10-18.ics');
    const [event, ...rest] = await parseEvents(files[0]);
    expect(rest).toHaveLength(0);
    expect(event?.uid).toBe('anniversary:hallows-end:2026-10-18T08:00:00.000Z@innkeepers-almanac');
    expect(event?.description).toContain(
      'http://localhost:3000/anniversary/day/2026-10-18?event=hallows-end',
    );
  });

  it('lists the one-day events during a long event and adds the picked ones to the .ics', async () => {
    const files = captureDownloads();
    const { user, sheet } = await openExportSheet();

    // Fishing Sundays inside Hallow's End (Oct 18 – Nov 1, 10:00 Paris); Nov 1 starts after it ends.
    const group = within(sheet).getByRole('group', {
      name: "One-day events during Hallow's End",
    });
    const boxes = within(group).getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);
    expect(boxes.every((b) => !(b as HTMLInputElement).checked)).toBe(true);
    expect(boxes[0]).toHaveAccessibleName(/Stranglethorn Fishing Extravaganza.*Oct 18/);
    expect(boxes[1]).toHaveAccessibleName(/Stranglethorn Fishing Extravaganza.*Oct 25/);

    await user.click(boxes[1]!);
    const ics = within(sheet).getByRole('button', { name: 'Apple / Outlook (.ics)' });
    expect(ics).toHaveAccessibleDescription('2 events in the file');
    // Google adds one event per link: the picked extra gets its own.
    const extraLink = within(sheet).getByRole('link', { name: /^Google Calendar: Stranglethorn/ });
    expect(new URL(extraLink.getAttribute('href') ?? '').searchParams.get('dates')).toBe(
      '20261025T130000Z/20261025T150000Z',
    );

    await user.click(ics);
    const events = await parseEvents(files[0]);
    expect(events.map((e) => e.uid)).toEqual([
      'anniversary:hallows-end:2026-10-18T08:00:00.000Z@innkeepers-almanac',
      'anniversary:stv-fishing:2026-10-25T13:00:00.000Z@innkeepers-almanac',
    ]);
  });

  it('select all toggles every one-day event', async () => {
    const { user, sheet } = await openExportSheet();
    await user.click(within(sheet).getByRole('button', { name: 'Select all' }));
    expect(
      within(sheet)
        .getAllByRole('checkbox')
        .every((b) => (b as HTMLInputElement).checked),
    ).toBe(true);
    expect(
      within(sheet).getByRole('button', { name: 'Apple / Outlook (.ics)' }),
    ).toHaveAccessibleDescription('3 events in the file');
    await user.click(within(sheet).getByRole('button', { name: 'Clear all' }));
    expect(
      within(sheet)
        .getAllByRole('checkbox')
        .some((b) => (b as HTMLInputElement).checked),
    ).toBe(false);
  });

  it('sheet closes on Escape and restores focus to the button', async () => {
    const { user } = await openExportSheet();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to calendar' })).toHaveFocus();
  });
});

describe('Subscribe', () => {
  it('builds feed URLs for the version and region', () => {
    const urls = feedUrls(
      { id: 'anniversary' } as never,
      { id: 'eu', label: 'Europe', timeZone: 'Europe/Paris' },
      'https://almanac.example',
    );
    expect(urls).toEqual({
      path: '/calendars/anniversary-eu.ics',
      https: 'https://almanac.example/calendars/anniversary-eu.ics',
      webcal: 'webcal://almanac.example/calendars/anniversary-eu.ics',
      google:
        'https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Falmanac.example%2Fcalendars%2Fanniversary-eu.ics',
    });
  });

  it('settings show the feed with copy, and fall back to download without HTTPS', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1 });
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const sheet = await screen.findByRole('dialog', { name: 'Settings & info' });

    expect(
      within(sheet).getByRole('heading', { name: 'Subscribe to all events' }),
    ).toBeInTheDocument();
    const field = within(sheet).getByRole('textbox', { name: 'Feed address' });
    expect(field).toHaveValue('http://localhost:3000/calendars/anniversary-eu.ics');
    await user.click(within(sheet).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/calendars/anniversary-eu.ics');
    await waitFor(() =>
      expect(within(sheet).getByRole('button', { name: 'Copied!' })).toBeInTheDocument(),
    );

    // jsdom runs on http: → no webcal buttons, explain and offer the file.
    expect(within(sheet).queryByRole('link', { name: 'Apple Calendar' })).not.toBeInTheDocument();
    expect(within(sheet).getByText(/published site \(HTTPS\)/)).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: 'Download .ics instead' })).toHaveAttribute(
      'href',
      '/calendars/anniversary-eu.ics',
    );
  });
});
