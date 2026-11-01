import { test, expect } from '@playwright/test';

test('sin sesión, visitar /inicio termina en /ingresar', async ({ page }) => {
  await page.goto('/inicio', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/ingresar$/);
});

test('/ingresar muestra el formulario y el pie del grupo', async ({ page }) => {
  await page.goto('/ingresar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText(
    'Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina'
  );
});
