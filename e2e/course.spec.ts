import { expect, test } from '@playwright/test';
const course = 'courses/abap-platform-rap120';
const lesson = course + '/getting-started';
const storageKey = 'course-progress:abap-platform-rap120';
const checkpoint = '#course-checkpoint-group-id-selected';

test('resume preserves the checkpoint anchor across routes and reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(lesson);
  await page.locator(checkpoint).check();
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toContain('group-id-selected');
  await page.getByRole('link', { name: 'Course home', exact: true }).click();
  await page.locator('a[href="/course/' + course + '"]').first().click();
  const resume = page.locator('a[href$="#checkpoint-group-id-selected"]').first();
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page).toHaveURL(/getting-started#checkpoint-group-id-selected$/);
  const target = page.locator('#checkpoint-group-id-selected');
  await expect.poll(async () => (await target.boundingBox())?.y).toBeGreaterThanOrEqual(60);
  await expect.poll(async () => (await target.boundingBox())?.y).toBeLessThan(250);
  await expect(page.locator(checkpoint)).toBeChecked();
  await page.reload();
  await expect(page.locator(checkpoint)).toBeChecked();
  await expect(target).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(course + '$'));
  expect(errors).toEqual([]);
});

test('Studio preview stays isolated over SPA navigation', async ({ page }) => {
  await page.goto(lesson + '?idPreview=course');
  await page.locator(checkpoint).check();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByRole('link', { name: 'Course home', exact: true }).click();
  await page.locator('a[href="/course/' + course + '"]').first().click();
  await page.locator('a[href$="#checkpoint-group-id-selected"]').first().click();
  await expect(page.locator(checkpoint)).toBeChecked();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.goto(lesson);
  await expect(page.locator(checkpoint)).not.toBeChecked();
});

test('catalog is compact and course endpoint contains only its own pages', async ({ request, page }) => {
  const catalog = await request.get('api/course-preview/catalog.json');
  expect(catalog.ok()).toBeTruthy();
  const entries = await catalog.json();
  expect(entries.length).toBeGreaterThan(3);
  expect(entries.every((entry: Record<string, unknown>) => !('nodes' in entry))).toBeTruthy();
  const response = await request.get('api/course-preview/courses/abap-platform-rap120/data.json');
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).every((entry: { path: string }) => entry.path.startsWith('/' + course))).toBeTruthy();
  const snapshots: string[] = [];
  page.on('request', request => { if (request.url().includes('/snapshot.json')) snapshots.push(request.url()); });
  await page.goto('courses');
  await expect(page.getByRole('heading', { name: 'Courses', exact: true })).toBeVisible();
  await page.locator('a[href="/course/' + course + '"]').first().click();
  await expect(page.locator('h1')).toBeVisible();
  expect(snapshots).toEqual([]);
});

test('outline links use native hash navigation on the same page', async ({ page }) => {
  await page.goto(lesson);
  await page.locator('section[aria-labelledby="course-page-outline-title"]').getByRole('link', { name: 'Connect ADT to the ABAP System' }).click();
  await expect(page).toHaveURL(/#connect-adt-to-the-abap-system$/);
  await expect(page.locator('#connect-adt-to-the-abap-system')).toBeInViewport();
});
