import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ICAL from 'ical.js';
import { ESTIMATED_NOTE } from '@/data/schedules';
import { renderRoute } from '@/test/renderRoute';

/** Captures what downloadText() would save. */
function captureDownloads() {
  const files: Promise<string>[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    files.push((blob as Blob).text());
    return 'blob:test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return files;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-20T18:00:00Z')); // Forever is live; Winter Veil (estimated)
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('WoW: Forever holidays', () => {
  it('shows an estimated holiday with the same card, an "Estimated" tag and the reason', async () => {
    renderRoute('/forever/today');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Feast of Winter Veil' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Estimated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estimated' })).toBeInTheDocument(); // info tip

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Details for Feast of Winter Veil' }));
    const sheet = await screen.findByRole('dialog', { name: 'Feast of Winter Veil' });
    expect(within(sheet).getByText(ESTIMATED_NOTE)).toBeInTheDocument();
  });

  it('exports an estimated holiday as tentative, with the note in the description', async () => {
    const files = captureDownloads();
    const user = userEvent.setup();
    renderRoute('/forever/today');
    await screen.findByRole('heading', { level: 1, name: 'Feast of Winter Veil' });
    await user.click(screen.getByRole('button', { name: 'Add to calendar' }));
    const sheet = await screen.findByRole('dialog', { name: 'Add to calendar' });
    await user.click(within(sheet).getByRole('button', { name: 'Apple / Outlook (.ics)' }));

    const cal = new ICAL.Component(ICAL.parse(await files[0]!));
    const event = new ICAL.Event(cal.getFirstSubcomponent('vevent')!);
    expect(event.summary).toBe('(tentative) Feast of Winter Veil');
    expect(event.description).toContain(ESTIMATED_NOTE);
    expect(event.uid).toMatch(/^forever:winter-veil:2026-12-15/);
  });

  it("a quiet day is the Anniversary inn with Forever's blue stars on top", async () => {
    vi.setSystemTime(new Date('2026-11-24T18:00:00Z')); // no events in either version
    const forever = renderRoute('/forever/today');
    await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' });
    const shell = forever.container.querySelector('[data-theme]')!;
    expect(shell).toHaveAttribute('data-theme', 'base'); // same tokens as Anniversary
    expect(document.documentElement.dataset.versionStyle).toBe('classic');
    // Forever's stars (its particles and decorations) in their own theme scope.
    await waitFor(() =>
      expect(
        forever.container.querySelector('[data-theme="forever"] [data-kind="sparkles"]'),
      ).toBeInTheDocument(),
    );
    forever.unmount();

    const anniversary = renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' });
    expect(anniversary.container.querySelector('[data-theme]')).toHaveAttribute(
      'data-theme',
      'base',
    );
    expect(anniversary.container.querySelector('[data-kind="sparkles"]')).toBeNull();
  });

  it('an event day in Forever still wears the event theme', async () => {
    const { container } = renderRoute('/forever/today'); // Dec 20: Winter Veil
    await screen.findByRole('heading', { level: 1, name: 'Feast of Winter Veil' });
    await waitFor(() =>
      expect(container.querySelector('[data-theme="winter-veil"]')).toBeInTheDocument(),
    );
  });
});
