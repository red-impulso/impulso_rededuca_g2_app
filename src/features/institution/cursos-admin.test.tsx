// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { CursosAdmin } from './cursos-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const curso = (over: Record<string, unknown>) => ({
  id: 'c1',
  year: 3,
  division: 'A',
  shift: 'morning',
  schoolYear: 2026,
  ...over,
});

describe('CursosAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('muestra los cursos con turno y ciclo lectivo', async () => {
    mockApi.mockResolvedValue([curso({}), curso({ id: 'c2', division: 'B', shift: 'afternoon' })]);
    render(<CursosAdmin institutionId="esc-1" />);

    expect(await screen.findByText('3° A · Turno mañana')).toBeTruthy();
    expect(screen.getByText('3° B · Turno tarde')).toBeTruthy();
    expect(screen.getAllByText(/Ciclo 2026/)).toHaveLength(2);
    expect(mockApi).toHaveBeenCalledWith('/courses', { institutionId: 'esc-1' });
  });

  it('avisa si no hay cursos', async () => {
    mockApi.mockResolvedValue([]);
    render(<CursosAdmin institutionId="esc-1" />);

    expect(await screen.findByText('Todavía no hay cursos.')).toBeTruthy();
  });

  it('crea un curso y lo agrega a la lista', async () => {
    mockApi
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(curso({ id: 'nuevo', year: 1, division: 'C', shift: 'evening' }));
    render(<CursosAdmin institutionId="esc-1" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Nuevo curso' }));
    await userEvent.type(screen.getByLabelText('Año'), '1');
    await userEvent.type(screen.getByLabelText('División'), 'C');
    await userEvent.selectOptions(screen.getByLabelText('Turno'), 'evening');
    await userEvent.clear(screen.getByLabelText('Ciclo lectivo'));
    await userEvent.type(screen.getByLabelText('Ciclo lectivo'), '2026');
    await userEvent.click(screen.getByRole('button', { name: 'Crear curso' }));

    expect(mockApi).toHaveBeenLastCalledWith('/courses', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 1, division: 'C', shift: 'evening', schoolYear: 2026 }),
    });
    expect(await screen.findByText('1° C · Turno noche')).toBeTruthy();
  });

  it('edita un curso con PATCH', async () => {
    mockApi.mockResolvedValueOnce([curso({})]).mockResolvedValueOnce(curso({ division: 'B' }));
    render(<CursosAdmin institutionId="esc-1" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const division = screen.getByLabelText('División');
    await userEvent.clear(division);
    await userEvent.type(division, 'B');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockApi).toHaveBeenLastCalledWith('/courses/c1', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 3, division: 'B', shift: 'morning', schoolYear: 2026 }),
    });
    expect(await screen.findByText('3° B · Turno mañana')).toBeTruthy();
  });

  it('eliminar pide confirmación antes de borrar', async () => {
    mockApi.mockResolvedValueOnce([curso({})]).mockResolvedValueOnce({ deleted: true });
    render(<CursosAdmin institutionId="esc-1" />);

    const eliminar = await screen.findByRole('button', { name: 'Eliminar' });
    await userEvent.click(eliminar);
    expect(mockApi).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));
    expect(mockApi).toHaveBeenLastCalledWith('/courses/c1', { method: 'DELETE', institutionId: 'esc-1' });
    expect(await screen.findByText('Todavía no hay cursos.')).toBeTruthy();
  });

  it('muestra el error de la API al cargar', async () => {
    mockApi.mockRejectedValue(new ApiError(403, 'No tenés permiso'));
    render(<CursosAdmin institutionId="esc-1" />);

    expect((await screen.findByRole('alert')).textContent).toContain('No tenés permiso');
  });
});
