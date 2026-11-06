// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { CursosAdmin } from './cursos-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const anio = new Date().getFullYear();

const curso = (over: Record<string, unknown>) => ({
  id: 'c1',
  year: 3,
  division: 'A',
  shift: 'morning',
  schoolYear: anio,
  ...over,
});

async function abrir(cursos: unknown[] = [curso({})]) {
  mockApi.mockResolvedValueOnce(cursos);
  render(<CursosAdmin institutionId="esc-1" />);
  if (cursos.length > 0) await screen.findByRole('table');
  else await screen.findByRole('heading', { name: 'No hay cursos registrados' });
}

const abrirMenu = (nombre: string) => userEvent.click(screen.getByRole('button', { name: `Acciones de ${nombre}` }));

describe('CursosAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<CursosAdmin institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando cursos...' })).toBeTruthy();
  });

  it('muestra los cursos con nivel, turno y estado', async () => {
    await abrir([curso({}), curso({ id: 'c2', division: 'B', shift: 'afternoon', schoolYear: anio - 1 })]);

    expect(mockApi).toHaveBeenCalledWith('/courses', { institutionId: 'esc-1' });
    const primero = screen.getByRole('row', { name: /3° A/ }).textContent;
    expect(primero).toContain('Tercer año');
    expect(primero).toContain('Mañana');
    expect(primero).toContain('Activo');
    const segundo = screen.getByRole('row', { name: /3° B/ }).textContent;
    expect(segundo).toContain('Tarde');
    expect(segundo).toContain('Finalizado');
    expect(screen.getByText('Mostrando 1 - 2 de 2 cursos')).toBeTruthy();
  });

  it('buscar filtra la lista', async () => {
    await abrir([curso({}), curso({ id: 'c2', division: 'B' })]);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar curso' }), '3° b');

    expect(screen.queryByRole('row', { name: /3° A/ })).toBeNull();
    expect(screen.getByRole('row', { name: /3° B/ })).toBeTruthy();
  });

  it('pagina de a 10', async () => {
    await abrir(Array.from({ length: 12 }, (_, i) => curso({ id: `x${i}`, year: i + 1 })));

    expect(screen.getByText('Mostrando 1 - 10 de 12 cursos')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    expect(screen.getByText('Mostrando 11 - 12 de 12 cursos')).toBeTruthy();
    expect(screen.getByRole('row', { name: /12° A/ })).toBeTruthy();
  });

  it('avisa si no hay cursos, y Agregar curso abre el formulario', async () => {
    await abrir([]);

    await userEvent.click(screen.getByRole('button', { name: 'Agregar curso' }));

    expect(screen.getByLabelText('División')).toBeTruthy();
  });

  it('crea un curso, confirma y lo muestra en la lista', async () => {
    await abrir();
    mockApi.mockResolvedValueOnce(curso({ id: 'nuevo', year: 1, division: 'C', shift: 'evening' }));

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo curso' }));
    await userEvent.type(screen.getByLabelText('Año'), '1');
    await userEvent.type(screen.getByLabelText('División'), 'C');
    await userEvent.selectOptions(screen.getByLabelText('Turno'), 'evening');
    await userEvent.click(screen.getByRole('button', { name: 'Crear curso' }));

    expect(mockApi).toHaveBeenLastCalledWith('/courses', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 1, division: 'C', shift: 'evening', schoolYear: anio }),
    });
    expect(await screen.findByRole('heading', { name: '¡Cursos actualizados!' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Ver cursos' }));

    expect(screen.getByRole('row', { name: /1° C/ })).toBeTruthy();
  });

  it('si el curso ya existe muestra el mensaje de la API', async () => {
    await abrir();
    mockApi.mockRejectedValueOnce(new ApiError(409, 'Ya existe un curso con ese año'));

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo curso' }));
    await userEvent.type(screen.getByLabelText('Año'), '3');
    await userEvent.type(screen.getByLabelText('División'), 'A');
    await userEvent.click(screen.getByRole('button', { name: 'Crear curso' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Ya existe un curso con ese año');
  });

  it('edita un curso con PATCH', async () => {
    await abrir();
    mockApi.mockResolvedValueOnce(curso({ division: 'B' }));

    await abrirMenu('3° A');
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const division = screen.getByLabelText('División');
    await userEvent.clear(division);
    await userEvent.type(division, 'B');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockApi).toHaveBeenLastCalledWith('/courses/c1', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 3, division: 'B', shift: 'morning', schoolYear: anio }),
    });
    expect(await screen.findByRole('heading', { name: '¡Cursos actualizados!' })).toBeTruthy();
  });

  it('eliminar pide confirmación antes de borrar', async () => {
    await abrir();
    mockApi.mockResolvedValueOnce({ deleted: true });

    await abrirMenu('3° A');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(mockApi).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect(mockApi).toHaveBeenLastCalledWith('/courses/c1', { method: 'DELETE', institutionId: 'esc-1' });
    expect(await screen.findByRole('heading', { name: '¡Cursos actualizados!' })).toBeTruthy();
  });

  it('si no se puede borrar muestra el motivo', async () => {
    await abrir();
    mockApi.mockRejectedValueOnce(new ApiError(409, 'No se puede borrar el curso porque tiene alumnos inscriptos'));

    await abrirMenu('3° A');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'No se puede borrar el curso porque tiene alumnos inscriptos'
    );
  });

  it('si falla la carga muestra el error y Reintentar vuelve a pedirla', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    render(<CursosAdmin institutionId="esc-1" />);

    const alerta = within(await screen.findByRole('alert'));
    expect(alerta.getByRole('heading', { name: 'Error al cargar los cursos' })).toBeTruthy();

    mockApi.mockResolvedValueOnce([curso({})]);
    await userEvent.click(alerta.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('row', { name: /3° A/ })).toBeTruthy();
  });
});
