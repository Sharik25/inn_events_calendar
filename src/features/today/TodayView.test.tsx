import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSettings } from '@/state/settings';
import { renderRoute } from '@/test/renderRoute';

// User is in Europe/Paris (see vite.config.ts) → EU region is guessed.
const NOW = new Date('2026-10-27T11:00:00Z'); // Tue Oct 27, 12:00 Paris

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('routing', () => {
  it('redirects / to Forever by default, and to the version picked in the switcher', async () => {
    const { router, unmount } = renderRoute('/');
    expect(await screen.findByRole('heading', { name: 'WoW: Forever' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/forever/today');
    unmount();

    const picked = renderRoute('/', { chosenVersionId: 'anniversary' });
    expect(
      await screen.findByRole('heading', { level: 1, name: "Hallow's End" }),
    ).toBeInTheDocument();
    expect(picked.router.state.location.pathname).toBe('/anniversary/today');
  });

  it('opens URLs without a version in the start version, keeping view, date and query', async () => {
    const month = renderRoute('/month/2026-11');
    await screen.findByRole('heading', { name: 'WoW: Forever' });
    expect(month.router.state.location.pathname).toBe('/forever/month/2026-11');
    month.unmount();

    const day = renderRoute('/day/2026-10-27?event=hallows-end', {
      chosenVersionId: 'anniversary',
    });
    await screen.findByRole('dialog', { name: "Hallow's End" });
    expect(day.router.state.location.pathname).toBe('/anniversary/day/2026-10-27');
    expect(day.router.state.location.search).toBe('?event=hallows-end');
    day.unmount();

    const today = renderRoute('/today');
    await screen.findByRole('heading', { name: 'WoW: Forever' });
    expect(today.router.state.location.pathname).toBe('/forever/today');
  });

  it('ignores a picked version that no longer exists', async () => {
    const { router } = renderRoute('/', { chosenVersionId: 'retired-long-ago' });
    await screen.findByRole('heading', { name: 'WoW: Forever' });
    expect(router.state.location.pathname).toBe('/forever/today');
  });

  it('shows Not Found for an unknown version or path', async () => {
    renderRoute('/retail/today');
    expect(
      await screen.findByRole('heading', { name: 'Lost in the Twisting Nether' }),
    ).toBeInTheDocument();
  });

  it('sends a malformed date to Today', async () => {
    const { router } = renderRoute('/anniversary/day/2026-02-31');
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe('/anniversary/today');
  });
});

describe('Today view', () => {
  it("shows Hallow's End as the dominant event with a live countdown", async () => {
    renderRoute('/anniversary/today');
    expect(
      await screen.findByRole('heading', { level: 1, name: "Hallow's End" }),
    ).toBeInTheDocument();
    // EU ends Nov 1 10:00 CET = 09:00Z → 4d 22h from 11:00Z Oct 27.
    expect(screen.getByText('Ends in 4d 22h')).toBeInTheDocument();
    expect(screen.queryByText('Unconfirmed')).not.toBeInTheDocument(); // verified date
    expect(screen.getByText(/^Trick-or-treat at the inns/)).toBeInTheDocument(); // summary
    expect(screen.queryByText('Trick-or-treat at innkeepers')).not.toBeInTheDocument(); // details only

    const soon = screen.getByRole('region', { name: 'Coming soon' });
    expect(within(soon).getByRole('link', { name: /Fishing in 5d/ })).toBeInTheDocument();
    expect(within(soon).getByRole('link', { name: /Darkmoon Faire in 12d/ })).toBeInTheDocument();
    expect(within(soon).queryByText(/Winter Veil/)).not.toBeInTheDocument(); // beyond 30 days
  });

  it('opens and closes the event sheet via ?event=', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/anniversary/today');
    await user.click(await screen.findByRole('link', { name: "Details for Hallow's End" }));

    const dialog = await screen.findByRole('dialog', { name: "Hallow's End" });
    expect(router.state.location.search).toBe('?event=hallows-end');
    // Compact sheet (rev. 3): countdown and details, no time tables or export buttons.
    expect(within(dialog).getByText('Ends in 4d 22h')).toBeInTheDocument();
    expect(within(dialog).queryByText(/^(Europe|Americas) server time/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /\.ics/ })).not.toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Date source/ })).toHaveAttribute(
      'href',
      expect.stringContaining('warcrafttavern.com'),
    );

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.search).toBe('');
  });

  it('picks Fireworks over Midsummer on Jul 4 and lists Midsummer as also on', async () => {
    renderRoute('/anniversary/day/2026-07-04');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Fireworks Spectacular' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Unconfirmed').length).toBeGreaterThan(0);
    const also = screen.getByRole('region', { name: 'Also on this day' });
    expect(within(also).getByRole('link', { name: 'Midsummer Fire Festival' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to today/ })).toBeInTheDocument();
  });

  it('shows a quiet day, with coming-soon distances counted from that day', async () => {
    renderRoute('/anniversary/day/2026-11-24');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' }),
    ).toBeInTheDocument();
    const soon = screen.getByRole('region', { name: 'Coming soon' });
    // Next fishing is Sun Nov 29 14:00 → 5 days after the start of Nov 24, not 33 days from now.
    // On a quiet day the cards are the inn cards: emblem, name, date and distance.
    const fishing = within(soon).getByRole('link', {
      name: 'Stranglethorn Fishing Extravaganza, Sun, Nov 29, in 5d',
    });
    expect(fishing).toHaveClass('inn');
    expect(fishing.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps the small "Coming soon" chips on days with events', async () => {
    renderRoute('/anniversary/day/2026-11-15'); // Darkmoon Faire
    await screen.findByRole('heading', { level: 1, name: 'Darkmoon Faire' });
    const soon = screen.getByRole('region', { name: 'Coming soon' });
    const links = within(soon).getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveClass('chip');
      expect(link.querySelector('svg')).toBeNull();
    }
  });

  it('shows countdowns only on Today', async () => {
    renderRoute('/anniversary/day/2026-11-15');
    await screen.findByRole('heading', { level: 1, name: 'Darkmoon Faire' });
    expect(screen.queryByText(/Starts in|Ends in/)).not.toBeInTheDocument();
  });

  it('opens a secondary event from its card', async () => {
    const user = userEvent.setup();
    renderRoute('/anniversary/day/2026-11-15'); // DMF Sunday + fishing
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Darkmoon Faire' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' }));
    expect(
      await screen.findByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' }),
    ).toBeInTheDocument();
  });

  it('navigates days with arrows and keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1 });

    // Like a person, wait for each day to render before the next key press.
    const dayShown = (date: string) =>
      waitFor(() => expect(document.querySelector(`time[datetime="${date}"]`)).toBeInTheDocument());

    await user.click(screen.getByRole('link', { name: 'Next day' }));
    await dayShown('2026-10-28');
    expect(router.state.location.pathname).toBe('/anniversary/day/2026-10-28');

    await user.keyboard('{ArrowLeft}');
    await dayShown('2026-10-27');
    await user.keyboard('{ArrowLeft}');
    await dayShown('2026-10-26');
    expect(router.state.location.pathname).toBe('/anniversary/day/2026-10-26');

    await user.keyboard('t');
    await dayShown('2026-10-27');
    expect(router.state.location.pathname).toBe('/anniversary/today');
  });

  it('follows the selected region', async () => {
    const user = userEvent.setup();
    renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('button', { name: 'Anniversary · Europe' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('radio', { name: 'Americas' }));
    expect(useSettings.getState().regionByVersion.anniversary).toBe('us');
    await user.keyboard('{Escape}');
    // US ends Nov 1 10:00 PST = 18:00Z → 5d 7h.
    expect(await screen.findByText('Ends in 5d 7h')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anniversary · Americas' })).toBeInTheDocument();
  });

  it('ticks the countdown each minute', async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    // 4d 22h 30m before the end: half an hour away from any display boundary, so scheduling
    // drift on slow machines can't change the expected text.
    vi.setSystemTime(new Date('2026-10-27T10:30:00Z'));
    renderRoute('/anniversary/today');
    // 3s like Testing Library's queries (test/setup.ts): the route loads async.
    await vi.waitFor(() => screen.getByText('Ends in 4d 22h'), { timeout: 3000 });
    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });
    await vi.waitFor(() => expect(screen.getByText('Ends in 4d 21h')).toBeInTheDocument(), {
      timeout: 3000,
    });
  });
});

