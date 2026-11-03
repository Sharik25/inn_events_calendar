import { readFileSync } from 'node:fs';
import ICAL from 'ical.js';
import { expect, test } from './fixtures';

function parseEvents(ics: string) {
  const cal = new ICAL.Component(ICAL.parse(ics));
  return { cal, events: cal.getAllSubcomponents('vevent').map((c) => new ICAL.Event(c)) };
}

test('hero "Add to calendar": Google link and a valid single-event .ics', async ({ page }) => {
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to calendar' });

  const google = new URL(
    (await sheet
      .getByRole('link', { name: 'Google Calendar', exact: true })
      .getAttribute('href')) ?? '',
  );
  expect(google.hostname).toBe('calendar.google.com');
  expect(google.searchParams.get('dates')).toBe('20261018T080000Z/20261101T090000Z');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    sheet.getByRole('button', { name: 'Apple / Outlook (.ics)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('hallows-end-2026-10-18.ics');
  const { events } = parseEvents(readFileSync((await download.path())!, 'utf8'));
  expect(events).toHaveLength(1);
  expect(events[0]?.uid).toBe(
    'anniversary:hallows-end:2026-10-18T08:00:00.000Z@innkeepers-almanac',
  );
  expect(events[0]?.summary).toBe("Hallow's End");
  await expect(sheet).toBeHidden();
});

test('one-day events during the long event can be added to the .ics', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to calendar' });
  const group = sheet.getByRole('group', { name: "One-day events during Hallow's End" });
  await expect(group.getByRole('checkbox')).toHaveCount(2);

  // Fits a 360px screen: no horizontal scroll, rows are full tap targets.
  const overflow = await sheet.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const row of await group.locator('label').all()) {
    const box = (await row.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }

  // Tapping the row text toggles its checkbox.
  await group.getByText(/Oct 25/).click();
  await expect(group.getByRole('checkbox').nth(1)).toBeChecked();
  await expect(sheet.getByText('2 events in the file')).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    sheet.getByRole('button', { name: 'Apple / Outlook (.ics)' }).click(),
  ]);
  const { events } = parseEvents(readFileSync((await download.path())!, 'utf8'));
  expect(events.map((e) => e.summary)).toEqual([
    "Hallow's End",
    'Stranglethorn Fishing Extravaganza',
  ]);
});

test('subscription feeds are served as text/calendar and parse', async ({ request }) => {
  for (const region of ['eu', 'us']) {
    const res = await request.get(`/calendars/anniversary-${region}.ics`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    const { cal, events } = parseEvents(await res.text());
    expect(cal.getFirstPropertyValue('x-wr-calname')).toContain('Anniversary');
    expect(events.length).toBeGreaterThan(50);
    expect(new Set(events.map((e) => e.uid)).size).toBe(events.length);
  }
});

test('settings offer the feed for the selected region', async ({ page }) => {
  await page.goto('/anniversary/today');
  await page.getByRole('button', { name: 'Settings' }).click();
  const sheet = page.getByRole('dialog', { name: 'Settings & info' });
  await expect(sheet.getByRole('textbox', { name: 'Feed address' })).toHaveValue(
    /\/calendars\/anniversary-eu\.ics$/,
  );
  await sheet.getByRole('radio', { name: 'Americas' }).click();
  await expect(sheet.getByRole('textbox', { name: 'Feed address' })).toHaveValue(
    /\/calendars\/anniversary-us\.ics$/,
  );
  // The local preview runs on http, so it offers the file instead of webcal links.
  await expect(sheet.getByRole('link', { name: 'Download .ics instead' })).toHaveAttribute(
    'href',
    '/calendars/anniversary-us.ics',
  );
});

test('WoW: Forever after launch: Faire day, location, .ics export and its own feed', async ({
  page,
  request,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-10T18:00:00Z'));
  await page.goto('/forever/today');
  await expect(page.getByRole('heading', { level: 1, name: 'Darkmoon Faire' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-version-style', 'modern');

  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add to calendar' });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    sheet.getByRole('button', { name: 'Apple / Outlook (.ics)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('darkmoon-faire-2026-11-09.ics');
  const { events } = parseEvents(readFileSync((await download.path())!, 'utf8'));
  expect(events[0]?.uid).toBe('forever:darkmoon-faire:2026-11-09T08:00:00.000Z@innkeepers-almanac');
  expect(events[0]?.summary).toBe('(tentative) Darkmoon Faire');
  expect(events[0]?.location).toBe('Elwynn Forest');

  const feed = await request.get('/calendars/forever-global.ics');
  expect(feed.ok()).toBe(true);
  expect(parseEvents(await feed.text()).events.map((e) => e.location)).toContain(
    'Mulgore (below Thunder Bluff)',
  );
});
