import { test, expect } from '@playwright/test';

// Celulares chicos y comunes (Android 360, iPhone 375/390): la landing no se
// tiene que poder mover de costado, y el menú tiene que verse entero.
for (const width of [360, 375, 390]) {
  test(`la landing entra en un celu de ${width}px sin correrse de costado`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Ingresar' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Postular' })).toBeVisible();

    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(desborde).toBeLessThanOrEqual(0);
  });
}
