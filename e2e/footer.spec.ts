import { test, expect } from '@playwright/test';

test('el pie muestra "Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina"', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('contentinfo')).toContainText(
    'Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina'
  );
});