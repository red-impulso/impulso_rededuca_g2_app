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
const otroCurso = { id: 'c2', year: 4, division: 'B', shift: 'afternoon', schoolYear: 2026 };

const laura = {
  id: 't1',
  fullName: 'Laura Prueba',
  status: 'active',
  dni: '30111222',
  subjects: [{ id: 'm1', name: 'Matemática', course: curso }],
};
const pablo = { id: 't2', fullName: 'Pablo Ejemplo', status: 'inactive', dni: null, subjects: [] };

const fichaLaura = {
  ...laura,
  email: 'laura@demo.rededuca',
  phone: '388 000 0000',
  training: 'Prof. en Matemática',
  startYear: new Date().getFullYear() - 5,
  notes: null,
};
const fichaPablo = {
  ...pablo,
  email: 'pablo@demo.rededuca',
  phone: null,
  training: null,
  startYear: null,
  notes: null,
};

const materias = [
  { id: 'm1', name: 'Matemática', courseId: 'c1', teacherMembershipId: 't1' },
  { id: 'm2', name: 'Historia', courseId: 'c2', teacherMembershipId: null },
  { id: 'm3', name: 'Lengua', courseId: 'c1', teacherMembershipId: 't2' },
];

function responder(docentes: unknown[] = [laura, pablo], subjects: unknown[] = materias, ficha: unknown = fichaLaura) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (opciones?.method) return {} as never;
    if (path === '/teachers') return docentes as never;
    if (path === '/subjects') return subjects as never;
    if (path === '/courses') return [curso, otroCurso] as never;
    if (path === '/teachers/t1') return ficha as never;
    if (path === '/teachers/t2') return fichaPablo as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(docentes?: unknown[], subjects?: unknown[], ficha?: unknown) {
  responder(docentes, subjects, ficha);
  render(<DocentesAdmin institutionId="esc-1" />);
  await screen.findByRole('list', { name: 'Docentes' });
}

async function verLaura(ficha?: unknown) {
  await abrir(undefined, undefined, ficha);
  await userEvent.click(screen.getByRole('button', { name: 'Ver a Laura Prueba' }));
  await screen.findByRole('heading', { name: 'Laura Prueba' });
}

const fila = (nombre: string) => within(screen.getByRole('listitem', { name: nombre }));
const buscador = () => screen.getByRole('searchbox', { name: 'Buscar por nombre, DNI o materia' });
const llamadas = (metodo: string) => mockApi.mock.calls.filter(([, opciones]) => opciones?.method === metodo);
const cuerpo = (metodo: string) => JSON.parse(llamadas(metodo).at(-1)![1]!.body as string);

