import { crossedSwords, warGarland } from '../art/pvp';
import type { ThemeDefinition } from '../types';

/** Battleground holiday weeks: Forever's midnight slate with a crimson battle accent. */
export const theme: ThemeDefinition = {
  id: 'pvp',
  label: 'Battleground holiday',
  tokens: {
    '--color-bg': '#15121c',
    '--color-surface': '#f1ead8',
    '--color-ink': '#1d2230',
    '--color-ink-muted': '#4c5266',
    '--color-ink-on-dark': '#f2efe6',
    '--color-ink-on-dark-muted': '#bdb6c4',
    '--color-accent': '#e25f63',
    '--color-gold': '#e6c06a',
    '--color-frame': '#231a28',
    '--glow': '0 0 16px rgb(226 95 99 / 0.45)',
    '--cell-tint': 'rgb(226 95 99 / 0.13)',
    '--particle-color': '#ffc9a8',
  },
  background: {
    css: [
      'radial-gradient(ellipse at 50% 0%, rgb(226 95 99 / 0.16), transparent 55%)',
      'radial-gradient(ellipse at 50% 120%, rgb(230 192 106 / 0.12), transparent 60%)',
      'linear-gradient(180deg, #1c1624 0%, #15121c 70%)',
    ].join(', '),
  },
  particles: 'embers',
  numeral: { ornament: { svg: crossedSwords, placement: 'corner', size: 44 } },
  emblem: crossedSwords,
  // A war garland along the top edge: helmet, shield and crossed swords hung on a rope.
  decorations: [{ svg: warGarland, anchor: 'top', size: 56, mobileSize: 38 }],
};
