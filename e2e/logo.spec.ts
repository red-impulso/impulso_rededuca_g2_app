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

test('la landing usa el mismo logo animado del sistema, arriba y en el pie', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const arriba = page.getByRole('banner').getByRole('img', { name: 'RedEduca' });
  const pie = page.getByRole('region', { name: 'Contacto de RedEduca' }).getByRole('img', { name: 'RedEduca' });
  await expect(arriba).toBeVisible();
  await expect(pie).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Plataforma Integral');
  // Ya no se usa la imagen vieja del logo.
  await expect(page.locator('img[src*="logo_landing"]')).toHaveCount(0);
  expect(await animacionDe(page, 'header [data-logo="orbitas"]')).not.toBe('none');
});
