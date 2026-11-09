import type { ThemeId } from '@/domain/types';
import { theme as baseTheme } from './base/theme';
import type { ThemeDefinition } from './types';

export type {
  Decoration,
  DecorationAnchor,
  DecorationMotion,
  NumeralOrnament,
  ParticleKind,
  ThemeDefinition,
  ThemeToken,
} from './types';
export { baseTheme };

type ThemeLoader = () => Promise<{ theme: ThemeDefinition }>;

/**
 * Theme registry. The base theme is bundled; event themes (art included) are lazy-loaded.
 * Add a theme: create `./<id>/theme.ts`, then add one line here.
 */
const themeLoaders: Record<ThemeId, ThemeLoader> = {
  base: async () => ({ theme: baseTheme }),
  'hallows-end': () => import('./hallows-end/theme'),
  'winter-veil': () => import('./winter-veil/theme'),
  fireworks: () => import('./fireworks/theme'),
  'darkmoon-faire': () => import('./darkmoon-faire/theme'),
  fishing: () => import('./fishing/theme'),
  'lunar-festival': () => import('./lunar-festival/theme'),
  'love-is-in-the-air': () => import('./love-is-in-the-air/theme'),
  noblegarden: () => import('./noblegarden/theme'),
  'childrens-week': () => import('./childrens-week/theme'),
  midsummer: () => import('./midsummer/theme'),
  brewfest: () => import('./brewfest/theme'),
  'harvest-festival': () => import('./harvest-festival/theme'),
  forever: () => import('./forever/theme'),
  'forever-launch': () => import('./forever-launch/theme'),
  pvp: () => import('./pvp/theme'),
};

export const themeIds: readonly ThemeId[] = Object.keys(themeLoaders);

export interface TopStripHeight {
  desktop: number;
  mobile: number;
}

const BUNTING: TopStripHeight = { desktop: 40, mobile: 28 };
const NO_STRIP: TopStripHeight = { desktop: 0, mobile: 0 };

/**
 * Height (px) of each theme's strip along the top edge (its `anchor: 'top'` decoration), known
 * before the theme's lazy chunk loads: the layout makes room for it on the first paint instead of
 * jumping when the theme arrives. Add a line when a theme gets a top strip; a test checks these
 * against the themes' decorations.
 */
const topStrips: Partial<Record<ThemeId, TopStripHeight>> = {
  'winter-veil': { desktop: 34, mobile: 24 },
  fireworks: BUNTING,
  'darkmoon-faire': BUNTING,
  'love-is-in-the-air': BUNTING,
  'childrens-week': BUNTING,
  midsummer: BUNTING,
  brewfest: BUNTING,
  'harvest-festival': BUNTING,
  'forever-launch': BUNTING,
  pvp: BUNTING,
};

export function topStripOf(id: ThemeId | undefined): TopStripHeight {
  return (id && topStrips[id]) || NO_STRIP;
}

const cache = new Map<ThemeId, ThemeDefinition>([['base', baseTheme]]);

/** Already-loaded theme, if any (synchronous). */
export function getCachedTheme(id: ThemeId): ThemeDefinition | undefined {
  return cache.get(id);
}

/** Loads a theme, falling back to the base theme for unknown ids. */
export async function loadTheme(id: ThemeId): Promise<ThemeDefinition> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = themeLoaders[id];
  const theme = loader ? (await loader()).theme : baseTheme;
  cache.set(id, theme);
  return theme;
}
