// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import jsQR from 'jsqr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { CarnetHijo } from './carnet-hijo';
import { CarnetQr } from './carnet-qr';
import { codigoAlumno, leerCodigoAlumno } from './codigo-alumno';
import { matrizQr, QrSvg } from './qr-svg';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);
const ID = '3f2b8c1e-9d4a-4c7b-8e21-5a6f0d9c1b2e';

// Pinta la matriz como imagen (blanco y negro, con margen) y la lee con jsQR,
// igual que lo hace la cámara del docente.
function leerMatriz(matriz: boolean[][]): string | null {
  const escala = 4;
  const margen = 4;
  const lado = (matriz.length + margen * 2) * escala;
  const pixeles = new Uint8ClampedArray(lado * lado * 4).fill(255);
  matriz.forEach((fila, y) =>
    fila.forEach((negro, x) => {
      if (!negro) return;
      for (let dy = 0; dy < escala; dy++) {
        for (let dx = 0; dx < escala; dx++) {
          const i = (((y + margen) * escala + dy) * lado + (x + margen) * escala + dx) * 4;
          pixeles[i] = pixeles[i + 1] = pixeles[i + 2] = 0;
        }
      }
    })
  );
  return jsQR(pixeles, lado, lado)?.data ?? null;
}

describe('código del alumno', () => {
  it('arma y lee el código del carnet', () => {
    expect(codigoAlumno(ID)).toBe(`rededuca:alumno:${ID}`);
    expect(leerCodigoAlumno(`rededuca:alumno:${ID}`)).toBe(ID);
    expect(leerCodigoAlumno(`  rededuca:alumno:${ID}\n`)).toBe(ID);
  });

  it.each(['', 'hola', 'https://ejemplo.com', 'rededuca:alumno:', 'rededuca:docente:abc', 'rededuca:alumno:<script>'])(
    'no acepta "%s"',
    (texto) => {
      expect(leerCodigoAlumno(texto)).toBeNull();
    }
  );
});

describe('QrSvg', () => {
  it('el QR que se dibuja se puede leer de verdad', () => {
    expect(leerMatriz(matrizQr(codigoAlumno(ID)))).toBe(`rededuca:alumno:${ID}`);
  });

  it('se dibuja como imagen con nombre', () => {
    render(<QrSvg texto="hola" etiqueta="Código QR de prueba" />);

    const svg = screen.getByRole('img', { name: 'Código QR de prueba' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.querySelector('path')?.getAttribute('d')).toMatch(/^M/);
  });
});

describe('CarnetQr', () => {
  afterEach(cleanup);

  it('muestra escuela, alumno, curso y el QR con su código', () => {
    render(<CarnetQr studentId={ID} nombre="Pérez, Ana" curso="4° Año A" escuela="IES Nº 6 de Perico" />);

    const carnet = screen.getByRole('region', { name: 'Carnet de Pérez, Ana' });
    expect(carnet.textContent).toContain('IES Nº 6 de Perico');
    expect(carnet.textContent).toContain('4° Año A');
    expect(screen.getByRole('img', { name: 'Código QR de asistencia de Pérez, Ana' })).toBeTruthy();
  });

  it('Imprimir abre la impresión del navegador', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<CarnetQr studentId={ID} nombre="Pérez, Ana" curso="4° Año A" />);

    await userEvent.click(screen.getByRole('button', { name: 'Imprimir carnet' }));

    expect(imprimir).toHaveBeenCalled();
    imprimir.mockRestore();
  });
});

describe('CarnetHijo', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('busca al hijo entre los del tutor y muestra su carnet', async () => {
    mockApi.mockResolvedValueOnce([
      { id: 'otro', firstName: 'Otro', lastName: 'Chico', course: { id: 'c1', year: 1, division: 'B' } },
      { id: ID, firstName: 'Ana', lastName: 'Pérez', course: { id: 'c2', year: 4, division: 'A' } },
    ]);
    render(<CarnetHijo institutionId="esc-1" studentId={ID} />);

    expect(await screen.findByRole('region', { name: 'Carnet de Pérez, Ana' })).toBeTruthy();
    expect(mockApi).toHaveBeenCalledWith('/me/students', { institutionId: 'esc-1' });
    expect(screen.getByText('4° Año A')).toBeTruthy();
  });

  it('si no es un hijo del tutor lo dice', async () => {
    mockApi.mockResolvedValueOnce([]);
    render(<CarnetHijo institutionId="esc-1" studentId={ID} />);

    expect(await screen.findByText('No encontramos a este alumno entre tus hijos.')).toBeTruthy();
  });

  it('si falla muestra el error', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    render(<CarnetHijo institutionId="esc-1" studentId={ID} />);

    expect((await screen.findByRole('alert')).textContent).toBe('Hubo un problema');
  });
});
