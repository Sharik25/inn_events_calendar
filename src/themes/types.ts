import type { ThemeId } from '@/domain/types';

export type ThemeToken =
  | '--color-bg'
  | '--color-surface'
  | '--color-ink'
  | '--color-ink-muted'
  | '--color-ink-on-dark'
  | '--color-ink-on-dark-muted'
  | '--color-accent'
  | '--color-gold'
  | '--color-frame'
  | '--glow'
  | '--cell-tint'
  | '--particle-color'
  | '--font-display';

/** Theme particle kinds, plus `sparks` / `splinters` for the quiet-day hearth's side bands. */
export type ParticleKind =
  'embers' | 'snow' | 'petals' | 'sparkles' | 'bubbles' | 'sparks' | 'splinters';

/** Where a decoration sits: a viewport corner, or a full-width repeating strip along an edge. */
export type DecorationAnchor =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom';

/**
 * `burst`: a firework that opens, glows and fades, then rests for most of its loop.
 * `cast`: a fishing rod drops its bobber into the water and reels it back in (art with
 * `deco-cast-*` parts, see art/fishing.ts `fishingCast`).
 */
export type DecorationMotion =
  'sway' | 'bob' | 'float' | 'flicker' | 'pulse' | 'spin' | 'burst' | 'cast';

/** One piece of original SVG art placed around the page. Pure data: no UI code per theme. */
export interface Decoration {
  /** Inline SVG markup (original art only, see PLAN.md §11). */
  svg: string;
  anchor: DecorationAnchor;
  /** Desktop width in px (for edge strips: the strip height). */
  size: number;
  /** Mobile width/height in px; `null` hides it on mobile. Default: 55% of `size`. */
  mobileSize?: number | null;
  /** Offset in px from the anchored edges (desktop; scaled on mobile). */
  x?: number;
  y?: number;
  rotate?: number;
  flip?: boolean;
  motion?: DecorationMotion;
  /** Seconds to offset the motion by, so several pieces don't move in step. */
  delay?: number;
  /** Soft colored glow (CSS color), e.g. candle light in a jack-o'-lantern. */
  glow?: string;
  opacity?: number;
}

export interface NumeralOrnament {
  svg: string;
  /** `cap`: spans the top edge of the date frame (e.g. snow). `corner`: sits on its top-right corner. */
  placement: 'cap' | 'corner';
  size: number;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  tokens: Partial<Record<ThemeToken, string>>; // CSS custom properties
  background?: { css: string }; // gradients / SVG patterns
  particles?: ParticleKind | null;
  numeral?: { ornament?: NumeralOrnament };
  /** Small square art that identifies the event (card medallions, markers). */
  emblem?: string;
  /** Small art in the corner of week/month day cells this theme leads (e.g. a launch burst). */
  dayAccent?: string;
  /** Kept minimal: edge garlands/strips and small animated accents, no large corner objects. */
  decorations?: Decoration[];
}