describe('event themes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("decorates Hallow's End with art, a numeral ornament and ember particles", async () => {
    const { container } = renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1, name: "Hallow's End" });
    // Minimal set: cobweb, spider and two bats (no large corner objects).
    await waitFor(() => expect(screen.getByTestId('decorations-layer').children).toHaveLength(4));
    expect(container.querySelector('[data-kind="embers"]')).toBeInTheDocument();
    expect(container.querySelector('[data-placement="corner"] svg')).toBeInTheDocument();
  });

  it('drops particles and stills decorations when reduced motion is on', async () => {
    const { container } = renderRoute('/anniversary/today', { reducedMotion: 'on' });
    await screen.findByRole('heading', { level: 1, name: "Hallow's End" });
    await waitFor(() =>
      expect(screen.getByTestId('decorations-layer')).toHaveAttribute('data-motion', 'reduce'),
    );
    expect(container.querySelector('[data-kind]')).not.toBeInTheDocument();
  });

  it("dresses 'Also on this day' cards in their own event theme with an emblem", async () => {
    renderRoute('/anniversary/day/2026-11-15'); // Darkmoon Faire + fishing
    await screen.findByRole('heading', { level: 1, name: 'Darkmoon Faire' });
    const link = screen.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' });
    const card = link.closest('article') as HTMLElement;
    expect(card).toHaveAttribute('data-theme', 'fishing');
    await waitFor(() => expect(card.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument());
  });

  it('uses Winter Veil art in December', async () => {
    renderRoute('/anniversary/day/2026-12-20');
    await screen.findByRole('heading', { level: 1, name: 'Feast of Winter Veil' });
    await waitFor(() =>
      expect(
        document.querySelector('[data-theme="winter-veil"] [data-kind="snow"]'),
      ).toBeInTheDocument(),
    );
  });
});
