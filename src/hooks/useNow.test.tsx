import { act, render, screen } from '@testing-library/react';
import { useNow } from './useNow';

function Clock() {
  return <output>{useNow().toISOString()}</output>;
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-02T23:59:30Z'));
});

afterEach(() => {
  setVisibility('visible');
  vi.useRealTimers();
});

describe('useNow', () => {
  it('ticks at the next minute boundary', () => {
    render(<Clock />);
    expect(screen.getByRole('status')).toHaveTextContent('2026-11-02T23:59:30.000Z');
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole('status')).toHaveTextContent('2026-11-03T00:00:00.000Z');
  });

  it('catches up at once when the tab becomes visible again', () => {
    render(<Clock />);
    act(() => setVisibility('hidden'));
    // Hours pass while the background timer is throttled (system clock moves, timers don't fire).
    vi.setSystemTime(new Date('2026-11-03T07:15:10Z'));
    act(() => setVisibility('visible'));
    expect(screen.getByRole('status')).toHaveTextContent('2026-11-03T07:15:10.000Z');
  });
});
