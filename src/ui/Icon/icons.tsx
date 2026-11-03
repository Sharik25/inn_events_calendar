import type { ReactNode } from 'react';

/** Original line icons (24×24, stroke = currentColor). */
export const iconPaths = {
  day: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  week: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M6 14.5h12" strokeWidth="3" />
    </>
  ),
  month: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01" strokeWidth="2.6" />
    </>
  ),
  version: (
    <>
      <path d="M5 3h14v12l-7 6-7-6z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3.2" />,
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  calendarPlus: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
    </>
  ),
  // A wooden tavern tankard with a head of foam (two staves, a round handle).
  beer: (
    <>
      <path d="M4.5 9.5h10V19a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" />
      <path d="M14.5 11.5h2a2.5 2.5 0 0 1 2.5 2.5v1.5a2.5 2.5 0 0 1-2.5 2.5h-2" />
      <path d="M4 9.5a2.2 2.2 0 0 1 1.3-3.9A3 3 0 0 1 10.5 4a2.6 2.6 0 0 1 4.6 1.7A1.9 1.9 0 0 1 15 9.5" />
      <path d="M8 12.5v5M11 12.5v5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h.01" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  flame: (
    <path d="M12 3c3.5 4 5.5 7 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2 .9-3.8 2.5-5.5.3 1.6 1.1 2.7 2.2 3.2C10.8 8.6 11 6 12 3z" />
  ),
} as const satisfies Record<string, ReactNode>;

export type IconName = keyof typeof iconPaths;
export const iconNames = Object.keys(iconPaths) as IconName[];
