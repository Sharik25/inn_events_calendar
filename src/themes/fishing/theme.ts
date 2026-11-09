import { fishingBanner, fishingCast, leapingFish, ripples } from '../art/fishing';
import type { ThemeDefinition } from '../types';

/** Stranglethorn Fishing Extravaganza: teal water and ripples. */
export const theme: ThemeDefinition = {
  id: 'fishing',
  label: 'Fishing Extravaganza',
  tokens: {
    '--color-bg': '#06212b',
    '--color-surface': '#eaf0e4',
    '--color-ink': '#13262b',
    '--color-ink-muted': '#3d5a5f',
    '--color-ink-on-dark': '#e8f7f5',
    '--color-ink-on-dark-muted': '#9cc5c2',
    '--color-accent': '#29b6c5',
    '--color-gold': '#e0b85c',
    '--color-frame': '#0f3a44',
    '--glow': '0 0 14px rgb(41 182 197 / 0.5)',
    '--cell-tint': 'rgb(41 182 197 / 0.15)',
    '--particle-color': '#bff3f7',
  },
  background: {
    css: [
      'radial-gradient(ellipse at 50% 130%, rgb(41 182 197 / 0.35), transparent 60%)',
      'linear-gradient(180deg, #0c3644 0%, #06212b 60%, #041820 100%)',
    ].join(', '),
  },
  particles: 'bubbles',
  numeral: { ornament: { svg: leapingFish, placement: 'corner', size: 60 } },
  emblem: leapingFish,
  // Details sheet: rods on both banks with their bobbers on the water.
  sheetBanner: fishingBanner,
  decorations: [
    { svg: ripples, anchor: 'bottom', size: 46, mobileSize: 30 },
    // Rods on the shore drop their bobbers into the water, one after another.
    { svg: fishingCast(), anchor: 'bottom-left', size: 120, mobileSize: 64, x: 12, motion: 'cast' },
    {
      svg: fishingCast(true),
      anchor: 'bottom-right',
      size: 120,
      mobileSize: 64,
      x: 12,
      motion: 'cast',
      delay: 3,
    },
    {
      svg: fishingCast(),
      anchor: 'bottom-left',
      size: 92,
      x: 130,
      motion: 'cast',
      delay: 5.5,
      mobileSize: null,
    },
  ],
};
