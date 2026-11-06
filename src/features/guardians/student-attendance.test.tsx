// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { StudentAttendance } from './student-attendance';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const resumen = { present: 0, absent: 0, late: 0, justified: 0, percentage: null };

describe('StudentAttendance', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('muestra el porcentaje grande y las fechas con su estado', async () => {
    mockApi.mockResolvedValueOnce({
      records: [
        { date: '2026-11-06', status: 'absent' },
        { date: '2026-11-05', status: 'present' },
        { date: '2026-11-04', status: 'late' },
        { date: '2026-11-03', status: 'justified' },
      ],
      summary: { ...resumen, present: 1, absent: 1, late: 1, justified: 1, percentage: 66.7 },
    });

    render(<StudentAttendance institutionId="esc-1" studentId="a1" />);

    expect((await screen.findByRole('heading', { level: 2 })).textContent).toBe('66,7 %');
    expect(mockApi).toHaveBeenCalledWith('/students/a1/attendance', { institutionId: 'esc-1' });

    const filas = screen.getAllByRole('listitem');
    expect(filas).toHaveLength(4);
    expect(within(filas[0]).getByText('06/11/2026')).toBeTruthy();
    expect(within(filas[0]).getByText('Ausente')).toBeTruthy();
    expect(within(filas[1]).getByText('Presente')).toBeTruthy();
    expect(within(filas[2]).getByText('Tarde')).toBeTruthy();
    expect(within(filas[3]).getByText('Justificado')).toBeTruthy();
  });

  it('la fecha no se corre un día por la zona horaria', async () => {
    mockApi.mockResolvedValueOnce({
      records: [{ date: '2026-03-01', status: 'absent' }],
      summary: { ...resumen, absent: 1, percentage: 0 },
    });

    render(<StudentAttendance institutionId="esc-1" studentId="a1" />);

    expect(await screen.findByText('01/03/2026')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('0 %');
  });

  it('sin registros lo dice y no muestra lista', async () => {
    mockApi.mockResolvedValueOnce({ records: [], summary: resumen });

    render(<StudentAttendance institutionId="esc-1" studentId="a1" />);

    expect((await screen.findByRole('heading', { level: 2 })).textContent).toBe('Sin registros');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('con solo días justificados no hay porcentaje, pero sí la lista', async () => {
    mockApi.mockResolvedValueOnce({
      records: [{ date: '2026-11-03', status: 'justified' }],
      summary: { ...resumen, justified: 1 },
    });

    render(<StudentAttendance institutionId="esc-1" studentId="a1" />);

    expect((await screen.findByRole('heading', { level: 2 })).textContent).toBe('Sin porcentaje todavía');
    expect(screen.getByText('Justificado')).toBeTruthy();
  });

  it('muestra el error de la API', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(403, 'No podés ver la asistencia de este alumno'));

    render(<StudentAttendance institutionId="esc-1" studentId="otro" />);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No podés ver la asistencia de este alumno'
    );
  });
});
