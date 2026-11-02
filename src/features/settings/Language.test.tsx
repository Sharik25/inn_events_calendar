import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SETTINGS_STORAGE_KEY, useSettings } from '@/state/settings';
import { setActiveLanguage } from '@/strings';
import { renderRoute } from '@/test/renderRoute';

const NOW = new Date('2026-11-24T11:00:00Z'); // a quiet Tuesday on Anniversary

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setActiveLanguage('en');
});

describe('language', () => {
  it('follows the browser language by default', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA', 'en']);
    renderRoute('/anniversary/today');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Une journée tranquille à l’auberge' }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('falls back to English for an unsupported browser language', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja-JP']);
    renderRoute('/anniversary/today');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' }),
    ).toBeInTheDocument();
  });

  it('switches from the settings sheet, keeps the sheet open and remembers the choice', async () => {
    const user = userEvent.setup();
    renderRoute('/anniversary/today');
    await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' });
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const sheet = await screen.findByRole('dialog', { name: 'Settings & info' });

    await user.selectOptions(within(sheet).getByRole('combobox', { name: 'Language' }), 'Русский');

    expect(
      await screen.findByRole('dialog', { name: 'Настройки и информация' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Язык' })).toHaveValue('ru');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Тихий день в таверне' }),
    ).toBeInTheDocument();
    expect(useSettings.getState().language).toBe('ru');
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!).state.language).toBe('ru');
  });
});
