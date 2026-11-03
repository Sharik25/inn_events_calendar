import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSettings } from '@/state/settings';
import { renderRoute } from '@/test/renderRoute';

const NOW = new Date('2026-10-27T11:00:00Z'); // Tue Oct 27, 12:00 Paris
const monday = { weekStartsOn: 1 as const };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('version picker', () => {
  it('lists versions with their status and switches keeping the view and date', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/anniversary/week/2026-10-26', monday);
    await screen.findByRole('heading', { level: 1, name: 'Oct 26 – Nov 1, 2026' });

    const slot = screen.getByRole('button', { name: 'Version' });
    expect(slot).toHaveAttribute('aria-expanded', 'false');
    await user.click(slot);
    expect(slot).toHaveAttribute('aria-expanded', 'true');

    const picker = screen.getByRole('dialog', { name: 'Choose version' });
    const anniversary = within(picker).getByRole('button', { name: /Anniversary \(TBC Classic\)/ });
    expect(anniversary).toHaveAttribute('aria-current', 'true');
    expect(anniversary).toHaveFocus();
    expect(anniversary).toHaveTextContent('Live');
    // 3:00 pm PT on Nov 4 = 00:00 on Nov 5 for a Paris user.
    const forever = within(picker).getByRole('button', { name: /WoW: Forever/ });
    expect(forever).toHaveTextContent('Launches Thu, Nov 5, 00:00');

    await user.click(forever);
    expect(router.state.location.pathname).toBe('/forever/week/2026-10-26');
    expect(screen.queryByRole('dialog', { name: 'Choose version' })).not.toBeInTheDocument();
    expect(useSettings.getState().chosenVersionId).toBe('forever');
  });

  it('opens from the top-bar chip and the V key; Escape closes and arrows move focus', async () => {
    const user = userEvent.setup();
    renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1, name: "Hallow's End" });

    await user.click(screen.getByRole('button', { name: 'Anniversary · Europe' }));
    expect(screen.getByRole('dialog', { name: 'Choose version' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /WoW: Forever/ })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Choose version' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anniversary · Europe' })).toHaveFocus();

    await user.keyboard('v');
    expect(screen.getByRole('dialog', { name: 'Choose version' })).toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('dialog', { name: 'Choose version' })).not.toBeInTheDocument();
  });
});

describe('WoW: Forever before and after launch', () => {
  it('shows a themed launch countdown in every view, with a way back', async () => {
    const { container } = renderRoute('/forever/month/2026-11');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'WoW: Forever' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Launches in 8d 12h')).toBeInTheDocument();
    expect(screen.getByText('Thu, Nov 5, 00:00 your time')).toBeInTheDocument();
    expect(screen.getByText('Wed, Nov 4, 15:00 (All realms)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Anniversary' })).toHaveAttribute(
      'href',
      '/anniversary/month/2026-11',
    );
    await waitFor(() =>
      expect(container.querySelector('[data-theme="forever"]')).toBeInTheDocument(),
    );
    // November has a Darkmoon Faire, but before launch the screen keeps the Forever theme.
    expect(container.querySelector('[data-theme="darkmoon-faire"]')).not.toBeInTheDocument();
    // Single realmless region: no region switcher.
    expect(screen.getByRole('button', { name: 'Forever · All realms' })).toBeInTheDocument();
  });

  it('becomes a normal calendar once the launch time has passed', async () => {
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
    const user = userEvent.setup();
    renderRoute('/forever/today');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Launches in/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Version' }));
    expect(screen.getByRole('button', { name: /WoW: Forever/ })).toHaveTextContent('Live');
  });

  it('settings for a realmless version hide the region switcher and offer its one feed', async () => {
    const user = userEvent.setup();
    renderRoute('/forever/today');
    await screen.findByRole('heading', { level: 1, name: 'WoW: Forever' });
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const sheet = await screen.findByRole('dialog', { name: 'Settings & info' });
    expect(within(sheet).queryByRole('group', { name: 'Server region' })).not.toBeInTheDocument();
    expect(
      within(sheet).getByRole('heading', { name: 'Subscribe to all events' }),
    ).toBeInTheDocument();
    expect(within(sheet).getByRole('textbox', { name: 'Feed address' })).toHaveValue(
      'http://localhost:3000/calendars/forever-global.ics',
    );
  });

  it('remembers only a version picked in the switcher, not one just visited', async () => {
    const user = userEvent.setup();
    renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1, name: "Hallow's End" });
    expect(useSettings.getState().chosenVersionId).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Version' }));
    await user.click(screen.getByRole('button', { name: /Anniversary \(TBC Classic\)/ }));
    expect(useSettings.getState().chosenVersionId).toBe('anniversary');
  });
});
