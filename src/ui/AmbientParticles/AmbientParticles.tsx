import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { ParticleKind } from '@/themes';
import styles from './AmbientParticles.module.css';

export const MAX_PARTICLES = 36;

/** Deterministic pseudo-random sequence so particles don't jump between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Horizontal position: anywhere, or in the outer 12% bands on each side (`sides`). */
function position(rand: () => number, placement: 'full' | 'sides'): number {
  if (placement === 'full') return rand() * 100;
  const offset = 1 + rand() * 11;
  return rand() < 0.5 ? offset : 100 - offset;
}

/**
 * Light CSS-only ambient particles (embers, snow, petals, sparkles, bubbles), colored by the
 * theme's `--particle-color`, plus fire `sparks` and wood `splinters` for the quiet-day hearth.
 * Capped at 36 (18 on mobile) and paused while the tab is hidden; transform/opacity only, never
 * captures clicks. `placement="sides"` keeps them to the screen edges, clear of the content.
 * Reduced motion: theme particles aren't rendered at all; with `still`, side particles are drawn
 * standing still instead (sparks only).
 */
export function AmbientParticles({
  kind,
  count = MAX_PARTICLES,
  placement = 'full',
  still = false,
}: {
  kind: ParticleKind;
  count?: number;
  placement?: 'full' | 'sides';
  still?: boolean;
}) {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  const particles = useMemo(() => {
    const rand = seeded(kind.length * 7919 + 17);
    return Array.from({ length: Math.min(count, MAX_PARTICLES) }, () => ({
      '--px': `${position(rand, placement).toFixed(1)}%`,
      '--py': `${(rand() * 100).toFixed(1)}%`,
      '--delay': `${(-rand() * 20).toFixed(1)}s`,
      '--duration': `${(10 + rand() * 12).toFixed(1)}s`,
      '--size': `${(3 + rand() * 6).toFixed(1)}px`,
      '--drift': `${((rand() - 0.5) * 120).toFixed(0)}px`,
      '--spin': `${(rand() * 720 - 360).toFixed(0)}deg`,
    }));
  }, [kind, count, placement]);

  return (
    <div
      className={styles.layer}
      data-kind={kind}
      data-placement={placement}
      data-still={still || undefined}
      data-paused={hidden || undefined}
      aria-hidden="true"
    >
      {particles.map((style, i) => (
        <span key={i} className={styles.particle} style={style as CSSProperties} />
      ))}
    </div>
  );
}
