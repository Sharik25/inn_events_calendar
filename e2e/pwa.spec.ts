import { expect, test } from './fixtures';

test('installable: manifest with icons, standalone display and theme color', async ({
  page,
  request,
}) => {
  await page.goto('/anniversary/today');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({
    name: "Innkeeper's Almanac",
    short_name: 'Almanac',
    start_url: '.',
    display: 'standalone',
    theme_color: '#1c120c',
  });
  const sizes = manifest.icons.map(
    (i: { sizes: string; purpose?: string }) => `${i.sizes}${i.purpose ? `:${i.purpose}` : ''}`,
  );
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512:maskable']));
  for (const icon of manifest.icons as { src: string }[]) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
  // iOS home-screen support.
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    '/icons/apple-touch-icon.png',
  );
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    'content',
    'yes',
  );
});

test('works offline once the service worker has cached the app', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(isMobile, 'service worker offline test runs in Chromium');
  await page.goto('/anniversary/today');
  await expect(page.getByRole('heading', { level: 1, name: "Hallow's End" })).toBeVisible();
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    // Wait until this page is controlled so navigations go through the worker.
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve),
      );
    }
    return reg.active?.state;
  });

  await context.setOffline(true);
  await page.goto('/anniversary/month/2026-12');
  await expect(page.getByRole('heading', { level: 1, name: 'December 2026' })).toBeVisible();
  await expect(page.locator('[data-date="2026-12-20"]')).toHaveAttribute(
    'data-theme',
    'winter-veil',
  );
  await context.setOffline(false);
});

test('settings sheet fits a 360px screen; the filter and subscribe modules are hidden', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Settings' }).click();
  const sheet = page.getByRole('dialog', { name: 'Settings & info' });
  await expect(sheet.getByRole('group', { name: 'Show times in' })).toBeVisible();
  // Hidden for now (src/config.ts FEATURES), not deleted.
  await expect(sheet.getByRole('group', { name: 'Events shown' })).toHaveCount(0);
  await expect(sheet.getByRole('heading', { name: 'Subscribe to all events' })).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
