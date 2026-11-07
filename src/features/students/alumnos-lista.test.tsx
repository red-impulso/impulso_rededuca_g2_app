// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AlumnosLista } from './alumnos-lista';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const curso1 = { id: 'c1', year: 1, division: 'A', shift: 'morning', schoolYear: 2026 };
const curso2 = { id: 'c2', year: 2, division: 'B', shift: 'afternoon', schoolYear: 2025 };

const alumno = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  firstName: 'Ana',
  lastName: 'Prueba',
  dni: '42345678',
  status: 'active',
  course: { id: 'c1', year: 1, division: 'A', shift: 'morning' },
  ...over,
});

const tomas = alumno({
  id: 's2',
  firstName: 'Tomás',
  lastName: 'Ejemplo',
  dni: '43456789',
  status: 'inactive',
  course: { id: 'c2', year: 2, division: 'B', shift: 'afternoon' },
});

function responder(alumnos: unknown[], cursos: unknown[] = [curso1, curso2]) {
  mockApi.mockImplementation(async (path) => (path === '/courses' ? cursos : alumnos) as never);
}

async function abrir(alumnos: unknown[] = [alumno(), tomas]) {
  responder(alumnos);
  render(<AlumnosLista institutionId="esc-1" />);
  await screen.findByRole('list', { name: 'Alumnos' });
}

const filas = () => within(screen.getByRole('list', { name: 'Alumnos' })).getAllByRole('link');

describe('AlumnosLista', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<AlumnosLista institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Lista de alumnos' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cargando alumnos...' })).toBeTruthy();
    expect(screen.getByText('Por favor, esperá un momento.')).toBeTruthy();
  });

  it('muestra cada alumno con DNI, curso y estado, y lleva a su ficha', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/students', { institutionId: 'esc-1' });
    const fila = screen.getByRole('link', { name: /Prueba, Ana/ });
    expect(fila.getAttribute('href')).toBe('/alumnos/s1');
    expect(fila.textContent).toContain('42.345.678');
    expect(fila.textContent).toContain('1° Año A');
    expect(fila.textContent).toContain('Activo');
    expect(screen.getByRole('link', { name: /Ejemplo, Tomás/ }).textContent).toContain('Inactivo');
    expect(screen.getByText('Mostrando 2 de 2 alumnos')).toBeTruthy();
  });

  it.each([
    ['nombre', 'tomás', 'Ejemplo, Tomás'],
    ['DNI', '42345', 'Prueba, Ana'],
    ['DNI con puntos', '42.345', 'Prueba, Ana'],
    ['curso', '2° año b', 'Ejemplo, Tomás'],
  ])('busca por %s', async (_, texto, encontrado) => {
    await abrir();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno por nombre, DNI o curso' }), texto);

    expect(filas()).toHaveLength(1);
    expect(filas()[0].textContent).toContain(encontrado);
  });

  it('filtra por curso, año y estado', async () => {
    await abrir();

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Curso' }), 'c2');
    expect(filas()[0].textContent).toContain('Ejemplo, Tomás');
    expect(filas()).toHaveLength(1);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Curso' }), '');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Año' }), '2026');
    expect(filas()[0].textContent).toContain('Prueba, Ana');
    expect(filas()).toHaveLength(1);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Año' }), '');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'inactive');
    expect(filas()[0].textContent).toContain('Ejemplo, Tomás');
    expect(filas()).toHaveLength(1);
  });

  it('si la búsqueda no encuentra nada lo dice, sin decir que no hay alumnos', async () => {
    await abrir();

    await userEvent.type(screen.getByRole('searchbox', { name: /Buscar alumno/ }), 'zzz');

    expect(screen.getByText('No se encontraron alumnos con esa búsqueda.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'No hay alumnos registrados' })).toBeNull();
  });

  it('muestra de a 10 y "Ver más" trae los siguientes', async () => {
    await abrir(Array.from({ length: 12 }, (_, i) => alumno({ id: `s${i}`, firstName: `Alumno${i}` })));

    expect(filas()).toHaveLength(10);
    expect(screen.getByText('Mostrando 10 de 12 alumnos')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Ver más' }));

    expect(filas()).toHaveLength(12);
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull();
  });

  it('sin alumnos invita a cargar el primero', async () => {
    responder([]);
    render(<AlumnosLista institutionId="esc-1" />);

    await screen.findByRole('heading', { name: 'No hay alumnos registrados' });
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo alumno' }));

    expect(screen.getByRole('textbox', { name: 'Nombre' })).toBeTruthy();
  });

  it('si falla muestra el error y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<AlumnosLista institutionId="esc-1" />);

    await screen.findByRole('heading', { name: 'Error al cargar la lista de alumnos' });
    responder([alumno()]);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: /Prueba, Ana/ })).toBeTruthy();
  });

  async function completarAlta() {
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo alumno' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Lucía');
    await userEvent.type(screen.getByRole('textbox', { name: 'Apellido' }), 'Demo');
    await userEvent.type(screen.getByRole('textbox', { name: 'DNI' }), '44567890');
    await userEvent.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'lucia@demo.rededuca');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Curso' }), 'c1');
    await userEvent.type(screen.getByRole('textbox', { name: 'Dirección' }), 'Calle de Prueba 1');
  }

  it('da de alta un alumno y ofrece ir a su ficha', async () => {
    await abrir();
    await completarAlta();
    mockApi.mockResolvedValueOnce(alumno({ id: 's9' }) as never);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByRole('heading', { name: '¡Cambios guardados!' });
    const [ruta, opciones] = mockApi.mock.calls.at(-1)!;
    expect(ruta).toBe('/students');
    expect(opciones).toMatchObject({ method: 'POST', institutionId: 'esc-1' });
    expect(JSON.parse(opciones!.body as string)).toEqual({
      firstName: 'Lucía',
      lastName: 'Demo',
      dni: '44567890',
      email: 'lucia@demo.rededuca',
      courseId: 'c1',
      address: 'Calle de Prueba 1',
    });
    expect(screen.getByRole('link', { name: 'Ver alumno' }).getAttribute('href')).toBe('/alumnos/s9');
  });

  it('si el alta falla muestra el mensaje de la API y conserva lo escrito', async () => {
    await abrir();
    await completarAlta();
    mockApi.mockRejectedValueOnce(new ApiError(409, 'Ya existe un alumno con ese DNI'));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Ya existe un alumno con ese DNI');
    expect((screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement).value).toBe('Lucía');
  });

  it('sin cursos no deja dar de alta y lleva a crearlos', async () => {
    responder([alumno()], []);
    render(<AlumnosLista institutionId="esc-1" />);
    await screen.findByRole('list', { name: 'Alumnos' });

    await userEvent.click(screen.getByRole('button', { name: 'Nuevo alumno' }));

    expect(screen.getByRole('link', { name: 'Crear un curso' }).getAttribute('href')).toBe('/institucion/cursos');
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
  });
});