describe('DocentesAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  describe('lista', () => {
    it('mientras carga muestra el estado de carga', () => {
      mockApi.mockReturnValue(new Promise(() => {}));
      render(<DocentesAdmin institutionId="esc-1" />);

      expect(screen.getByRole('heading', { name: 'Cargando docentes...' })).toBeTruthy();
    });

    it('muestra cada docente con su DNI, materias y estado', async () => {
      await abrir();

      expect(mockApi).toHaveBeenCalledWith('/teachers', { institutionId: 'esc-1' });
      expect(screen.getByRole('heading', { name: 'Lista de docentes (2)' })).toBeTruthy();
      expect(fila('Laura Prueba').getByText('30.111.222')).toBeTruthy();
      expect(fila('Laura Prueba').getByText('Matemática')).toBeTruthy();
      expect(fila('Laura Prueba').getByText('Activo')).toBeTruthy();
      expect(fila('Pablo Ejemplo').getByText('Inactivo')).toBeTruthy();
      expect(fila('Pablo Ejemplo').getByText('Sin materias')).toBeTruthy();
    });

    it('busca por nombre, DNI o materia', async () => {
      await abrir();

      await userEvent.type(buscador(), 'pablo');
      expect(screen.queryByRole('listitem', { name: 'Laura Prueba' })).toBeNull();

      await userEvent.clear(buscador());
      await userEvent.type(buscador(), '30111');
      expect(screen.getByRole('listitem', { name: 'Laura Prueba' })).toBeTruthy();
      expect(screen.queryByRole('listitem', { name: 'Pablo Ejemplo' })).toBeNull();

      await userEvent.clear(buscador());
      await userEvent.type(buscador(), 'matematica');
      expect(screen.getByRole('listitem', { name: 'Laura Prueba' })).toBeTruthy();
    });

    it('filtra por curso', async () => {
      await abrir();

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filtrar por curso' }), 'c1');

      expect(screen.getByRole('listitem', { name: 'Laura Prueba' })).toBeTruthy();
      expect(screen.queryByRole('listitem', { name: 'Pablo Ejemplo' })).toBeNull();
    });

    it('sin resultados lo dice y ofrece cargar un docente', async () => {
      await abrir();

      await userEvent.type(buscador(), 'zzz');

      expect(screen.getByRole('heading', { name: 'No se encontraron docentes' })).toBeTruthy();
      expect(screen.getByText('Probá con otro nombre o ajustá los filtros de búsqueda.')).toBeTruthy();
    });

    it('sin docentes invita a cargar el primero', async () => {
      responder([]);
      render(<DocentesAdmin institutionId="esc-1" />);

      await screen.findByRole('heading', { name: 'No hay docentes registrados' });
      await userEvent.click(screen.getByRole('button', { name: 'Nuevo docente' }));

      expect(screen.getByRole('heading', { name: 'Nuevo docente' })).toBeTruthy();
    });

    it('muestra de a 10 y deja pasar de página', async () => {
      const muchos = Array.from({ length: 12 }, (_, i) => ({
        ...pablo,
        id: `d${i}`,
        fullName: `Docente ${String(i).padStart(2, '0')}`,
      }));
      await abrir(muchos);

      expect(screen.getByText('Mostrando 1 - 10 de 12 docentes')).toBeTruthy();
      await userEvent.click(screen.getByRole('button', { name: 'Página 2' }));

      expect(screen.getByText('Mostrando 11 - 12 de 12 docentes')).toBeTruthy();
      expect(screen.getByRole('listitem', { name: 'Docente 11' })).toBeTruthy();
    });

    it('si falla muestra el error y Reintentar vuelve a pedir', async () => {
      mockApi.mockRejectedValue(new Error('caída'));
      render(<DocentesAdmin institutionId="esc-1" />);

      await screen.findByRole('heading', { name: 'Error al cargar los docentes' });
      responder();
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByRole('list', { name: 'Docentes' })).toBeTruthy();
    });

    it('desactiva un docente desde el menú', async () => {
      await abrir();
      await userEvent.click(fila('Laura Prueba').getByRole('button', { name: 'Acciones de Laura Prueba' }));
      responder([{ ...laura, status: 'inactive' }, pablo]);

      await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

      expect(await fila('Laura Prueba').findByText('Inactivo')).toBeTruthy();
      expect(llamadas('PATCH')[0][0]).toBe('/teachers/t1');
      expect(cuerpo('PATCH')).toEqual({ status: 'inactive' });
    });
  });

  describe('ficha', () => {
    it('muestra los datos del docente y sus materias', async () => {
      await verLaura();

      expect(mockApi).toHaveBeenCalledWith('/teachers/t1', { institutionId: 'esc-1' });
      expect(screen.getByText('DNI: 30.111.222')).toBeTruthy();
      expect(screen.getByText('Tel: 388 000 0000')).toBeTruthy();
      expect(screen.getByText('Email: laura@demo.rededuca')).toBeTruthy();
      expect(screen.getByRole('tab', { name: 'Materias asignadas' }).getAttribute('aria-selected')).toBe('true');

      const panel = within(screen.getByRole('tabpanel'));
      expect(panel.getByRole('heading', { name: 'Materias asignadas (1)' })).toBeTruthy();
      expect(panel.getByText('Curso: 3° Año A')).toBeTruthy();
      expect(panel.getByText('Turno: Mañana')).toBeTruthy();
      expect(panel.getByText('Prof. en Matemática')).toBeTruthy();
      expect(panel.getByText('5 años')).toBeTruthy();
      expect(panel.getByText('Sin observaciones')).toBeTruthy();
    });

    it('un dato sin cargar se indica', async () => {
      await abrir();
      await userEvent.click(screen.getByRole('button', { name: 'Ver a Pablo Ejemplo' }));
      await screen.findByRole('heading', { name: 'Pablo Ejemplo' });

      expect(screen.getByText('DNI: Sin cargar')).toBeTruthy();
      expect(screen.getByText('Tel: Sin cargar')).toBeTruthy();
      expect(screen.getByText('Este docente todavía no tiene materias.')).toBeTruthy();
    });

    it('la pestaña Datos personales muestra lo cargado', async () => {
      await verLaura({ ...fichaLaura, notes: 'Coordina el taller' });

      await userEvent.click(screen.getByRole('tab', { name: 'Datos personales' }));

      const panel = within(screen.getByRole('tabpanel'));
      expect(panel.getByText('Coordina el taller')).toBeTruthy();
      expect(panel.getByText(String(fichaLaura.startYear))).toBeTruthy();
    });

    it('la pestaña Cursos agrupa las materias por curso', async () => {
      await verLaura({
        ...fichaLaura,
        subjects: [
          { id: 'm1', name: 'Matemática', course: curso },
          { id: 'm4', name: 'Física', course: curso },
        ],
      });

      await userEvent.click(screen.getByRole('tab', { name: 'Cursos' }));

      const panel = within(screen.getByRole('tabpanel'));
      expect(panel.getByRole('heading', { name: '3° Año A' })).toBeTruthy();
      expect(panel.getByText('Matemática, Física')).toBeTruthy();
    });

    it('Volver a la lista cierra la ficha', async () => {
      await verLaura();

      await userEvent.click(screen.getByRole('button', { name: 'Volver a la lista' }));

      expect(screen.queryByRole('heading', { name: 'Laura Prueba' })).toBeNull();
    });

    it('si la ficha no carga deja reintentar', async () => {
      await abrir();
      mockApi.mockRejectedValueOnce(new Error('caída'));
      await userEvent.click(screen.getByRole('button', { name: 'Ver a Laura Prueba' }));

      await screen.findByRole('heading', { name: 'Error al cargar el docente' });
      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(await screen.findByRole('heading', { name: 'Laura Prueba' })).toBeTruthy();
    });

    it('al asignar solo ofrece las materias que no tiene y avisa quién la dicta hoy', async () => {
      await verLaura();

      await userEvent.click(screen.getByRole('button', { name: 'Asignar materia' }));

      const selector = screen.getByRole('combobox', { name: 'Materia para asignar' });
      expect(within(selector).queryByRole('option', { name: /Matemática/ })).toBeNull();
      expect(within(selector).getByRole('option', { name: 'Historia · 4° B' })).toBeTruthy();
      expect(within(selector).getByRole('option', { name: 'Lengua · 3° A (hoy: Pablo Ejemplo)' })).toBeTruthy();
    });

    it('asigna una materia, confirma y "Ver docente" vuelve a la ficha', async () => {
      await verLaura();
      await userEvent.click(screen.getByRole('button', { name: 'Asignar materia' }));
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Materia para asignar' }), 'm2');

      await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

      await screen.findByRole('heading', { name: '¡Cambios guardados!' });
      expect(screen.getByText('La asignación de materias se actualizó correctamente.')).toBeTruthy();
      expect(llamadas('PUT')[0][0]).toBe('/subjects/m2/teacher');
      expect(cuerpo('PUT')).toEqual({ teacherMembershipId: 't1' });

      await userEvent.click(screen.getByRole('button', { name: 'Ver docente' }));

      expect(await screen.findByRole('heading', { name: 'Laura Prueba' })).toBeTruthy();
    });

    it('Asignar espera a que se elija una materia', async () => {
      await verLaura();
      await userEvent.click(screen.getByRole('button', { name: 'Asignar materia' }));

      expect((screen.getByRole('button', { name: 'Asignar' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('si asignar falla muestra el mensaje de la API', async () => {
      await verLaura();
      await userEvent.click(screen.getByRole('button', { name: 'Asignar materia' }));
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Materia para asignar' }), 'm2');
      mockApi.mockRejectedValueOnce(new ApiError(400, 'El docente indicado no pertenece a la institución'));

      await userEvent.click(screen.getByRole('button', { name: 'Asignar' }));

      expect((await screen.findByRole('alert')).textContent).toContain('no pertenece a la institución');
    });

    it('sin materias cargadas lleva a crearlas', async () => {
      await abrir(undefined, []);
      await userEvent.click(screen.getByRole('button', { name: 'Ver a Laura Prueba' }));
      await screen.findByRole('heading', { name: 'Laura Prueba' });

      await userEvent.click(screen.getByRole('button', { name: 'Asignar materia' }));

      expect(screen.getByRole('link', { name: 'Crear una materia' }).getAttribute('href')).toBe('/institucion/materias');
    });

    it('quitar una materia pide confirmación', async () => {
      await verLaura();
      const quitar = () => screen.getByRole('button', { name: /Quitar Matemática/ });

      await userEvent.click(quitar());

      expect(llamadas('PUT')).toHaveLength(0);
      responder([{ ...laura, subjects: [] }, pablo], materias, { ...fichaLaura, subjects: [] });
      await userEvent.click(quitar());

      expect(await screen.findByText('Este docente todavía no tiene materias.')).toBeTruthy();
      expect(llamadas('PUT')[0][0]).toBe('/subjects/m1/teacher');
      expect(cuerpo('PUT')).toEqual({ teacherMembershipId: null });
    });
  });

  describe('formulario', () => {
    it('crea un docente y lleva a su ficha', async () => {
      await abrir();
      await userEvent.click(screen.getByRole('button', { name: 'Nuevo docente' }));

      await userEvent.type(screen.getByRole('textbox', { name: 'Nombre y apellido' }), 'Berta Demo');
      await userEvent.type(screen.getByRole('textbox', { name: 'DNI' }), '30999888');
      await userEvent.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'berta@demo.rededuca');
      await userEvent.type(screen.getByLabelText('Contraseña temporal'), 'clave-de-prueba');
      await userEvent.type(screen.getByRole('spinbutton', { name: 'Año de ingreso' }), '2021');
      mockApi.mockResolvedValueOnce({ id: 't1' } as never);
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await screen.findByRole('heading', { name: '¡Cambios guardados!' });
      expect(llamadas('POST')[0][0]).toBe('/teachers');
      expect(cuerpo('POST')).toEqual({
        fullName: 'Berta Demo',
        dni: '30999888',
        email: 'berta@demo.rededuca',
        temporaryPassword: 'clave-de-prueba',
        phone: null,
        training: null,
        startYear: 2021,
        notes: null,
      });

      await userEvent.click(screen.getByRole('button', { name: 'Ver docente' }));

      expect(await screen.findByRole('heading', { name: 'Laura Prueba' })).toBeTruthy();
    });

    it('al editar envía solo lo que cambió', async () => {
      await verLaura();
      await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

      expect(screen.queryByLabelText('Contraseña temporal')).toBeNull();
      const telefono = screen.getByRole('textbox', { name: 'Teléfono' });
      await userEvent.clear(telefono);
      await userEvent.type(telefono, '388 111 1111');
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'inactive');
      mockApi.mockResolvedValueOnce(fichaLaura as never);
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      await screen.findByRole('heading', { name: '¡Cambios guardados!' });
      expect(screen.getByText('La información se actualizó correctamente.')).toBeTruthy();
      expect(llamadas('PATCH')[0][0]).toBe('/teachers/t1');
      expect(cuerpo('PATCH')).toEqual({ phone: '388 111 1111', status: 'inactive' });
    });

    it('editar sin cambios vuelve a la ficha sin llamar a la API', async () => {
      await verLaura();
      await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(llamadas('PATCH')).toHaveLength(0);
      expect(await screen.findByRole('heading', { name: 'Laura Prueba' })).toBeTruthy();
    });

    it('si guardar falla muestra el mensaje de la API y Cancelar cierra', async () => {
      await abrir();
      await userEvent.click(screen.getByRole('button', { name: 'Nuevo docente' }));
      await userEvent.type(screen.getByRole('textbox', { name: 'Nombre y apellido' }), 'Berta Demo');
      await userEvent.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'berta@demo.rededuca');
      await userEvent.type(screen.getByLabelText('Contraseña temporal'), 'clave-de-prueba');
      mockApi.mockRejectedValueOnce(new ApiError(409, 'Ya existe una persona con ese DNI'));

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      expect((await screen.findByRole('alert')).textContent).toContain('Ya existe una persona con ese DNI');
      await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByRole('heading', { name: 'Nuevo docente' })).toBeNull();
    });
  });
});
