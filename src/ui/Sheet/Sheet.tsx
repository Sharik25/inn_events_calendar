import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { strings } from '@/strings';
import { svgDataUrl } from '@/themes/art/helpers';
import { Icon } from '../Icon/Icon';
import { ThemeScope } from '../ThemeScope/ThemeScope';
import { useScopeThemeId } from '../ThemeScope/themeContext';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /**
   * Dresses the sheet in its theme: a strip of the theme's art along the top (repeating SVG), a
   * small icon before the title, and the theme's accent on the edge and the header.
   */
  decoration?: { strip?: string; icon?: ReactNode };
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Distance (px) the sheet must be dragged down to close. */
const DRAG_CLOSE_DISTANCE = 100;

/** Open sheets, last on top: only the top one handles Escape and Tab (e.g. export over details). */
const openSheets: object[] = [];

/**
 * Modal panel: bottom sheet on mobile (drag the handle down to close), right side panel on
 * desktop. Traps focus, closes on Escape / backdrop, restores focus on close, locks page scroll.
 * Sheets can stack (a sheet opened from a sheet): Escape and the focus trap belong to the top one.
 */
export function Sheet({ open, onClose, title, children, decoration }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dragStart = useRef<number | null>(null);
  const dragDistance = useRef(0);
  const [dragY, setDragY] = useState(0);
  const themeId = useScopeThemeId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const token = {};
    openSheets.push(token);

    const onKeyDown = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel || openSheets.at(-1) !== token) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        e.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      openSheets.splice(openSheets.indexOf(token), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    dragDistance.current = 0;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; dragging still works.
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    dragDistance.current = Math.max(0, e.clientY - dragStart.current);
    setDragY(dragDistance.current);
  };
  const onPointerUp = () => {
    if (dragStart.current === null) return;
    const shouldClose = dragDistance.current > DRAG_CLOSE_DISTANCE;
    dragStart.current = null;
    dragDistance.current = 0;
    setDragY(0);
    if (shouldClose) onClose();
  };

  return createPortal(
    <ThemeScope themeId={themeId} className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.panel}
        data-dragging={dragY > 0 || undefined}
        data-themed={decoration ? true : undefined}
        data-banner={decoration?.strip ? true : undefined}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        <div
          className={styles.handle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden="true"
        >
          <span className={styles.grip} />
        </div>
        {decoration?.strip && (
          <div
            className={styles.banner}
            aria-hidden="true"
            data-testid="sheet-banner"
            style={{ backgroundImage: svgDataUrl(decoration.strip) }}
          />
        )}
        <header className={styles.header}>
          {decoration?.icon && <span className={styles.titleIcon}>{decoration.icon}</span>}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={strings.common.close}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </ThemeScope>,
    document.body,
  );
}
