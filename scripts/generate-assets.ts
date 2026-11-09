/**
 * Renders the app icons and social preview image from original SVG art (PLAN.md §11):
 *   public/favicon.svg, public/icons/*.png, public/og/og-image.png
 * Run with `npm run assets` after changing the art. Uses Playwright's Chromium to rasterize.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { appIcon } from '../src/themes/art/appIcon';
import { hourglass } from '../src/themes/art/forever';
import { candyCane } from '../src/themes/art/winter';
import { leapingFish } from '../src/themes/art/fishing';
import { lantern } from '../src/themes/art/lunar';
import { heart } from '../src/themes/art/love';
import { pumpkin } from '../src/themes/art/shared';

const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const font = (pkg: string, file: string) =>
  `data:font/woff2;base64,${readFileSync(root(`node_modules/@fontsource/${pkg}/files/${file}`)).toString('base64')}`;

const ICONS: { file: string; size: number; maskable?: boolean }[] = [
  { file: 'icons/icon-192.png', size: 192 },
  { file: 'icons/icon-512.png', size: 512 },
  { file: 'icons/maskable-512.png', size: 512, maskable: true },
  { file: 'icons/apple-touch-icon.png', size: 180, maskable: true }, // iOS rounds corners itself
];

function ogHtml(): string {
  const emblems = [pumpkin(true, false), candyCane, lantern(), heart(), leapingFish, hourglass]
    .map((svg) => `<div class="emblem">${svg}</div>`)
    .join('');
  return `<!doctype html><html><head><style>
@font-face { font-family: Cinzel; font-weight: 700; src: url(${font('cinzel', 'cinzel-latin-700-normal.woff2')}); }
@font-face { font-family: Alegreya; src: url(${font('alegreya', 'alegreya-latin-400-normal.woff2')}); }
html, body { margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; display: flex; align-items: center; gap: 56px; padding: 0 80px; box-sizing: border-box;
  background: radial-gradient(ellipse at 30% 30%, rgb(232 130 58 / 0.25), transparent 60%), radial-gradient(ellipse at 50% 120%, #000, transparent 70%), #1c120c;
  color: #f3e3c3; font-family: Alegreya, Georgia, serif; }
.icon { width: 360px; height: 360px; flex: none; filter: drop-shadow(0 20px 30px rgb(0 0 0 / .6)); }
.icon svg { width: 100%; height: 100%; }
h1 { margin: 0; font-family: Cinzel, serif; font-size: 78px; line-height: 1.05; color: #f6dc8c; text-shadow: 0 4px 12px rgb(0 0 0 / .6); }
p { margin: 24px 0 0; font-size: 34px; line-height: 1.3; color: #e9d8b6; }
.emblems { display: flex; gap: 18px; margin-top: 36px; }
.emblem { width: 64px; height: 64px; border-radius: 50%; border: 3px solid #d4a64a; background: #2e1c10; display: grid; place-items: center; }
.emblem svg { width: 40px; height: 40px; }
</style></head><body><div class="icon">${appIcon()}</div>
<div><h1>Innkeeper's Almanac</h1><p>What's on at the inn today: in-game events for the Forever and Anniversary realms, with your calendar.</p>
<div class="emblems">${emblems}</div></div></body></html>`;
}

async function main(): Promise<void> {
  mkdirSync(root('public/icons'), { recursive: true });
  mkdirSync(root('public/og'), { recursive: true });
  writeFileSync(root('public/favicon.svg'), appIcon());

  const browser = await chromium.launch();
  for (const { file, size, maskable } of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${appIcon({ maskable }).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
    );
    await page.screenshot({ path: root(`public/${file}`), omitBackground: !maskable });
    await page.close();
  }
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(ogHtml(), { waitUntil: 'load' });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: root('public/og/og-image.png') });
  await browser.close();
  console.log(`[assets] favicon.svg, ${ICONS.length} icons, og-image.png`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
