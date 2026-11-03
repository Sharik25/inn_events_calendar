import { expect, test } from './fixtures';

const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

test('version picker switches to Forever keeping view and date, and back', async ({ page }) => {
  await page.goto('/anniversary/month/2026-11');
  await expect(page.getByRole('heading', { level: 1, name: 'November 2026' })).toBeVisible();

  await page.getByRole('button', { name: 'Version' }).click();
  const picker = page.getByRole('dialog', { name: 'Choose version' });
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: /WoW: Forever/ }).click();

  await expect(page).toHaveURL(/\/forever\/month\/2026-11$/);
  // Before launch: Forever's calendar, with a compact countdown row instead of a launch screen.
  await expect(page.getByRole('heading', { level: 1, name: 'November 2026' })).toBeVisible();
  await expect(page.getByTestId('launch-countdown')).toContainText('Launches in 8d 12h');
  expect(await page.evaluate(overflowX)).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: 'Version' }).click();
  await page
    .getByRole('dialog', { name: 'Choose version' })
    .getByRole('button', { name: /Anniversary/ })
    .click();
  await expect(page).toHaveURL(/\/anniversary\/month\/2026-11$/);
  await expect(page.getByRole('heading', { level: 1, name: 'November 2026' })).toBeVisible();
});

test('the start page opens Forever, then the version picked in the switcher', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/forever\/today$/);

  // Visiting another version is not a choice…
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL(/\/forever\/today$/);

  // …picking it in the switcher is, and survives a reload.
  await page.getByRole('button', { name: 'Version' }).click();
  await page
    .getByRole('dialog', { name: 'Choose version' })
    .getByRole('button', { name: /Anniversary/ })
    .click();
  await expect(page).toHaveURL(/\/anniversary\/today$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/anniversary\/today$/);
});

test('V opens the picker and Escape closes it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hardware keyboard shortcuts are a desktop feature');
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('v');
  const picker = page.getByRole('dialog', { name: 'Choose version' });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: /Anniversary/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(picker).toBeHidden();
});

test('picker fits a 360px screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Version' }).click();
  const box = (await page.getByRole('dialog', { name: 'Choose version' }).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(overflowX)).toBeLessThanOrEqual(0);
});

test('launch countdown sits under the version switcher, compact, above "Coming soon"', async ({
  page,
  isMobile,
}) => {
  await page.goto('/forever/today');
  const chip = (await page.getByRole('button', { name: 'Forever · All realms' }).boundingBox())!;
  const countdown = page.getByTestId('launch-countdown');
  await expect(countdown).toContainText('Launches in 8d 12h');
  const c = (await countdown.boundingBox())!;
  const soon = (await page.getByRole('region', { name: 'Coming soon' }).boundingBox())!;
  const title = (await page.getByRole('heading', { level: 1 }).boundingBox())!;

  expect(Math.abs(c.x - chip.x)).toBeLessThanOrEqual(1); // same left edge as the switcher
  expect(c.y).toBeGreaterThanOrEqual(chip.y + chip.height); // below it, no overlap
  expect(c.y - (chip.y + chip.height)).toBeLessThan(40);
  expect(soon.y).toBeGreaterThanOrEqual(c.y + c.height); // "Coming soon" stacks under it
  if (isMobile) {
    expect(c.height).toBeLessThan(56); // a single compact row
    expect(c.y + c.height).toBeLessThan(title.y);
  } else {
    expect(c.x + c.width).toBeLessThan(title.x); // left column, clear of the day
  }
  expect(await page.evaluate(overflowX)).toBeLessThanOrEqual(0);

  // Week view: one compact row above the grid.
  await page.goto('/forever/week/2026-11-02');
  await expect(page.getByTestId('launch-countdown')).toBeVisible();
  expect((await page.getByTestId('launch-countdown').boundingBox())!.height).toBeLessThan(56);
});
