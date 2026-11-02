import { expect, test } from './fixtures';

const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

test('/ opens Today with the disclaimer and no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/forever\/today$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Not affiliated with or endorsed by Blizzard/).first()).toBeVisible();
  expect(await page.evaluate(overflowX)).toBeLessThanOrEqual(0);
});

test('narrowest supported width (360px) has no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of [
    '/anniversary/today',
    '/anniversary/day/2026-07-04',
    '/anniversary/day/2026-11-15',
    '/anniversary/day/2026-11-24', // quiet day: the fireplace and its firelight
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(overflowX), path).toBeLessThanOrEqual(0);
  }
});

test('unknown pages show Not Found', async ({ page }) => {
  await page.goto('/nowhere/today');
  await expect(page.getByRole('heading', { name: 'Lost in the Twisting Nether' })).toBeVisible();
});

test('an open tooltip stays inside a 360px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/anniversary/day/2026-07-04');
  await page.getByRole('button', { name: 'Unconfirmed' }).first().focus();
  const tip = page.getByRole('tooltip').first();
  await expect(tip).toBeVisible();
  const box = (await tip.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  // WebKit updates scrollWidth a frame after the tip is repositioned.
  await expect.poll(() => page.evaluate(overflowX)).toBeLessThanOrEqual(0);
});
