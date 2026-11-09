/**
 * Regenerates the WoW: Forever snapshot from a raw Wowhead export (see docs/wowhead-sync.md):
 *
 *   npm run sync:wowhead               writes src/data/versions/forever/wowhead-events.json
 *   npm run sync:wowhead -- --check    fails if the snapshot is out of date (CI)
 *   npm run sync:wowhead -- --allow-drop   accepts a sharp drop in events (after checking it)
 *
 * Offline: it reads data/wowhead/forever-holidays.export.json, never Wowhead itself. On any
 * problem (bad shape, time zone check, sharp drop) it exits non-zero and keeps the last snapshot.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  checkAgainstPrevious,
  normalizeFeed,
  rawFeedSchema,
  serializeSnapshot,
  verifySourceTimeZone,
  type WowheadSnapshot,
} from './lib/wowhead';

const root = resolve(import.meta.dirname, '..');
const EXPORT_PATH = resolve(root, 'data/wowhead/forever-holidays.export.json');
const NAMES_PATH = resolve(root, 'data/wowhead/event-names.json');
const SNAPSHOT_PATH = resolve(root, 'src/data/versions/forever/wowhead-events.json');

const args = new Set(process.argv.slice(2));
const check = args.has('--check');

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main(): number {
  if (!existsSync(EXPORT_PATH)) {
    if (check && !existsSync(SNAPSHOT_PATH)) {
      console.log('No Wowhead export or snapshot yet: nothing to check.');
      return 0;
    }
    console.error(`No export at ${EXPORT_PATH}. See docs/wowhead-sync.md to make one.`);
    return 1;
  }

  const feed = rawFeedSchema.parse(readJson(EXPORT_PATH));
  verifySourceTimeZone(feed);
  const names = existsSync(NAMES_PATH) ? (readJson(NAMES_PATH) as Record<string, string>) : {};
  const snapshot = normalizeFeed(feed, names);
  const previous = existsSync(SNAPSHOT_PATH)
    ? (readJson(SNAPSHOT_PATH) as WowheadSnapshot)
    : undefined;
  if (!args.has('--allow-drop')) checkAgainstPrevious(snapshot, previous);

  const next = serializeSnapshot(snapshot);
  const current = existsSync(SNAPSHOT_PATH) ? readFileSync(SNAPSHOT_PATH, 'utf8') : '';
  if (check) {
    if (next !== current) {
      console.error('The Wowhead snapshot is out of date: run `npm run sync:wowhead`.');
      return 1;
    }
    console.log('Wowhead snapshot is up to date.');
    return 0;
  }
  if (next === current) {
    console.log('Wowhead snapshot unchanged.');
    return 0;
  }
  writeFileSync(SNAPSHOT_PATH, next);
  console.log(
    `Wrote ${snapshot.events.length} dated events, ${snapshot.withoutDates.length} without dates, ${snapshot.unresolved.length} unresolved placeholders.`,
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error('Snapshot left as it was.');
  process.exitCode = 1;
}
