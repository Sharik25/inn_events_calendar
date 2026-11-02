/**
 * Hidden /dev/ui route: every design-system primitive in the base theme and one event theme.
 * Developer-only page, so its demo copy lives here rather than in strings/en.ts.
 */
import { useState } from 'react';
import type { ThemeId } from '@/domain/types';
import { strings } from '@/strings';
import {
  ActionBar,
  ActionBarDivider,
  ActionButton,
  Badge,
  Frame,
  Icon,
  iconNames,
  ParchmentCard,
  Sheet,
  ThemeScope,
  Tooltip,
} from '@/ui';
import styles from './UiGallery.module.css';

const galleryThemes: { id: ThemeId; label: string }[] = [
  { id: 'base', label: 'Base: Inn at dusk' },
  { id: 'hallows-end', label: "Event: Hallow's End" },
];

function ThemeColumn({ themeId, label }: { themeId: ThemeId; label: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  return (
    <ThemeScope
      themeId={themeId}
      withBackground
      className={styles.column}
      data-testid={`gallery-${themeId}`}
    >
      <h2 className={styles.columnTitle}>{label}</h2>

      <Frame as="section" aria-label="Wood frame">
        <p className={styles.frameText}>
          Wood frame: carved, gold-trimmed. Holds the hero and toolbars.
        </p>
      </Frame>
      <Frame as="section" material="stone" aria-label="Stone frame">
        <p className={styles.frameText}>Stone frame: an alternative material.</p>
      </Frame>

      <ParchmentCard title="Parchment card">
        <p className={styles.cardText}>
          Readable content lives on parchment. Body text uses Alegreya; titles use Cinzel.
        </p>
        <div className={styles.row}>
          <Badge>Holiday</Badge>
          <Badge tone="accent">Live now</Badge>
          <Badge tone="unconfirmed">{strings.common.unconfirmed}</Badge>
        </div>
        <div className={styles.row}>
          <Badge variant="seal" label="Annual event">
            ★
          </Badge>
          <Badge variant="seal" tone="accent" label="Live">
            ✦
          </Badge>
          <Badge variant="seal" tone="unconfirmed" label={strings.common.unconfirmed}>
            ?
          </Badge>
          <Tooltip content={strings.common.unconfirmedHint}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="About unconfirmed dates"
            >
              <Icon name="info" />
            </button>
          </Tooltip>
        </div>
        <button type="button" className={styles.button} onClick={() => setSheetOpen(true)}>
          Open sheet
        </button>
      </ParchmentCard>

      <ParchmentCard title="Icons" level={3} compact>
        <ul className={styles.icons}>
          {iconNames.map((name) => (
            <li key={name} className={styles.iconCell}>
              <Icon name={name} />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      </ParchmentCard>

      <Frame aria-label="Action slots preview" className={styles.slots}>
        {(['day', 'week', 'month'] as const).map((v, i) => (
          <ActionButton
            key={v}
            icon={v}
            label={strings.actionBar[v]}
            keybind={String(i + 1)}
            active={view === v}
            onClick={() => setView(v)}
          />
        ))}
      </Frame>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={`${label} sheet`}>
        <p>
          Bottom sheet on mobile (drag the handle down to close), side panel on desktop. Focus is
          trapped; Escape or the backdrop closes it.
        </p>
        <div className={styles.row}>
          <Badge tone="unconfirmed">{strings.common.unconfirmed}</Badge>
        </div>
        <button type="button" className={styles.button} onClick={() => setSheetOpen(false)}>
          Done
        </button>
      </Sheet>
    </ThemeScope>
  );
}

export function UiGallery() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  return (
    <ThemeScope themeId="base" withBackground className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Design system</h1>
        <p className={styles.subtitle}>Hidden developer page: primitives in two themes.</p>
      </header>
      <div className={styles.columns}>
        {galleryThemes.map((t) => (
          <ThemeColumn key={t.id} themeId={t.id} label={t.label} />
        ))}
      </div>

      <ActionBar>
        {(['day', 'week', 'month'] as const).map((v, i) => (
          <ActionButton
            key={v}
            icon={v}
            label={strings.actionBar[v]}
            keybind={String(i + 1)}
            active={view === v}
            onClick={() => setView(v)}
          />
        ))}
        <ActionBarDivider />
        <ActionButton icon="version" label={strings.actionBar.version} keybind="V" />
        <ActionButton icon="more" label={strings.actionBar.more} />
      </ActionBar>
    </ThemeScope>
  );
}
