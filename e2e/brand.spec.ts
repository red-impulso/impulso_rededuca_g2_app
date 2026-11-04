import { test, expect } from '@playwright/test';

test('el HTML trae los tres rel="icon" y cada uno se descarga sin sesión', async ({ page, request }) => {
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });

  const hrefs = await page
    .locator('link[rel="icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

  expect(hrefs.some((href) => href.startsWith('/favicon.ico'))).toBe(true);
  expect(hrefs.some((href) => href.startsWith('/icon.svg'))).toBe(true);
  expect(hrefs.some((href) => href.startsWith('/icon.png'))).toBe(true);

  for (const href of hrefs) {
    const response = await request.get(href, { maxRedirects: 0 });
    expect(response.status(), href).toBe(200);
  }
});

test('la página usa los tokens de marca y la letra Inter', async ({ page }) => {
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });

  const estilos = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      ink: root.getPropertyValue('--color-ink').trim().toLowerCase(),
      accent: root.getPropertyValue('--color-accent').trim().toLowerCase(),
      surface: root.getPropertyValue('--color-surface').trim(),
      fuente: getComputedStyle(document.body).fontFamily,
    };
  });

  expect(estilos.ink).toBe('#14213d');
  expect(estilos.accent).toBe('#f46a3c');
  expect(estilos.surface).not.toBe('');
  expect(estilos.fuente).toMatch(/Inter/);
});
