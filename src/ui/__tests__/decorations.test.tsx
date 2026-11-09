import { act, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { defaultSettings, useSettings } from '@/state/settings';
import type { Decoration } from '@/themes';
import { AmbientParticles, MAX_PARTICLES } from '../AmbientParticles/AmbientParticles';
import { FestiveGarland } from '../FestiveGarland/FestiveGarland';
import { Fireplace } from '../Fireplace/Fireplace';
import { ThemeDecorations } from '../ThemeDecorations/ThemeDecorations';
import { topStripHeight } from '../ThemeDecorations/sizes';

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

  it('keeps side particles to the outer bands and can stand still', () => {
    const { container } = render(
      <AmbientParticles kind="sparks" placement="sides" count={20} still />,
    );
    const layer = container.firstElementChild as HTMLElement;
    expect(layer).toHaveAttribute('data-placement', 'sides');
    expect(layer).toHaveAttribute('data-still');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    const xs = [...layer.children].map((p) =>
      parseFloat((p as HTMLElement).style.getPropertyValue('--px')),
    );
    expect(xs.every((x) => x <= 12 || x >= 88)).toBe(true);
    expect(xs.some((x) => x <= 12) && xs.some((x) => x >= 88)).toBe(true);
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

describe('Fireplace', () => {
  it('is hidden, non-interactive art with gradients unique to each copy', () => {
    render(
      <>
        <Fireplace />
        <Fireplace />
      </>,
    );
    const [first, second] = screen.getAllByTestId('fireplace');
    expect(first).toHaveAttribute('aria-hidden', 'true');
    expect(first).not.toHaveAttribute('data-motion');
    const ids = (el: HTMLElement | undefined) =>
      [...(el?.querySelectorAll('[id]') ?? [])].map((n) => n.id);
    expect(ids(first).length).toBeGreaterThan(0);
    expect(ids(first).filter((id) => ids(second).includes(id))).toEqual([]);
  });

  it('marks reduced motion so the fire stands still', () => {
    render(<Fireplace reducedMotion />);
    expect(screen.getByTestId('fireplace')).toHaveAttribute('data-motion', 'reduce');
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

describe('topStripHeight', () => {
  it('is the tallest full-width top strip, per layout; corner pieces and bottoms do not count', () => {
    expect(topStripHeight(decorations)).toEqual({ desktop: 0, mobile: 0 });
    expect(topStripHeight(undefined)).toEqual({ desktop: 0, mobile: 0 });
    expect(
      topStripHeight([
        ...decorations,
        { svg: art, anchor: 'top', size: 40, mobileSize: 28 },
        { svg: art, anchor: 'top', size: 34 }, // phones: 55% → 19
      ]),
    ).toEqual({ desktop: 40, mobile: 28 });
    expect(topStripHeight([{ svg: art, anchor: 'top', size: 40, mobileSize: null }])).toEqual({
      desktop: 40,
      mobile: 0,
    });
  });
});

describe('cast (fishing rods)', () => {
  it('renders the rod with its animated parts, and mirrors it for the right corner', async () => {
    const { fishingCast } = await import('@/themes/art/fishing');
    const { container } = render(
      <ThemeDecorations
        decorations={[
          { svg: fishingCast(), anchor: 'bottom-left', size: 120, motion: 'cast' },
          { svg: fishingCast(true), anchor: 'bottom-right', size: 120, motion: 'cast' },
        ]}
      />,
    );
    const arts = container.querySelectorAll('[data-motion="cast"]');
    expect(arts).toHaveLength(2);
    for (const art of arts) {
      for (const part of ['deco-cast-line', 'deco-cast-bobber', 'deco-cast-splash'])
        expect(art.querySelector(`.${part}`)).not.toBeNull();
    }
    expect(arts[1]?.querySelector('g[transform^="matrix(-1"]')).not.toBeNull();
  });
});
