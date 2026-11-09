import { screen, within } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';

const NOW = new Date('2026-10-27T11:00:00Z'); // Tue Oct 27, 12:00 Paris

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('event sheet: experience & rewards', () => {
  it('shows the version’s quest, rewards and source when the data has them', async () => {
    renderRoute('/anniversary/today?event=stv-fishing');
    const sheet = await screen.findByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' });
    expect(
      within(sheet).getByRole('heading', { name: 'Experience & rewards' }),
    ).toBeInTheDocument();
    const quests = within(sheet).getByRole('list', { name: 'Quests' });
    expect(within(quests).getByText('Master Angler')).toBeInTheDocument();
    expect(within(quests).getByText('Arcanite Fishing Pole')).toBeInTheDocument();
    expect(within(quests).getByText('Hook of the Master Angler')).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: /Rewards source/ })).toHaveAttribute(
      'href',
      'https://www.wowhead.com/tbc/quest=8193/master-angler',
    );
  });

  it('hides the section when the event has no data for this version', async () => {
    renderRoute('/anniversary/today?event=hallows-end');
    const sheet = await screen.findByRole('dialog', { name: "Hallow's End" });
    expect(
      within(sheet).queryByRole('heading', { name: 'Experience & rewards' }),
    ).not.toBeInTheDocument();
  });
});
