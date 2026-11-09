import { useEffect, useId, useRef, useState } from 'react';
import { SUPPORT_LINKS } from '@/config';
import { strings } from '@/strings';
import { BeerIcon, cx, Icon } from '@/ui';
import styles from './SupportMenu.module.css';

/**
 * Header tip jar: a "Gift a beer" button that opens a small menu of payment links
 * (SUPPORT_LINKS). Closes on outside click and Escape (focus returns to the button). Plain links,
 * no tracking.
 */
export function SupportMenu({ links = SUPPORT_LINKS }: { links?: typeof SUPPORT_LINKS }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (links.length === 0) return null;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={cx(styles.trigger, open && styles.open)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={strings.support.beer}
        onClick={() => setOpen((o) => !o)}
      >
        <BeerIcon size={22} className={styles.icon} />
        <span className={styles.label}>{strings.support.beer}</span>
      </button>
      {open && (
        <div id={menuId} className={styles.popover}>
          <p className={styles.title}>{strings.support.choose}</p>
          <ul className={styles.options}>
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.option}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.provider}>{link.label}</span>
                  <Icon name="external" size={16} />
                  <span className={styles.srOnly}> {strings.eventSheet.opensInNewTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
