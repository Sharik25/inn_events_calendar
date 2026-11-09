import { screen } from '@testing-library/react';
import { GARLAND_HEIGHT } from '@/ui';
import { renderRoute } from '@/test/renderRoute';

const root = () => document.documentElement.style;

afterEach(() => {
  vi.useRealTimers();
});

describe('room for the top decorations', () => {
  it('reserves the December garland’s height on <html>, for the layout and the sheets', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-20T18:00:00Z')); // Forever: Winter Veil (estimated)
    renderRoute('/forever/today');
    await screen.findByTestId('festive-garland');
    expect(root().getPropertyValue('--top-decoration-height')).toBe(`${GARLAND_HEIGHT.desktop}px`);
    expect(root().getPropertyValue('--top-decoration-height-m')).toBe(`${GARLAND_HEIGHT.mobile}px`);
  });

  it('reserves the bunting’s height on a Darkmoon Faire day, and nothing on a quiet day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-12T18:00:00Z'));
    const faire = renderRoute('/forever/today');
    await screen.findByRole('heading', { level: 1, name: 'Darkmoon Faire' });
    expect(root().getPropertyValue('--top-decoration-height')).toBe('40px');
    expect(root().getPropertyValue('--top-decoration-height-m')).toBe('28px');
    faire.unmount();
    expect(root().getPropertyValue('--top-decoration-height')).toBe('');

    vi.setSystemTime(new Date('2026-11-26T18:00:00Z'));
    renderRoute('/forever/today');
    await screen.findByRole('heading', { level: 1, name: 'A quiet day at the inn' });
    expect(root().getPropertyValue('--top-decoration-height')).toBe('0px');
  });
});
