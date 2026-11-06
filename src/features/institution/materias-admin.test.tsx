// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { MateriasAdmin } from './materias-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const cursos = [{ id: 'c1', year: 3, division: 'A', shift: 'morning', schoolYear: 2026 }];
const docentes = [
  { id: 'm1', fullName: 'Laura Gómez' },
  { id: 'm2', fullName: 'Juan Paz' },
];
const materias = [
  { id: 's1', name: 'Matemática', courseId: 'c1', teacherMembershipId: 'm1' },
  { id: 's2', name: 'Lengua', courseId: 'c1', teacherMembershipId: null },
];

function apiResponde(respuestas: Record<string, unknown>) {
  mockApi.mockImplementation(async (ruta: string) => {
    if (!(ruta in respuestas)) throw new Error(`sin respuesta para ${ruta}`);
    const respuesta = respuestas[ruta];
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  });
}

const base = { '/subjects': materias, '/courses': cursos, '/teachers': docentes };

describe('MateriasAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('muestra cada materia con su curso y docente', async () => {
    apiResponde(base);
    render(<MateriasAdmin institutionId="esc-1" />);

    expect(await screen.findByText('Matemática')).toBeTruthy();
    expect(screen.getByText('Lengua')).toBeTruthy();
    expect(screen.getAllByText(/3° A · Turno mañana/)).toHaveLength(2);
    expect(screen.getByDisplayValue('Laura Gómez')).toBeTruthy();
    expect(screen.getByDisplayValue('Sin asignar')).toBeTruthy();
  });

  it('crea una materia con curso y docente', async () => {
    apiResponde({
      '/subjects': [],
      '/courses': cursos,
      '/teachers': docentes,
    });
    render(<MateriasAdmin institutionId="esc-1" />);
    await screen.findByText('Todavía no hay materias.');

    mockApi.mockResolvedValueOnce({ id: 'n1', name: 'Historia', courseId: 'c1', teacherMembershipId: 'm2' });
    await userEvent.click(screen.getByRole('button', { name: 'Nueva materia' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Historia');
    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'c1');
    await userEvent.selectOptions(screen.getByLabelText(/Docente/), 'm2');
    await userEvent.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(mockApi).toHaveBeenLastCalledWith('/subjects', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Historia', courseId: 'c1', teacherMembershipId: 'm2' }),
    });
    expect(await screen.findByText('Historia')).toBeTruthy();
  });

  it('sin docente elegido no manda teacherMembershipId', async () => {
    apiResponde(base);
    render(<MateriasAdmin institutionId="esc-1" />);
    await screen.findByText('Matemática');

    mockApi.mockResolvedValueOnce({ id: 'n1', name: 'Arte', courseId: 'c1', teacherMembershipId: null });
    await userEvent.click(screen.getByRole('button', { name: 'Nueva materia' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Arte');
    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(mockApi).toHaveBeenLastCalledWith('/subjects', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Arte', courseId: 'c1' }),
    });
  });

  it('asigna y desasigna docente con PUT /subjects/:id/teacher', async () => {
    apiResponde(base);
    render(<MateriasAdmin institutionId="esc-1" />);
    await screen.findByText('Matemática');

    mockApi.mockResolvedValueOnce({ id: 's1', name: 'Matemática', courseId: 'c1', teacherMembershipId: 'm2' });
    await userEvent.selectOptions(screen.getByDisplayValue('Laura Gómez'), 'm2');
    expect(mockApi).toHaveBeenLastCalledWith('/subjects/s1/teacher', {
      method: 'PUT',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherMembershipId: 'm2' }),
    });
    expect(await screen.findByDisplayValue('Juan Paz')).toBeTruthy();

    mockApi.mockResolvedValueOnce({ id: 's1', name: 'Matemática', courseId: 'c1', teacherMembershipId: null });
    await userEvent.selectOptions(screen.getByDisplayValue('Juan Paz'), '');
    expect(mockApi).toHaveBeenLastCalledWith('/subjects/s1/teacher', {
      method: 'PUT',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherMembershipId: null }),
    });
  });

  it('eliminar pide confirmación antes de borrar', async () => {
    apiResponde(base);
    render(<MateriasAdmin institutionId="esc-1" />);
    await screen.findByText('Matemática');

    const eliminar = screen.getAllByRole('button', { name: 'Eliminar' })[0];
    await userEvent.click(eliminar);
    expect(mockApi).not.toHaveBeenCalledWith('/subjects/s1', expect.anything());

    mockApi.mockResolvedValueOnce({ deleted: true });
    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));
    expect(mockApi).toHaveBeenLastCalledWith('/subjects/s1', { method: 'DELETE', institutionId: 'esc-1' });
  });

  it('muestra el error de la API al cargar', async () => {
    apiResponde({ '/subjects': new ApiError(403, 'No tenés permiso') });
    render(<MateriasAdmin institutionId="esc-1" />);

    expect((await screen.findByRole('alert')).textContent).toContain('No tenés permiso');
  });
});
