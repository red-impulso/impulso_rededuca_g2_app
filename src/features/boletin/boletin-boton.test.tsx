// @vitest-environment jsdom
import { cleanup, render as renderBase, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { descargarBoletin } from './boletin';
import { SessionContext, type SessionState } from '../session/session-provider';
import { BoletinBoton } from './boletin-boton';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

vi.mock('./boletin', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./boletin')>()),
  descargarBoletin: vi.fn(),
}));

const sesion = {
  status: 'ready',
  activeMembership: { id: 'm1', institutionId: 'esc-1', institutionName: 'IES Nº 6 de Perico', role: 'guardian' },
} as unknown as SessionState;

const render = (ui: ReactElement) =>
  renderBase(<SessionContext.Provider value={sesion}>{ui}</SessionContext.Provider>);

const mockApi = vi.mocked(apiFetch);
const mockDescargar = vi.mocked(descargarBoletin);

const vacias = { tp1: null, tp2: null, parcial1: null, parcial2: null, final: null };
const notas = [
  { subject: { id: 's1', name: 'Matemática' }, period: { id: 'p1', name: '1.er trimestre' }, value: 8, items: { ...vacias, tp1: 8 } },
];
const asistencia = { records: [], summary: { percentage: 90, present: 9, absent: 1, late: 0, justified: 0 } };

// Responde según la dirección pedida, sin importar el orden.
function api(respuestas: Record<string, unknown>) {
  mockApi.mockImplementation(async (path: string) => {
    if (path in respuestas) {
      const r = respuestas[path];
      if (r instanceof Error) throw r;
      return r;
    }
    throw new Error(`sin respuesta para ${path}`);
  });
}

const boton = () => screen.getByRole('button', { name: /Descargar boletín/ });

describe('BoletinBoton', () => {
  beforeEach(() => {
    mockApi.mockReset();
    mockDescargar.mockReset();
  });
  afterEach(cleanup);

  it('con el alumno ya conocido pide notas y asistencia y descarga el PDF', async () => {
    api({ '/students/a1/grades': notas, '/students/a1/attendance': asistencia });
    render(<BoletinBoton institutionId="esc-1" studentId="a1" alumno={{ nombre: 'Pérez, Ana', curso: '4° Año A' }} />);

    await userEvent.click(boton());

    expect(mockApi).toHaveBeenCalledWith('/students/a1/grades', { institutionId: 'esc-1' });
    expect(mockApi).toHaveBeenCalledWith('/students/a1/attendance', { institutionId: 'esc-1' });
    expect(mockDescargar).toHaveBeenCalledTimes(1);
    const datos = mockDescargar.mock.calls[0][0];
    expect(datos).toMatchObject({
      escuela: 'IES Nº 6 de Perico',
      alumno: 'Pérez, Ana',
      curso: '4° Año A',
      filas: [['Matemática', '1.er trimestre', '8', '-', '-', '-', '-', '8', 'Aprobada']],
      asistencia: { percentage: 90, present: 9, absent: 1, late: 0, justified: 0 },
    });
    expect(datos.emitido).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('para el tutor busca el nombre y el curso del hijo en /me/students', async () => {
    api({
      '/students/a1/grades': notas,
      '/students/a1/attendance': asistencia,
      '/me/students': [
        { id: 'a2', firstName: 'Otro', lastName: 'Chico', course: { id: 'c1', year: 1, division: 'B' } },
        { id: 'a1', firstName: 'Ana', lastName: 'Pérez', course: { id: 'c2', year: 4, division: 'A' } },
      ],
    });
    render(<BoletinBoton institutionId="esc-1" studentId="a1" />);

    await userEvent.click(boton());

    expect(mockDescargar.mock.calls[0][0]).toMatchObject({ alumno: 'Pérez, Ana', curso: '4° Año A' });
  });

  it('mientras arma el PDF el botón queda deshabilitado', async () => {
    let terminar: (v: unknown) => void = () => {};
    mockApi.mockImplementation(() => new Promise((resolve) => (terminar = resolve)));
    render(<BoletinBoton institutionId="esc-1" studentId="a1" alumno={{ nombre: 'Pérez, Ana', curso: '4° Año A' }} />);

    await userEvent.click(boton());

    expect(screen.getByRole('button', { name: 'Generando boletín...' })).toHaveProperty('disabled', true);
    terminar(undefined);
  });

  it('si la API falla muestra el mensaje y deja reintentar', async () => {
    api({
      '/students/a1/grades': new ApiError(403, 'No podés ver las notas de este alumno'),
      '/students/a1/attendance': asistencia,
    });
    render(<BoletinBoton institutionId="esc-1" studentId="a1" alumno={{ nombre: 'Pérez, Ana', curso: '4° Año A' }} />);

    await userEvent.click(boton());

    expect((await screen.findByRole('alert')).textContent).toBe('No podés ver las notas de este alumno');
    expect(mockDescargar).not.toHaveBeenCalled();
    expect(boton()).toHaveProperty('disabled', false);
  });
});
