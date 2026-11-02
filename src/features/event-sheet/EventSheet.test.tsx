import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useChecklist } from '@/state/checklist';
import { renderRoute } from '@/test/renderRoute';

const NOW = new Date('2026-10-27T11:00:00Z'); // Tue Oct 27, 12:00 Paris

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  useChecklist.setState({ done: {} });
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

describe('event sheet: checklist', () => {
  it('ticks off a quest for this occurrence and shows progress on the cards', async () => {
    const user = userEvent.setup();
    // Sun Oct 25: Hallow's End leads, the fishing contest is an "Also on this day" card.
    renderRoute('/anniversary/day/2026-10-25');
    await screen.findByRole('heading', { level: 1, name: "Hallow's End" });
    const card = screen.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' });
    const article = card.closest('article')!;
    expect(within(article).getByLabelText('0 of 1 done')).toHaveTextContent('✓ 0/1');
    // Hallow's End has no checklist data: no pill on the hero.
    expect(screen.queryByLabelText(/of \d+ done/, { selector: '[class*="timing"] *' })).toBeNull();

    await user.click(card);
    const sheet = await screen.findByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' });
    const checklist = within(sheet).getByRole('region', { name: /Checklist/ });
    const quest = within(checklist).getByRole('checkbox', { name: /Master Angler/ });
    await user.click(quest);
    expect(quest).toBeChecked();
    expect(within(checklist).getByText('1 of 1 done')).toBeInTheDocument();
    expect(within(article).getByLabelText('1 of 1 done')).toHaveTextContent('✓ 1/1');
    expect(Object.keys(useChecklist.getState().done)).toEqual([
      'anniversary:stv-fishing:2026-10-25T13:00:00.000Z',
    ]);
  });

  it('starts fresh for the next occurrence', async () => {
    useChecklist.setState({
      done: { 'anniversary:stv-fishing:2026-10-25T13:00:00.000Z': ['quest-master-angler'] },
    });
    renderRoute('/anniversary/day/2026-11-22');
    await screen.findByRole('heading', { level: 1, name: 'Stranglethorn Fishing Extravaganza' });
    expect(screen.getByLabelText('0 of 1 done')).toBeInTheDocument();
  });

  it('has no checklist for events without checklist data', async () => {
    renderRoute('/anniversary/today?event=hallows-end');
    const sheet = await screen.findByRole('dialog', { name: "Hallow's End" });
    expect(within(sheet).queryByRole('region', { name: /Checklist/ })).toBeNull();
  });
});
