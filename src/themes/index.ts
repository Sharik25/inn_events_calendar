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
};

export const themeIds: readonly ThemeId[] = Object.keys(themeLoaders);

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
