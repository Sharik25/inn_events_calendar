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

  it("shows each quest's experience, and when it depends on the character's level", async () => {
    renderRoute('/forever/day/2026-11-12?event=darkmoon-faire&on=2026-11-12');
    const sheet = await screen.findByRole('dialog', { name: 'Darkmoon Faire' });
    const quests = within(sheet).getByRole('list', { name: 'Quests' });
    const quest = (name: string) => within(quests).getByText(name).closest('li')!;
    expect(quest('The Darkmoon Faire')).toHaveTextContent('660 XP');
    expect(quest('The Darkmoon Faire')).not.toHaveTextContent(/Full XP/); // the same at any level
    expect(quest('Darkmoon Beast Deck')).toHaveTextContent('560 XP');
    expect(quest('Darkmoon Beast Deck')).toHaveTextContent('Full XP through level 60');
    expect(within(sheet).getByText(/six or more levels above them/)).toBeInTheDocument();
  });

  it('shows no experience block where a version has no quest data', async () => {
    renderRoute('/anniversary/day/2026-11-12?event=darkmoon-faire&on=2026-11-12');
    const faire = await screen.findByRole('dialog', { name: 'Darkmoon Faire' });
    expect(within(faire).queryByText(/XP/)).not.toBeInTheDocument();
    expect(within(faire).queryByRole('heading', { name: 'Experience & rewards' })).toBeNull();
  });
});

describe('event sheet: battleground weeks', () => {
  it('shows the week’s details and no experience block', async () => {
    renderRoute('/forever/day/2026-11-12?event=call-to-arms-warsong-gulch&on=2026-11-12');
    const sheet = await screen.findByRole('dialog', { name: 'Call to Arms: Warsong Gulch' });
    expect(within(sheet).getByText('PvP')).toBeInTheDocument();
    expect(
      within(sheet).getByText('Increased Honor in Warsong Gulch all week'),
    ).toBeInTheDocument();
    expect(within(sheet).queryByRole('heading', { name: 'Experience & rewards' })).toBeNull();
  });
});

describe('event sheet: where (per faction)', () => {
  it('lists the Alliance and Horde places with the note, in both versions', async () => {
    for (const path of [
      '/forever/day/2026-12-20?event=winter-veil&on=2026-12-20',
      '/anniversary/day/2026-12-20?event=winter-veil&on=2026-12-20',
    ]) {
      const { unmount } = renderRoute(path);
      const sheet = await screen.findByRole('dialog', { name: 'Feast of Winter Veil' });
      expect(within(sheet).getByRole('heading', { name: 'Where' })).toBeInTheDocument();
      expect(within(sheet).getByText('Greatfather Winter visits')).toBeInTheDocument();
      expect(within(sheet).getByText('Alliance').nextElementSibling).toHaveTextContent('Ironforge');
      expect(within(sheet).getByText('Horde').nextElementSibling).toHaveTextContent('Orgrimmar');
      expect(within(sheet).getByText(/As the current game holds it/)).toBeInTheDocument();
      // Same page as "Learn more": its source isn't listed twice.
      expect(within(sheet).queryByRole('link', { name: /Location source/ })).toBeNull();
      unmount();
    }
  });

  it('shows every town for the egg hunt, and nothing for an event without places', async () => {
    const { unmount } = renderRoute('/anniversary/today?event=noblegarden');
    const sheet = await screen.findByRole('dialog', { name: 'Noblegarden' });
    expect(within(sheet).getByText('Horde').nextElementSibling).toHaveTextContent(
      'Razor Hill, Bloodhoof Village, Brill, Falconwing Square',
    );
    unmount();
    renderRoute('/anniversary/today?event=new-year');
    const newYear = await screen.findByRole('dialog', { name: /New Year/ });
    expect(within(newYear).queryByRole('heading', { name: 'Where' })).toBeNull();
  });
});
