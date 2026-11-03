import { expect, test } from './fixtures';

test("Today shows Hallow's End for the mocked date, themed", async ({ page }) => {
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  await expect(page.getByText('Ends in 4d 22h')).toBeVisible();
  await expect(page.locator('time[datetime="2026-10-27"]')).toContainText('27');
  await expect(page.locator('[data-theme="hallows-end"]').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Coming soon' }).getByRole('link')).toHaveCount(2);
});

test('event sheet opens and closes (button, Escape, back to clean URL)', async ({ page }) => {
  await page.goto('/anniversary/today');
  await page.getByRole('link', { name: "Details for Hallow's End" }).click();
  const dialog = page.getByRole('dialog', { name: "Hallow's End" });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\?event=hallows-end$/);
  await expect(dialog.getByText('Ends in 4d 22h')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Warcraft Wiki/ })).toBeVisible();

  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/anniversary\/today$/);

  await page.goto('/anniversary/today?event=stv-fishing');
  const fishing = page.getByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' });
  await expect(fishing).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(fishing).toBeHidden();
});

test('dominance on Jul 4 and day navigation', async ({ page }) => {
  await page.goto('/anniversary/day/2026-07-04');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Fireworks Spectacular' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Also on this day' })
      .getByRole('link', { name: 'Midsummer Fire Festival' }),
  ).toBeVisible();

  // Fireworks lasts until 10:00 on Jul 5, so it still wins that day; Jul 3 is Midsummer alone.
  await page.getByRole('link', { name: 'Previous day' }).click();
  await expect(page).toHaveURL(/\/day\/2026-07-03$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Midsummer Fire Festival' }),
  ).toBeVisible();

  await page.getByRole('link', { name: /Back to today/ }).click();
  await expect(page).toHaveURL(/\/anniversary\/today$/);
});

test('keyboard shortcuts move between days', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hardware keyboard shortcuts are a desktop feature');
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/day\/2026-10-28$/);
  await page.keyboard.press('t');
  await expect(page).toHaveURL(/\/today$/);
});

test('a quiet day shows a fireplace that never blocks taps and stills with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/anniversary/day/2026-11-24');
  await expect(
    page.getByRole('heading', { level: 1, name: 'A quiet day at the inn' }),
  ).toBeVisible();
  const hearth = page.getByTestId('fireplace');
  await expect(hearth).toBeVisible();
  // Just the title and the scene: no hint line under the title.
  await expect(page.getByText(/Pull up a chair/)).toHaveCount(0);
  await expect(hearth).toHaveAttribute('aria-hidden', 'true');

  const flame = hearth.locator('[class*="core"]');
  expect(await flame.evaluate((el) => getComputedStyle(el).animationName)).not.toBe('none');
  // Taps fall through: the topmost element at the hearth's center is not part of it.
  const box = (await hearth.boundingBox())!;
  const hit = await page.evaluate(
    ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('[data-testid="fireplace"]'),
    [box.x + box.width / 2, box.y + box.height / 2],
  );
  expect(hit).toBe(false);

  // Side sparks and splinters: click-through, at the screen edges, animating.
  const sparks = page.locator('[data-kind="sparks"][data-placement="sides"]');
  const splinters = page.locator('[data-kind="splinters"][data-placement="sides"]');
  await expect(sparks).toHaveCSS('pointer-events', 'none');
  expect(
    await sparks
      .locator('span')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toMatch(/spark/); // CSS Modules hash keyframe names

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hearth).toHaveAttribute('data-motion', 'reduce');
  await expect(sparks).toHaveAttribute('data-still');
  expect(
    await sparks
      .locator('span')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await expect(splinters).toBeHidden();
  expect(await flame.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await expect(hearth.locator('[class*="ember"]').first()).toBeHidden();
});

test('event days show no fireplace', async ({ page }) => {
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  await expect(page.getByTestId('fireplace')).toHaveCount(0);
});

test('"Coming soon" sits under the version chip: left column on desktop, on top on phones', async ({
  page,
  isMobile,
}) => {
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  const chip = (await page.getByRole('button', { name: 'Anniversary · Europe' }).boundingBox())!;
  const soon = (await page.getByRole('region', { name: 'Coming soon' }).boundingBox())!;
  const title = (await page.getByRole('heading', { level: 1 }).boundingBox())!;

  expect(Math.abs(soon.x - chip.x)).toBeLessThanOrEqual(1); // same left edge
  expect(soon.y).toBeGreaterThanOrEqual(chip.y + chip.height); // below the chip, no overlap
  expect(soon.y - (chip.y + chip.height)).toBeLessThan(40); // …directly below it
  if (isMobile) expect(soon.y + soon.height).toBeLessThan(title.y);
  else expect(soon.x + soon.width).toBeLessThan(title.x); // its own column, left of the day
});

test('event block shows no highlight lines; the details sheet still has them', async ({ page }) => {
  await page.goto('/anniversary/today');
  const card = page.locator('[class*="heroCard"]');
  await expect(card).toContainText('Trick-or-treat at the inns'); // the one-line summary stays
  for (const line of ['Trick-or-treat at innkeepers', 'Defeat the Headless Horseman']) {
    await expect(card.getByText(line)).toHaveCount(0);
  }
  await card.getByRole('link', { name: "Details for Hallow's End" }).click();
  const sheet = page.getByRole('dialog', { name: "Hallow's End" });
  for (const line of ['Trick-or-treat at innkeepers', 'Defeat the Headless Horseman']) {
    await expect(sheet.getByText(line)).toBeVisible();
  }
});

test('"Also on this day" sits in the sidebar above "Coming soon", and hides when empty', async ({
  page,
  isMobile,
}) => {
  await page.goto('/anniversary/day/2026-10-25'); // Hallow's End + the Sunday fishing contest
  const also = page.getByRole('region', { name: 'Also on this day' });
  const soon = page.getByRole('region', { name: 'Coming soon' });
  await expect(
    also.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' }),
  ).toBeVisible();
  const a = (await also.boundingBox())!;
  const s = (await soon.boundingBox())!;
  const title = (await page.getByRole('heading', { level: 1 }).boundingBox())!;
  expect(Math.abs(a.x - s.x)).toBeLessThanOrEqual(1); // same column
  expect(a.y + a.height).toBeLessThanOrEqual(s.y); // directly before "Coming soon"
  if (isMobile) expect(s.y + s.height).toBeLessThan(title.y);
  else expect(a.x + a.width).toBeLessThan(title.x);
  // Compact rows: one line each, 48px tap target.
  const row = (await also.getByRole('article').first().boundingBox())!;
  expect(row.height).toBeGreaterThanOrEqual(48);
  expect(row.height).toBeLessThan(64);

  // Following the viewed date: Monday has nothing else on, so no empty box.
  await page.getByRole('link', { name: 'Next day' }).click();
  await expect(page).toHaveURL(/2026-10-26$/);
  await expect(page.getByRole('region', { name: 'Also on this day' })).toHaveCount(0);
  await expect(soon).toBeVisible();
});
