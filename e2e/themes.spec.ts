import { expect, test } from './fixtures';

const DAYS: [string, string][] = [
  ['2026-10-27', 'hallows-end'],
  ['2026-12-20', 'winter-veil'],
  ['2026-12-31', 'fireworks'],
  ['2026-11-12', 'darkmoon-faire'],
  ['2026-11-22', 'fishing'],
  ['2026-02-26', 'lunar-festival'],
  ['2026-02-12', 'love-is-in-the-air'],
  ['2026-04-08', 'noblegarden'],
  ['2026-04-30', 'childrens-week'],
  ['2026-06-25', 'midsummer'],
  ['2026-10-03', 'brewfest'],
  ['2026-09-24', 'harvest-festival'],
];

const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/** Every `url(#id)` used by SVG art must resolve, or the art renders without its fill. */
const brokenSvgRefs = () =>
  [...document.querySelectorAll('svg [fill^="url(#"], svg [stroke^="url(#"]')]
    .map((el) => (el.getAttribute('fill') ?? el.getAttribute('stroke') ?? '').slice(5, -1))
    .filter((id) => !document.getElementById(id));

test('each event day gets its theme and minimal art, with no horizontal scroll at 360px', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: isMobile ? 360 : 1280, height: 800 });
  for (const [date, themeId] of DAYS) {
    await page.goto(`/anniversary/day/${date}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator(`main`).locator('xpath=ancestor::*[@data-theme][1]')).toHaveAttribute(
      'data-theme',
      themeId,
    );
    await expect(page.getByTestId('decorations-layer')).toBeAttached();
    expect(await page.evaluate(overflowX), date).toBeLessThanOrEqual(0);
    expect(await page.evaluate(brokenSvgRefs), date).toEqual([]);
    // Minimalist (rev. 2): no large corner objects, only garlands/strips and small accents.
    const biggest = await page
      .getByTestId('decorations-layer')
      .evaluate((el) =>
        Math.max(
          0,
          ...[...el.children]
            .filter(
              (c) =>
                !c.hasAttribute('style') || !c.getAttribute('style')?.includes('background-image'),
            )
            .map((c) => parseFloat(getComputedStyle(c).width) || 0),
        ),
      );
    expect(biggest, date).toBeLessThanOrEqual(150);
  }
});

test('mobile shows the bottom strip as a scene at the end of the page', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'mobile layout');
  await page.goto('/anniversary/day/2026-11-22'); // fishing: water ripples along the bottom
  const scene = page.getByTestId('decorations-scene');
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toBeVisible();
  // Fixed-layer bottom art is hidden on mobile so it never sits behind text.
  const hiddenBottom = await page
    .getByTestId('decorations-layer')
    .locator('[data-anchor^="bottom"]')
    .evaluateAll((els) => els.every((el) => getComputedStyle(el).display === 'none'));
  expect(hiddenBottom).toBe(true);
});

test('reduced motion: no particles, decorations stand still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/anniversary/today');
  await expect(page.getByTestId('decorations-layer')).toHaveAttribute('data-motion', 'reduce');
  await expect(page.locator('[data-kind]')).toHaveCount(0);
});

test('particles run with motion allowed, and decorations never block taps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/anniversary/today');
  await expect(page.locator('[data-kind="embers"]')).toBeAttached();
  const layerEvents = await page
    .getByTestId('decorations-layer')
    .evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(layerEvents).toBe('none');
  await page.getByRole('link', { name: "Details for Hallow's End" }).click();
  await expect(page.getByRole('dialog', { name: "Hallow's End" })).toBeVisible();
});

test("'Also on this day' cards wear their own event theme", async ({ page }) => {
  await page.goto('/anniversary/day/2026-11-15');
  const card = page.locator('article', {
    has: page.getByRole('link', { name: 'Stranglethorn Fishing Extravaganza' }),
  });
  await expect(card).toHaveAttribute('data-theme', 'fishing');
  await expect(card.locator('svg').first()).toBeVisible();
  await card.click();
  await expect(
    page.getByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' }),
  ).toBeVisible();
});

test('a corner ornament takes the place of the date plate stud instead of covering it', async ({
  page,
}) => {
  const studs = (date: string) =>
    page.locator(`time[datetime="${date}"]`).evaluate((time) => {
      const bg = getComputedStyle(time.parentElement!, '::before').backgroundImage;
      return bg.match(/radial-gradient/g)?.length ?? 0;
    });
  await page.goto('/anniversary/today'); // Hallow's End: a pumpkin on the corner
  await expect(page.locator('[data-placement="corner"]')).toBeVisible();
  expect(await studs('2026-10-27')).toBe(3);
  await page.goto('/anniversary/day/2026-11-24'); // quiet day: no ornament, all four studs
  await expect(
    page.getByRole('heading', { level: 1, name: 'A quiet day at the inn' }),
  ).toBeVisible();
  expect(await studs('2026-11-24')).toBe(4);
});
