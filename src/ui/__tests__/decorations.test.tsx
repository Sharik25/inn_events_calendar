import { act, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { defaultSettings, useSettings } from '@/state/settings';
import type { Decoration } from '@/themes';
import { AmbientParticles, MAX_PARTICLES } from '../AmbientParticles/AmbientParticles';
import { FestiveGarland } from '../FestiveGarland/FestiveGarland';
import { ThemeDecorations } from '../ThemeDecorations/ThemeDecorations';

const art =
  '<svg viewBox="0 0 10 10"><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/></svg>';
const decorations: Decoration[] = [
  { svg: art, anchor: 'top-left', size: 100, x: 20, y: 10, motion: 'sway', glow: 'red' },
  { svg: art, anchor: 'top-right', size: 80, mobileSize: null },
  { svg: art, anchor: 'bottom-left', size: 120, mobileSize: 60, y: 20, rotate: 10, flip: true },
  { svg: art, anchor: 'bottom-right', size: 90, mobileSize: null },
  { svg: art, anchor: 'bottom', size: 40, mobileSize: 30, opacity: 0.8 },
];

describe('ThemeDecorations', () => {
  it('renders every decoration in a hidden, non-interactive layer with unique SVG ids', () => {
    render(<ThemeDecorations decorations={decorations} />);
    const layer = screen.getByTestId('decorations-layer');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer.children).toHaveLength(5);

    const ids = [...layer.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(layer.querySelector('rect')?.getAttribute('fill')).toBe(`url(#${ids[0]})`);

    const first = layer.children[0] as HTMLElement;
    expect(first.style.getPropertyValue('--size')).toBe('100px');
    expect(first.style.getPropertyValue('--size-m')).toBe('55px'); // default 55%
    expect(first.style.getPropertyValue('--x-m')).toBe('11px'); // scaled with size
    expect(first).toHaveAttribute('data-glow');
    expect(layer.children[1]).toHaveAttribute('data-mobile-hidden');
    const strip = layer.children[4] as HTMLElement;
    expect(strip.style.backgroundImage).toContain('data:image/svg+xml');
    expect(strip.style.opacity).toBe('0.8');
  });

  it('scene shows only bottom decorations that have a mobile size', () => {
    render(<ThemeDecorations decorations={decorations} variant="scene" />);
    const scene = screen.getByTestId('decorations-scene');
    expect(scene.children).toHaveLength(2); // bottom-left (60px) + bottom strip
    expect(parseInt(scene.style.height)).toBeGreaterThanOrEqual(60);
  });

  it('marks reduced motion and renders nothing without decorations', () => {
    const { container, rerender } = render(
      <ThemeDecorations decorations={decorations} reducedMotion />,
    );
    expect(screen.getByTestId('decorations-layer')).toHaveAttribute('data-motion', 'reduce');
    rerender(<ThemeDecorations decorations={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ThemeDecorations decorations={decorations.slice(0, 2)} variant="scene" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('AmbientParticles', () => {
  it('caps the particle count and pauses while the tab is hidden', () => {
    const { container } = render(<AmbientParticles kind="snow" count={500} />);
    const layer = container.firstElementChild as HTMLElement;
    expect(layer.children).toHaveLength(MAX_PARTICLES);
    expect(layer).toHaveAttribute('data-kind', 'snow');
    expect(layer).not.toHaveAttribute('data-paused');

    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(layer).toHaveAttribute('data-paused');
    hidden.mockRestore();
  });

  it('is deterministic between renders', () => {
    const a = render(<AmbientParticles kind="embers" count={3} />).container.innerHTML;
    const b = render(<AmbientParticles kind="embers" count={3} />).container.innerHTML;
    expect(a).toBe(b);
  });
});

describe('FestiveGarland', () => {
  it('is a hidden, non-interactive strip carrying inline SVG art', () => {
    render(<FestiveGarland />);
    const garland = screen.getByTestId('festive-garland');
    expect(garland).toHaveAttribute('aria-hidden', 'true');
    expect(garland).not.toHaveAttribute('data-motion');
    expect(garland.style.backgroundImage).toContain('data:image/svg+xml');
  });

  it('marks reduced motion so its animation can be disabled', () => {
    render(<FestiveGarland reducedMotion />);
    expect(screen.getByTestId('festive-garland')).toHaveAttribute('data-motion', 'reduce');
  });
});

describe('useReducedMotion', () => {
  afterEach(() => useSettings.setState(defaultSettings()));

  it('follows the setting, falling back to the OS preference', () => {
    const { result, rerender } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false); // jsdom: no OS preference
    act(() => useSettings.getState().setReducedMotion('on'));
    rerender();
    expect(result.current).toBe(true);
    act(() => useSettings.getState().setReducedMotion('off'));
    rerender();
    expect(result.current).toBe(false);
  });
});
