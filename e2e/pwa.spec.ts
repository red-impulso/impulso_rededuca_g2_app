import { test, expect } from '@playwright/test';

test('sin sesión, /manifest.webmanifest responde con los datos de RedEduca', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest', { maxRedirects: 0 });
  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBe('RedEduca');
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#14213d');

  // Chrome pide íconos de 192 y 512 px para dejar instalar.
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toContain('192x192');
  expect(sizes).toContain('512x512');

  for (const icon of manifest.icons as { src: string }[]) {
    const iconResponse = await request.get(icon.src, { maxRedirects: 0 });
    expect(iconResponse.status(), icon.src).toBe(200);
  }
});

test('/ingresar enlaza al manifest', async ({ page }) => {
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest\.webmanifest/
  );
});
