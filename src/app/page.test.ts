import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('página raíz', () => {
  it('muestra la portada con el titular y la invitación a postular', () => {
    const html = renderToStaticMarkup(Home());
    expect(html).toContain('comunidad más unida');
    expect(html).toContain('Postular a Piloto');
    expect(html).toContain('/ingresar');
  });
});
