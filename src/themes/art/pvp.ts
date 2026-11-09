import { INK, svg } from './helpers';

/** One upright sword: steel blade, gold crossguard, crimson grip, gold pommel. */
const sword = `<path d="M50 4 L57 15 V62 H43 V15 Z" fill="url(#pv-b)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
<path d="M50 10 V58" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>
<rect x="32" y="60" width="36" height="8" rx="3" fill="#e6c06a" stroke="${INK}" stroke-width="3"/>
<rect x="45" y="68" width="10" height="17" rx="2" fill="#b8333a" stroke="${INK}" stroke-width="2.5"/>
<circle cx="50" cy="89" r="6" fill="#e6c06a" stroke="${INK}" stroke-width="2.5"/>`;

/** Two crossed swords: battleground holiday weeks. */
export const crossedSwords = svg(
  '0 0 100 100',
  `<defs><linearGradient id="pv-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#eef3f8"/><stop offset=".55" stop-color="#b9c4d2"/><stop offset="1" stop-color="#7d8798"/></linearGradient></defs>
<g transform="rotate(-42 50 52)">${sword}</g>
<g transform="rotate(42 50 52)">${sword}</g>`,
);
