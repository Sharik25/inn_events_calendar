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
  await expect(page.getByRole('region', { name: 'Also on this day' })).toContainText(
    'Midsummer Fire Festival',
  );

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

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hearth).toHaveAttribute('data-motion', 'reduce');
  expect(await flame.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await expect(hearth.locator('[class*="ember"]').first()).toBeHidden();
});

test('event days show no fireplace', async ({ page }) => {
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  await expect(page.getByTestId('fireplace')).toHaveCount(0);
});
