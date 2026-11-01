import { useEffect, useState } from 'react';

/**
 * Live height of an element: pass the returned callback as its `ref`.
 * `null` until measured, and always where `ResizeObserver` is missing (jsdom).
 */
export function useElementHeight<T extends Element>() {
  const [element, setElement] = useState<T | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, height] as const;
}
