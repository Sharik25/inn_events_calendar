import { useId, type CSSProperties } from 'react';
import { INK } from '@/themes/art/helpers';
import { cx } from '../cx';
import styles from './Fireplace.module.css';

/** Stone courses of the hearth face: [y, x offset]; widths cycle so joints never line up. */
const COURSES = [
  [48, 0],
  [70, -20],
  [92, -6],
  [114, -26],
  [136, -12],
  [158, -30],
  [180, -4],
] as const;
const WIDTHS = [44, 38, 50, 40, 46, 36];
const STONE_TONES = [styles.stoneA, styles.stoneB, styles.stoneC];

function stones() {
  return COURSES.flatMap(([y, offset], row) => {
    const out = [];
    for (let x = 16 + offset, i = row; x < 264; i++) {
      const w = WIDTHS[i % WIDTHS.length] ?? 40;
      out.push(
        <rect
          key={`${row}-${x}`}
          x={x}
          y={y}
          width={w - 3}
          height={19}
          rx={4}
          className={STONE_TONES[(row + i) % STONE_TONES.length]}
        />,
      );
      x += w;
    }
    return out;
  });
}

/** [cx, size, duration (s), delay (s), drift (px)] for each rising ember. */
const EMBERS = [
  [126, 2.2, 3.4, 0, -8],
  [150, 1.8, 4.1, 0.9, 10],
  [138, 2.4, 3.7, 1.8, -4],
  [160, 1.6, 4.6, 2.6, 6],
  [118, 1.7, 4.3, 3.3, -10],
  [144, 2, 3.2, 4, 3],
] as const;

/**
 * A cozy stone hearth with a crackling fire (original SVG, no game art), for the "quiet day at the
 * inn" screen. Stone, wood and trim take the current theme's colors; the fire is always warm.
 * Purely decorative: hidden from assistive tech and never captures clicks. Flames flicker, embers
 * rise and the light breathes, all in CSS; with reduced motion (`reducedMotion`, which folds in
 * the OS preference, or the OS preference directly) it is a still, lit fire.
 */
