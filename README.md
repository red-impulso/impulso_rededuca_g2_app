# RedEduca — App web (Grupo 2)

Página web que van a usar docentes y familias.
Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina.

Deploy: https://impulso-rededuca-g2-app.vercel.app

## Stack

- Next.js 16 + React 19 + TypeScript (App Router, carpeta `src/`)
- Tailwind CSS 4
- Supabase (auth)
- API propia: [`red-impulso/impulso_rededuca_g2_api`](https://github.com/red-impulso/impulso_rededuca_g2_api) (NestJS)
- Pruebas: Vitest + Testing Library (unitarias) y Playwright (e2e)

## Requisitos

- Node.js 20 o superior (usamos la 24)
- npm

## Instalar

```bash
npm ci
cp .env.example .env.local   # completar los valores de Supabase y la API
```

## Correr en modo desarrollo

```bash
npm run dev
```

Después abrir http://localhost:3000

## Probar

```bash
npm test            # pruebas unitarias (Vitest)
npm run test:e2e    # pruebas de navegador (Playwright)
```

## Revisar el código

```bash
npm run lint        # ESLint
npm run build       # compilación de producción
```

## Estructura

```
src/
  app/            rutas (landing /, /ingresar, panel en (panel)/)
  components/     ui, layout (SiteFooter, PanelNav), brand (LogoAnimado)
  features/       pantallas por tema (alumnos, docentes, notas, asistencia…)
  config/         tokens de marca y menú por rol
  lib/            apiFetch (token + X-Institution-Id) y cliente Supabase
e2e/              pruebas Playwright
```

## CI

Cada push y PR corre lint, build, Vitest y Playwright
(`.github/workflows/ci.yml`). Si algo se rompe, el PR queda marcado.
