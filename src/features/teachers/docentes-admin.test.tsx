// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { DocentesAdmin } from './docentes-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const curso = { id: 'c1', year: 3, division: 'A', shift: 'morning', schoolYear: 2026 };

const laura = {
  id: 't1',
  fullName: 'Laura Prueba',
  subjects: [{ id: 'm1', name: 'Matemática', course: curso }],
};
const pablo = { id: 't2', fullName: 'Pablo Ejemplo', subjects: [] };

const materias = [
  { id: 'm1', name: 'Matemática', courseId: 'c1', teacherMembershipId: 't1' },
  { id: 'm2', name: 'Historia', courseId: 'c1', teacherMembershipId: null },
];

function responder(docentes: unknown[] = [laura, pablo], subjects: unknown[] = materias) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (opciones?.method === 'PUT') return {} as never;
    if (path === '/teachers') return docentes as never;
    if (path === '/subjects') return subjects as never;
    if (path === '/courses') return [curso] as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(docentes?: unknown[], subjects?: unknown[]) {
  responder(docentes, subjects);
  render(<DocentesAdmin institutionId="esc-1" />);
  await screen.findByRole('list', { name: 'Docentes' });
}

const tarjeta = (nombre: string) => within(screen.getByRole('listitem', { name: nombre }));

function ultimoPut() {
  return mockApi.mock.calls.filter(([, opciones]) => opciones?.method === 'PUT').at(-1)!;
}

describe('DocentesAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<DocentesAdmin institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando docentes...' })).toBeTruthy();
  });

  it('muestra cada docente con sus materias', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/teachers', { institutionId: 'esc-1' });
    expect(tarjeta('Laura Prueba').getByText('Matemática · 3° A')).toBeTruthy();
    expect(tarjeta('Pablo Ejemplo').getByText('Sin materias asignadas.')).toBeTruthy();
  });

  it('buscar filtra por nombre o materia', async () => {
    await abrir();
    const buscador = screen.getByRole('searchbox', { name: 'Buscar docente o materia' });

    await userEvent.type(buscador, 'pablo');
    expect(screen.queryByRole('listitem', { name: 'Laura Prueba' })).toBeNull();
    expect(screen.getByRole('listitem', { name: 'Pablo Ejemplo' })).toBeTruthy();

    await userEvent.clear(buscador);
    await userEvent.type(buscador, 'matematica');
    expect(screen.getByRole('listitem', { name: 'Laura Prueba' })).toBeTruthy();
    expect(screen.queryByRole('listitem', { name: 'Pablo Ejemplo' })).toBeNull();
  });

  it('si la búsqueda no encuentra nada lo dice', async () => {
    await abrir();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar docente o materia' }), 'zzz');

    expect(screen.getByText('No se encontraron docentes con esa búsqueda.')).toBeTruthy();
  });

  it('al elegir materia solo ofrece las que el docente no tiene, y avisa quién la dicta hoy', async () => {
    await abrir();

    const deLaura = tarjeta('Laura Prueba').getByRole('combobox', { name: 'Materia para Laura Prueba' });
    expect(within(deLaura).queryByRole('option', { name: /Matemática/ })).toBeNull();
    expect(within(deLaura).getByRole('option', { name: 'Historia · 3° A' })).toBeTruthy();

    const dePablo = tarjeta('Pablo Ejemplo').getByRole('combobox', { name: 'Materia para Pablo Ejemplo' });
    expect(within(dePablo).getByRole('option', { name: 'Matemática · 3° A (hoy: Laura Prueba)' })).toBeTruthy();
  });

  it('asigna una materia y vuelve a pedir la lista', async () => {
    await abrir();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Materia para Pablo Ejemplo' }), 'm2');
    responder(
      [laura, { ...pablo, subjects: [{ id: 'm2', name: 'Historia', course: curso }] }],
      [materias[0], { ...materias[1], teacherMembershipId: 't2' }]
    );

    await userEvent.click(screen.getByRole('button', { name: 'Asignar a Pablo Ejemplo' }));

    expect(await tarjeta('Pablo Ejemplo').findByText('Historia · 3° A')).toBeTruthy();
    const [ruta, opciones] = ultimoPut();
    expect(ruta).toBe('/subjects/m2/teacher');
    expect(opciones).toMatchObject({ method: 'PUT', institutionId: 'esc-1' });
    expect(JSON.parse(opciones!.body as string)).toEqual({ teacherMembershipId: 't2' });
  });

  it('el botón Asignar no hace nada hasta elegir una materia', async () => {
    await abrir();

    expect((screen.getByRole('button', { name: 'Asignar a Pablo Ejemplo' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('quita una materia', async () => {
    await abrir();
    responder([{ ...laura, subjects: [] }, pablo]);

    await userEvent.click(screen.getByRole('button', { name: 'Quitar Matemática · 3° A a Laura Prueba' }));

    expect(await tarjeta('Laura Prueba').findByText('Sin materias asignadas.')).toBeTruthy();
    const [ruta, opciones] = ultimoPut();
    expect(ruta).toBe('/subjects/m1/teacher');
    expect(JSON.parse(opciones!.body as string)).toEqual({ teacherMembershipId: null });
  });

  it('si asignar falla muestra el mensaje de la API y conserva la lista', async () => {
    await abrir();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Materia para Pablo Ejemplo' }), 'm2');
    mockApi.mockRejectedValueOnce(new ApiError(400, 'El docente indicado no pertenece a la institución'));

    await userEvent.click(screen.getByRole('button', { name: 'Asignar a Pablo Ejemplo' }));

    expect((await screen.findByRole('alert')).textContent).toContain('El docente indicado no pertenece a la institución');
    expect(screen.getByRole('listitem', { name: 'Laura Prueba' })).toBeTruthy();
  });

  it('sin docentes lo dice', async () => {
    responder([]);
    render(<DocentesAdmin institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'No hay docentes registrados' })).toBeTruthy();
  });

  it('sin materias lleva a crearlas', async () => {
    await abrir([pablo], []);

    expect(screen.getByRole('link', { name: 'Crear una materia' }).getAttribute('href')).toBe('/institucion/materias');
    expect(screen.queryByRole('combobox', { name: 'Materia para Pablo Ejemplo' })).toBeNull();
  });

  it('si falla muestra el error y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<DocentesAdmin institutionId="esc-1" />);

    await screen.findByRole('heading', { name: 'Error al cargar los docentes' });
    responder();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('list', { name: 'Docentes' })).toBeTruthy();
  });
});
