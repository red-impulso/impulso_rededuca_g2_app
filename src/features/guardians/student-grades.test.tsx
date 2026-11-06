// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { StudentGrades } from './student-grades';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const nota = (materia: string, periodo: string, value: number) => ({
  subject: { id: materia, name: materia },
  period: { id: periodo, name: periodo },
  value,
});

describe('StudentGrades', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('agrupa las notas por materia y período', async () => {
    mockApi.mockResolvedValueOnce([
      nota('Lengua', '1.er trimestre', 8),
      nota('Matemática', '1.er trimestre', 6.5),
      nota('Matemática', '2.º trimestre', 9),
    ]);

    render(<StudentGrades institutionId="esc-1" studentId="a1" />);

    const matematica = await screen.findByRole('region', { name: 'Matemática' });
    expect(within(matematica).getByText('1.er trimestre')).toBeTruthy();
    expect(within(matematica).getByText('6,5')).toBeTruthy();
    expect(within(matematica).getByText('2.º trimestre')).toBeTruthy();
    expect(within(matematica).getByText('9')).toBeTruthy();

    const lengua = screen.getByRole('region', { name: 'Lengua' });
    expect(within(lengua).getByText('8')).toBeTruthy();
    expect(within(lengua).queryByText('6,5')).toBeNull();

    expect(mockApi).toHaveBeenCalledWith('/students/a1/grades', { institutionId: 'esc-1' });
  });

  it('avisa si todavía no tiene notas', async () => {
    mockApi.mockResolvedValueOnce([]);

    render(<StudentGrades institutionId="esc-1" studentId="a1" />);

    expect(await screen.findByText('Todavía no tiene notas cargadas.')).toBeTruthy();
  });

  it('muestra el error de la API', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(403, 'No podés ver las notas de este alumno'));

    render(<StudentGrades institutionId="esc-1" studentId="otro" />);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No podés ver las notas de este alumno'
    );
  });
});
