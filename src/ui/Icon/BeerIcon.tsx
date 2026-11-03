import type { ComponentProps } from 'react';
import { Icon } from './Icon';

/**
 * Original tankard-of-beer line icon (same 24×24 grid, stroke and caps as the other icons).
 * Inherits `currentColor`, so it follows each version's theme and hover/active states; `color`
 * overrides it. Decorative by default: label the button, not the icon.
 */
export function BeerIcon({
  size = 24,
  color,
  style,
  ...rest
}: Omit<ComponentProps<typeof Icon>, 'name'> & { color?: string }) {
  return <Icon name="beer" size={size} style={color ? { color, ...style } : style} {...rest} />;
}
