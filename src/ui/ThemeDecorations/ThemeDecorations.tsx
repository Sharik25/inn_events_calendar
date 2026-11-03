import { useId, type CSSProperties } from 'react';
import { svgDataUrl, uniqueSvgIds } from '@/themes/art/helpers';
import type { Decoration } from '@/themes';
import styles from './ThemeDecorations.module.css';

const DEFAULT_MOBILE_RATIO = 0.55;

function cssVars(d: Decoration): CSSProperties {
  const mobile = mobileSizeOf(d);
  const ratio = mobile / d.size;
  return {
    '--size': `${d.size}px`,
    '--size-m': `${mobile}px`,
    '--x': `${d.x ?? 0}px`,
    '--y': `${d.y ?? 0}px`,
    '--x-m': `${Math.round((d.x ?? 0) * ratio)}px`,
    '--y-m': `${Math.round((d.y ?? 0) * ratio)}px`,
    '--rotate': `${d.rotate ?? 0}deg`,
    '--flip': d.flip ? -1 : 1,
    ...(d.glow && { '--glow-color': d.glow }),
    ...(d.delay && { '--motion-delay': `${-d.delay}s` }),
    ...(d.opacity !== undefined && { opacity: d.opacity }),
  } as CSSProperties;
}

const isBottom = (d: Decoration) => d.anchor.startsWith('bottom');

function mobileSizeOf(d: Decoration): number {
  return d.mobileSize === undefined
    ? Math.round(d.size * DEFAULT_MOBILE_RATIO)
    : (d.mobileSize ?? 0);
}

/** Scene height that fits the tallest piece (art is at most ~1.45× taller than wide). */
function sceneHeight(items: Decoration[]): number {
  return Math.ceil(
    Math.max(
      ...items.map((d) => {
        const m = mobileSizeOf(d);
        if (d.anchor === 'bottom') return m;
        return m * 1.45 + Math.round((d.y ?? 0) * (m / d.size));
      }),
    ),
  );
}

/**
 * Renders a theme's decorations (original SVG art). Purely decorative: hidden from assistive
 * tech and never interactive.
 * - `layer`: fixed behind the content and clipped to the viewport. On mobile it shows only the
 *   top decorations, so nothing sits behind the text near the action bar.
 * - `scene`: the bottom decorations as a little scene in the page flow at the end of the page
 *   (mobile only).
 */
export function ThemeDecorations({
  decorations,
  variant = 'layer',
  reducedMotion = false,
}: {
  decorations: Decoration[] | undefined;
  variant?: 'layer' | 'scene';
  reducedMotion?: boolean;
}) {
  const instance = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shown =
    variant === 'scene'
      ? (decorations ?? []).filter((d) => isBottom(d) && d.mobileSize !== null)
      : (decorations ?? []);
  if (!shown.length) return null;

  return (
    <div
      className={variant === 'scene' ? styles.scene : styles.layer}
      aria-hidden="true"
      data-motion={reducedMotion ? 'reduce' : undefined}
      data-testid={`decorations-${variant}`}
      style={variant === 'scene' ? { height: sceneHeight(shown) } : undefined}
    >
      {shown.map((d, i) => {
        const mobileHidden = d.mobileSize === null || undefined;
        if (d.anchor === 'top' || d.anchor === 'bottom') {
          return (
            <span
              key={i}
              className={styles.strip}
              data-anchor={d.anchor}
              data-mobile-hidden={mobileHidden}
              style={{ ...cssVars(d), backgroundImage: svgDataUrl(d.svg) }}
            />
          );
        }
        return (
          <span
            key={i}
            className={styles.item}
            data-anchor={d.anchor}
            data-mobile-hidden={mobileHidden}
            data-glow={d.glow ? true : undefined}
            style={cssVars(d)}
          >
            <span
              className={styles.art}
              data-motion={d.motion}
              // Static, bundled art from theme files (never user input).
              dangerouslySetInnerHTML={{ __html: uniqueSvgIds(d.svg, `${instance}${i}`) }}
            />
          </span>
        );
      })}
    </div>
  );
}
