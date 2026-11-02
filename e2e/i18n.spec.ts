import { expect, test } from './fixtures';

const overflowX = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

for (const [locale, quietDay, settingsTitle] of [
  ['de-DE', 'Ein ruhiger Tag im Gasthaus', 'Einstellungen & Infos'],
  ['fr-FR', 'Une journée tranquille à l’auberge', 'Paramètres et infos'],
  ['ru-RU', 'Тихий день в таверне', 'Настройки и информация'],
] as const) {
  test.describe(locale, () => {
    test.use({ locale });

    test(`follows the browser language and fits 360px (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      for (const path of [
        '/anniversary/today',
        '/anniversary/week/2026-10-26',
        '/anniversary/month/2026-10',
        '/forever/today',
      ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(overflowX), path).toBeLessThanOrEqual(0);
      }
      await page.goto('/anniversary/day/2026-11-24');
      await expect(page.getByRole('heading', { level: 1, name: quietDay })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale.slice(0, 2));

      await page.locator('header button').last().click();
      const sheet = page.getByRole('dialog', { name: settingsTitle });
      await expect(sheet).toBeVisible();
      expect(await sheet.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
    });
  });
}

test('the picked language beats the browser language and survives a reload', async ({ page }) => {
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('combobox', { name: 'Language' }).selectOption('de');
  // The app re-renders in German with the settings sheet still open.
  await expect(page.getByRole('dialog', { name: 'Einstellungen & Infos' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Zum Kalender hinzufügen' })).toBeVisible();
});
