import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('página raíz', () => {
  it('muestra la landing con el titular, la invitación al piloto y el acceso a /ingresar', () => {
    const html = renderToStaticMarkup(Home());
    expect(html).toContain('Tecnología que conecta');
    expect(html).toContain('prueba piloto');
    expect(html).toContain('/ingresar');
  });
});
