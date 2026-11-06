// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
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
  const responder = async (ruta: string) => {
    if (!(ruta in respuestas)) throw new Error(`sin respuesta para ${ruta}`);
    const respuesta = respuestas[ruta];
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  };
  mockApi.mockImplementation(responder as unknown as typeof apiFetch);
}

const base = { '/subjects': materias, '/courses': cursos, '/teachers': docentes };

async function abrir(respuestas: Record<string, unknown> = base) {
  apiResponde(respuestas);
  render(<MateriasAdmin institutionId="esc-1" />);
  await screen.findByRole('table');
}

const abrirMenu = (nombre: string) => userEvent.click(screen.getByRole('button', { name: `Acciones de ${nombre}` }));

describe('MateriasAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<MateriasAdmin institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando materias...' })).toBeTruthy();
  });

  it('muestra cada materia con su curso, docente y estado', async () => {
    await abrir();

    const matematica = screen.getByRole('row', { name: /Matemática/ }).textContent;
    expect(matematica).toContain('3° A');
    expect(matematica).toContain('Laura Gómez');
    expect(matematica).toContain('Activa');
    expect(screen.getByRole('row', { name: /Lengua/ }).textContent).toContain('Sin docente');
    expect(screen.getByText('Mostrando 1 - 2 de 2 materias')).toBeTruthy();
  });

  it('buscar filtra por materia o docente', async () => {
    await abrir();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar materia' }), 'laura');

    expect(screen.getByRole('row', { name: /Matemática/ })).toBeTruthy();
    expect(screen.queryByRole('row', { name: /Lengua/ })).toBeNull();
  });

  it('avisa si no hay materias', async () => {
    apiResponde({ ...base, '/subjects': [] });
    render(<MateriasAdmin institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'No hay materias registradas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Agregar materia' })).toBeTruthy();
  });

  it('crea una materia con curso y docente', async () => {
    await abrir();

    mockApi.mockResolvedValueOnce({ id: 'n1', name: 'Historia', courseId: 'c1', teacherMembershipId: 'm2' });
    await userEvent.click(screen.getByRole('button', { name: 'Nueva materia' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Historia');
    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'c1');
    await userEvent.selectOptions(screen.getByLabelText('Docente'), 'm2');
    await userEvent.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(mockApi).toHaveBeenLastCalledWith('/subjects', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Historia', courseId: 'c1', teacherMembershipId: 'm2' }),
    });
    expect(await screen.findByRole('heading', { name: '¡Materias actualizadas!' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Ver materias' }));

    expect(screen.getByRole('row', { name: /Historia/ })).toBeTruthy();
  });

  it('sin docente elegido no manda teacherMembershipId', async () => {
    await abrir();

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

  it('Editar cambia el docente, y también puede quitarlo', async () => {
    await abrir();

    mockApi.mockResolvedValueOnce({ id: 's1', name: 'Matemática', courseId: 'c1', teacherMembershipId: null });
    await abrirMenu('Matemática');
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.selectOptions(screen.getByLabelText('Docente'), '');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockApi).toHaveBeenLastCalledWith('/subjects/s1', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Matemática', courseId: 'c1', teacherMembershipId: null }),
    });
    expect(await screen.findByRole('heading', { name: '¡Materias actualizadas!' })).toBeTruthy();
  });

  it('eliminar pide confirmación antes de borrar', async () => {
    await abrir();

    await abrirMenu('Matemática');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(mockApi).not.toHaveBeenCalledWith('/subjects/s1', expect.anything());

    mockApi.mockResolvedValueOnce({ deleted: true });
    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect(mockApi).toHaveBeenLastCalledWith('/subjects/s1', { method: 'DELETE', institutionId: 'esc-1' });
  });

  it('si falla la carga muestra el error', async () => {
    apiResponde({ '/subjects': new ApiError(403, 'No tenés permiso') });
    render(<MateriasAdmin institutionId="esc-1" />);

    const alerta = within(await screen.findByRole('alert'));
    expect(alerta.getByRole('heading', { name: 'Error al cargar las materias' })).toBeTruthy();
    expect(alerta.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
