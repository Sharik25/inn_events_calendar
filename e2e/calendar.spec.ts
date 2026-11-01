import { expect, test } from './fixtures';

const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

test('Month Oct 2026: cells tinted by the dominant event, today glowing', async ({ page }) => {
  await page.goto('/anniversary/month/2026-10');
  await expect(page.getByRole('heading', { level: 1, name: 'October 2026' })).toBeVisible();

  for (let d = 18; d <= 31; d++) {
    await expect(page.locator(`[data-date="2026-10-${d}"]`)).toHaveAttribute(
      'data-theme',
      'hallows-end',
    );
  }
  await expect(page.locator('[data-date="2026-10-17"]')).toHaveAttribute('data-theme', 'base');
  const today = page.locator('[data-date="2026-10-27"]');
  await expect(today).toHaveAttribute('data-today', 'true');
  // Tint token is applied to the cell.
  const tint = await today.evaluate((el) =>
    getComputedStyle(el).getPropertyValue('--cell-tint').trim(),
  );
  expect(tint).not.toBe('transparent');
});

test('Month view wears one theme: its longest-running event', async ({ page }) => {
  const shell = page.locator('main').locator('xpath=ancestor::*[@data-theme][1]');
  for (const [month, themeId] of [
    ['2026-10', 'hallows-end'],
    // Hallow's End spills into Nov 1, but the week-long Faire runs longer in November.
    ['2026-11', 'darkmoon-faire'],
    ['2026-12', 'winter-veil'],
  ] as const) {
    await page.goto(`/anniversary/month/${month}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(shell, month).toHaveAttribute('data-theme', themeId);
  }
  // Day cells keep their own event's tint.
  await expect(page.locator('[data-date="2026-12-31"]')).toHaveAttribute('data-theme', 'fireworks');
});

test('Week and Month have no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const path of [
    '/anniversary/week/2026-10-25',
    '/anniversary/month/2026-10',
    '/anniversary/month/2026-08',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(overflowX), path).toBeLessThanOrEqual(0);
  }
});

test('tapping a month day opens the Day sheet, which links to the day view', async ({ page }) => {
  await page.goto('/anniversary/month/2026-11');
  // Tap the numeral corner: on desktop, event ribbons cover the rest of the cell.
  await page
    .getByRole('button', { name: /^Sunday, November 15: Darkmoon Faire/ })
    .click({ position: { x: 16, y: 12 } });
  const sheet = page.getByRole('dialog', { name: 'Sunday, November 15' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('link', { name: 'Open day view' }).click();
  await expect(page).toHaveURL(/\/anniversary\/day\/2026-11-15$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Darkmoon Faire' })).toBeVisible();
});

test('week event opens its sheet for that day', async ({ page }) => {
  await page.goto('/anniversary/week/2026-10-25');
  await page
    .getByRole('link', { name: /Fishing/ })
    .first()
    .click();
  await expect(page).toHaveURL(/event=stv-fishing&on=2026-10-25/);
  await expect(
    page.getByRole('dialog', { name: 'Stranglethorn Fishing Extravaganza' }),
  ).toBeVisible();
});

test('keyboard shortcuts switch views and periods', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hardware keyboard shortcuts are a desktop feature');
  const heading = page.getByRole('heading', { level: 1 });
  // Like a person, wait for each view to render before pressing the next key.
  const press = async (key: string, url: RegExp, title: string | RegExp) => {
    await page.keyboard.press(key);
    await expect(page).toHaveURL(url);
    await expect(heading).toHaveText(title);
  };

  await page.goto('/anniversary/today');
  await expect(heading).toHaveText("Hallow's End");
  await press('3', /\/month\/2026-10$/, 'October 2026');
  await press('ArrowRight', /\/month\/2026-11$/, 'November 2026');
  await press('2', /\/week\/2026-11-01$/, 'Nov 1 – 7, 2026');
  await press('ArrowLeft', /\/week\/2026-10-25$/, 'Oct 25 – 31, 2026');
  await press('1', /\/today$/, "Hallow's End");
});

test('desktop month shows ribbons across cells', async ({ page, isMobile }) => {
  test.skip(isMobile, 'ribbons are the desktop layout; mobile shows dots');
  await page.goto('/anniversary/month/2026-10');
  await expect(page.getByRole('link', { name: "Hallow's End" }).first()).toBeVisible();
});

test('an en-US week starts on Sunday in every browser engine', async ({ page }) => {
  await page.goto('/anniversary/week');
  await expect(page).toHaveURL(/\/week\/2026-10-25$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Oct 25 – 31, 2026' })).toBeVisible();
});
