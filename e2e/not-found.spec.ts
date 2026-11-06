import { test, expect } from '@playwright/test';

// Termina en .png para que el proxy no lo mande a /ingresar y se vea el 404 sin sesión.
test('una dirección que no existe muestra el 404 en español', async ({ page }) => {
  const response = await page.goto('/no-existe.png', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/inicio');
  await expect(page.getByRole('contentinfo')).toContainText('Creado por alumnos');
});
