// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AlertasRiesgo } from './alertas-riesgo';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const enRiesgo = [
  {
    student: { id: 'a1', firstName: 'Ana', lastName: 'Pérez' },
    course: { id: 'c1', year: 1, division: 'A' },
    reasons: [
      { type: 'attendance', percentage: 33.3 },
      { type: 'grade', subject: { id: 's1', name: 'Matemática' }, average: 4.5 },
    ],
  },
  {
    student: { id: 'a2', firstName: 'Eli', lastName: 'Acosta' },
    course: { id: 'c2', year: 2, division: 'B' },
    reasons: [{ type: 'attendance', percentage: 0 }],
  },
];

const tarjeta = () => screen.getByRole('region', { name: /Alumnos en riesgo/ });

describe('AlertasRiesgo', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('lista los alumnos en riesgo con su curso y los motivos, y explica la regla', async () => {
    mockApi.mockResolvedValueOnce(enRiesgo);
    render(<AlertasRiesgo institutionId="esc-1" />);

    const ana = await screen.findByRole('listitem', { name: 'Ana Pérez' });
    expect(mockApi).toHaveBeenCalledWith('/alerts', { institutionId: 'esc-1' });
    expect(within(tarjeta()).getByText('2')).toBeTruthy();
    expect(within(ana).getByText('1°A')).toBeTruthy();
    expect(within(ana).getByText('Asistencia 33,3 %')).toBeTruthy();
    expect(within(ana).getByText('Matemática: 4,5')).toBeTruthy();
    expect(within(screen.getByRole('listitem', { name: 'Eli Acosta' })).getByText('Asistencia 0 %')).toBeTruthy();
    expect(screen.getByText(/menos del 75 % de asistencia o alguna materia con promedio menor a 6/)).toBeTruthy();
  });

  it('para la dirección cada nombre lleva a la ficha del alumno', async () => {
    mockApi.mockResolvedValueOnce(enRiesgo);
    render(<AlertasRiesgo institutionId="esc-1" conEnlace />);

    expect((await screen.findByRole('link', { name: 'Ana Pérez' })).getAttribute('href')).toBe('/alumnos/a1');
  });

  it('para el docente los nombres no son enlaces', async () => {
    mockApi.mockResolvedValueOnce(enRiesgo);
    render(<AlertasRiesgo institutionId="esc-1" />);

    await screen.findByRole('listitem', { name: 'Ana Pérez' });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('sin alumnos en riesgo lo dice', async () => {
    mockApi.mockResolvedValueOnce([]);
    render(<AlertasRiesgo institutionId="esc-1" />);

    expect(await screen.findByText('Ningún alumno en riesgo por ahora.')).toBeTruthy();
  });

  it('si falla muestra el error y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    render(<AlertasRiesgo institutionId="esc-1" />);

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos cargar las alertas.');

    mockApi.mockResolvedValueOnce(enRiesgo);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('listitem', { name: 'Ana Pérez' })).toBeTruthy();
    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});