export function Fireplace({
  reducedMotion = false,
  className,
}: {
  reducedMotion?: boolean;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = (name: string) => `url(#${name}-${id})`;

  return (
    <div
      className={cx(styles.fireplace, className)}
      aria-hidden="true"
      data-testid="fireplace"
      data-motion={reducedMotion ? 'reduce' : undefined}
    >
      <div className={styles.light} />
      <svg viewBox="0 0 280 222" className={styles.art} focusable="false">
        <defs>
          <clipPath id={`face-${id}`}>
            <rect x="16" y="46" width="248" height="156" />
          </clipPath>
          <radialGradient id={`hollow-${id}`} cx="0.5" cy="0.85" r="0.75">
            <stop offset="0" stopColor="#6e2a0c" />
            <stop offset="0.45" stopColor="#2a1007" />
            <stop offset="1" stopColor="#0d0603" />
          </radialGradient>
          <radialGradient id={`heat-${id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffb347" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`outer-${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f36b1c" />
            <stop offset="1" stopColor="#c62f12" />
          </linearGradient>
          <linearGradient id={`middle-${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ffc247" />
            <stop offset="1" stopColor="#ff8a24" />
          </linearGradient>
          <linearGradient id={`core-${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fffbe0" />
            <stop offset="1" stopColor="#ffe07a" />
          </linearGradient>
          <linearGradient id={`log-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a5530" />
            <stop offset="1" stopColor="#4a2a14" />
          </linearGradient>
        </defs>

        {/* Hearth face: stone courses, clipped to the chimney breast. */}
        <rect x="16" y="46" width="248" height="156" className={styles.mortar} />
        <g clipPath={ref('face')}>{stones()}</g>
        <rect x="16" y="46" width="248" height="156" fill="none" stroke={INK} strokeWidth="3" />

        {/* Fire opening under a stone arch with a keystone. */}
        <path d="M68 202 V152 A72 72 0 0 1 212 152 V202 Z" fill={ref('hollow')} />
        <ellipse cx="140" cy="176" rx="62" ry="40" fill={ref('heat')} className={styles.heat} />
        <path
          d="M60 202 V152 A80 80 0 0 1 220 152 V202"
          fill="none"
          stroke={INK}
          strokeWidth="19"
        />
        <path
          d="M60 202 V152 A80 80 0 0 1 220 152 V202"
          fill="none"
          strokeWidth="13"
          className={styles.arch}
        />
        <path
          d="M60 202 V152 A80 80 0 0 1 220 152 V202"
          fill="none"
          stroke={INK}
          strokeWidth="13"
          strokeDasharray="2 20"
          opacity="0.55"
        />
        <path
          d="M131 66 H149 L153 84 H127 Z"
          className={styles.keystone}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Logs and the glowing ember bed. */}
        <g stroke={INK} strokeWidth="2.5">
          <rect
            x="92"
            y="184"
            width="96"
            height="14"
            rx="7"
            fill={ref('log')}
            transform="rotate(-7 140 191)"
          />
          <rect
            x="94"
            y="186"
            width="94"
            height="13"
            rx="6.5"
            fill={ref('log')}
            transform="rotate(8 140 192)"
          />
          <ellipse cx="94" cy="197" rx="5" ry="6.5" fill="#c99a62" />
          <ellipse cx="187" cy="198" rx="5" ry="6" fill="#c99a62" />
        </g>
        <g className={styles.coals}>
          <ellipse cx="116" cy="200" rx="9" ry="3" fill="#ff7a22" />
          <ellipse cx="140" cy="201" rx="12" ry="3" fill="#ffb347" />
          <ellipse cx="164" cy="200" rx="9" ry="3" fill="#ff7a22" />
        </g>

        {/* The fire: side licks, outer, middle and core flames flicker out of step. */}
        <g className={styles.flames}>
          <path
            className={cx(styles.flame, styles.lickLeft)}
            d="M114 162 C111 172 106 179 109 187 C112 193 123 195 127 188 C131 181 125 171 114 162 Z"
            fill={ref('outer')}
          />
          <path
            className={cx(styles.flame, styles.lickRight)}
            d="M167 158 C171 169 175 178 171 186 C167 193 156 194 153 188 C149 180 157 170 167 158 Z"
            fill={ref('outer')}
          />
          <path
            className={cx(styles.flame, styles.outer)}
            d="M140 104 C147 122 161 131 167 147 C175 168 167 192 140 195 C113 192 105 170 113 150 C117 140 126 135 128 122 C134 129 138 121 140 104 Z"
            fill={ref('outer')}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            className={cx(styles.flame, styles.middle)}
            d="M141 126 C146 139 156 147 158 162 C160 180 152 191 140 191 C128 191 121 180 123 166 C124 156 132 150 134 140 C137 144 140 137 141 126 Z"
            fill={ref('middle')}
          />
          <path
            className={cx(styles.flame, styles.core)}
            d="M140 150 C144 158 150 164 150 174 C150 184 146 189 140 189 C134 189 130 184 130 175 C130 167 136 162 140 150 Z"
            fill={ref('core')}
          />
        </g>

        <g className={styles.embers}>
          {EMBERS.map(([x, r, duration, delay, drift]) => (
            <circle
              key={x}
              cx={x}
              cy="168"
              r={r}
              fill="#ffd27a"
              className={styles.ember}
              style={
                {
                  '--duration': `${duration}s`,
                  '--delay': `${delay}s`,
                  '--drift': `${drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </g>

        {/* Hearthstone and mantel shelf with candles. */}
        <rect
          x="4"
          y="200"
          width="272"
          height="18"
          rx="4"
          className={styles.hearthstone}
          stroke={INK}
          strokeWidth="3"
        />
        <rect
          x="6"
          y="28"
          width="268"
          height="20"
          rx="4"
          className={styles.mantel}
          stroke={INK}
          strokeWidth="3"
        />
        <line x1="12" y1="43" x2="268" y2="43" className={styles.trim} strokeWidth="2.5" />
        {[34, 246].map((x) => (
          <g key={x}>
            <rect
              x={x - 5}
              y="12"
              width="10"
              height="17"
              rx="2"
              fill="#f2e3c0"
              stroke={INK}
              strokeWidth="2"
            />
            <path
              className={cx(styles.flame, styles.candle)}
              d={`M${x} 1 C${x + 4} 6 ${x + 4} 10 ${x} 11 C${x - 4} 10 ${x - 4} 6 ${x} 1 Z`}
              fill={ref('middle')}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
