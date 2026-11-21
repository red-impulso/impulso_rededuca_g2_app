import { PassThrough } from 'node:stream';
import type { ReactElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from './page';

// La landing incluye un server component async ("use cache" en el footer),
// que renderToStaticMarkup no puede resolver: el stream espera la suspensión.
function renderToHtml(element: ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = '';
    output.on('data', (chunk) => (html += chunk));
    output.on('end', () => resolve(html));
    const { pipe } = renderToPipeableStream(element, {
      onAllReady: () => pipe(output),
      onError: reject,
    });
  });
}

describe('página raíz', () => {
  it('muestra la landing con el titular, la invitación al piloto y el acceso a /ingresar', async () => {
    const html = await renderToHtml(Home());
    expect(html).toContain('Tecnología que conecta');
    expect(html).toContain('prueba piloto');
    expect(html).toContain('/ingresar');
  });

  it('no suma otro <footer>: el pie del layout es el único contentinfo de la página', async () => {
    const html = await renderToHtml(Home());
    expect(html).not.toContain('<footer');
    expect(html).toContain('aria-label="Contacto de RedEduca"');
  });
});
