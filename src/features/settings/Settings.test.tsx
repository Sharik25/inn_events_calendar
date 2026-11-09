import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FEATURES } from '@/config';
import { useSettings } from '@/state/settings';
import { renderRoute } from '@/test/renderRoute';

const NOW = new Date('2026-10-27T11:00:00Z'); // Tue Oct 27, 12:00 Paris

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

afterEach(() => {
  FEATURES.subscribe = false;
  FEATURES.eventFilter = false;
});

async function openSettings(path = '/anniversary/today', settings = {}) {
  const user = userEvent.setup();
  const utils = renderRoute(path, settings);
  await screen.findByRole('heading', { level: 1 });
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  const sheet = await screen.findByRole('dialog', { name: 'Settings & info' });
  return { user, sheet, ...utils };
}

describe('settings', () => {
  it('switches displayed times between your time and server time', async () => {
    // Paris user following Americas (Pacific) realms: US Hallow's End ends Nov 1, 10:00 PST,
    // which is 19:00 in Paris.
    const { user, sheet } = await openSettings('/anniversary/today', {
      regionByVersion: { anniversary: 'us' },
    });
    expect(screen.getByText(/Nov 1, 19:00/)).toBeInTheDocument();
    const group = within(sheet).getByRole('group', { name: 'Show times in' });
    expect(within(group).getByRole('radio', { name: 'Your time' })).toBeChecked();
    await user.click(within(group).getByRole('radio', { name: 'Server time' }));
    expect(useSettings.getState().timeDisplay).toBe('server');
    await user.keyboard('{Escape}');
    expect(screen.getByText(/Nov 1, 10:00/)).toBeInTheDocument();
    expect(screen.queryByText(/Nov 1, 19:00/)).not.toBeInTheDocument();
  });

  it('changes the first day of the week', async () => {
    const { user, sheet, router } = await openSettings('/anniversary/week/2026-10-26', {
      weekStartsOn: 1,
    });
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Week starts on' })).getByRole('radio', {
        name: 'Sunday',
      }),
    );
    expect(useSettings.getState().weekStartsOn).toBe(0);
    await user.keyboard('{Escape}');
    // The week containing the viewed date now starts on Sunday.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Oct 25 – 31, 2026' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/anniversary/week/2026-10-26');
  });

  it('turns animations off and back to the system preference', async () => {
    const { user, sheet, container } = await openSettings();
    const group = within(sheet).getByRole('group', { name: 'Animations' });
    await user.click(within(group).getByRole('radio', { name: 'Reduced' }));
    expect(useSettings.getState().reducedMotion).toBe('on');
    await waitFor(() => expect(container.querySelector('[data-kind]')).not.toBeInTheDocument());
    await user.click(within(group).getByRole('radio', { name: 'System' }));
    expect(useSettings.getState().reducedMotion).toBe('system');
  });

  it('hides the "Events shown" filter for now, and ignores choices saved with it', async () => {
    const { sheet } = await openSettings('/anniversary/day/2026-10-25', {
      hiddenCategories: ['milestone', 'fishing'],
    });
    expect(within(sheet).queryByRole('group', { name: 'Events shown' })).toBeNull();
    // Sun Oct 25: the fishing contest still shows, although an old setting hid fishing.
    expect(
      screen.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' }),
    ).toBeInTheDocument();
  });

  it('hides a kind of event everywhere (filter shown)', async () => {
    FEATURES.eventFilter = true;
    const { user, sheet } = await openSettings('/anniversary/today');
    const group = within(sheet).getByRole('group', { name: 'Events shown' });
    const kinds = within(group)
      .getAllByRole('checkbox')
      .map((c) => c.closest('label')?.textContent);
    expect(kinds).toEqual(['Holiday', 'Faire', 'Fishing']);

    await user.click(within(group).getByRole('checkbox', { name: 'Fishing' }));
    expect(useSettings.getState().hiddenCategories).toEqual(['milestone', 'fishing']);
    await user.keyboard('{Escape}');
    const soon = screen.getByRole('region', { name: 'Coming soon' });
    expect(within(soon).queryByRole('link', { name: /Fishing/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('checkbox', { name: 'Fishing' }));
    expect(useSettings.getState().hiddenCategories).toEqual(['milestone']);
  });
});
