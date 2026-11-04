import { test, expect } from '@playwright/test';

function animacionDe(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).evaluate((el) => getComputedStyle(el).animationName);
}

test('en /ingresar el logo gira las órbitas y deja quieto el centro', async ({ page }) => {
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('img', { name: 'RedEduca' })).toBeVisible();
  expect(await animacionDe(page, '[data-logo="orbitas"]')).not.toBe('none');
  expect(await animacionDe(page, '[data-logo="centro"]')).toBe('none');
});

test('con "reducir movimiento" activado el logo no gira', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('img', { name: 'RedEduca' })).toBeVisible();
  expect(await animacionDe(page, '[data-logo="orbitas"]')).toBe('none');
});
