import type { Decoration } from '@/themes';

const DEFAULT_MOBILE_RATIO = 0.55;

/** A decoration's width on phones: `mobileSize`, 0 when hidden there, else 55% of `size`. */
export function mobileSizeOf(d: Decoration): number {
  return d.mobileSize === undefined
    ? Math.round(d.size * DEFAULT_MOBILE_RATIO)
    : (d.mobileSize ?? 0);
}

/**
 * Height (px) of the full-width strips along the top edge (bunting, snow, garlands): the interface
 * starts below the tallest one (`--top-decoration-offset`). Corner pieces are left out on purpose:
 * they sit beside the content, not across it.
 */
export function topStripHeight(decorations: Decoration[] | undefined): {
  desktop: number;
  mobile: number;
} {
  const strips = (decorations ?? []).filter((d) => d.anchor === 'top');
  return {
    desktop: Math.max(0, ...strips.map((d) => d.size)),
    mobile: Math.max(0, ...strips.map(mobileSizeOf)),
  };
}
