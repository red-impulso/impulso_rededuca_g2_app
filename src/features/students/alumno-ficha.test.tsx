// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AlumnoFicha } from './alumno-ficha';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const cursos = [
  { id: 'c1', year: 1, division: 'A', shift: 'morning', schoolYear: 2026 },
  { id: 'c2', year: 2, division: 'B', shift: 'afternoon', schoolYear: 2026 },
];

const ficha = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  firstName: 'Ana',
  lastName: 'Prueba',
  dni: '42345678',
  status: 'active',
  course: { id: 'c1', year: 1, division: 'A', shift: 'morning' },
  birthDate: '2010-03-12',
  address: 'Calle de Prueba 123',
  phone: '388 000 0000',
  email: 'ana@demo.rededuca',
  updatedAt: '2026-11-07T15:00:00Z',
  ...over,
});

function responder(alumno: unknown = ficha(), tutores: unknown = [{ id: 'g1', fullName: 'Tutora Demo' }]) {
  mockApi.mockImplementation(async (path) => {
    if (path === '/courses') return cursos as never;
    if (path === '/students/s1') return alumno as never;
    if (path === '/students/s1/guardians') return tutores as never;
    if (path === '/students/s1/grades') return [] as never;
    if (path === '/students/s1/attendance') return { records: [], summary: { percentage: null } } as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(alumno?: unknown, tutores?: unknown) {
  responder(alumno, tutores);
  render(<AlumnoFicha institutionId="esc-1" studentId="s1" />);
  await screen.findByRole('heading', { name: 'Ana Prueba' });
}

const pestana = (nombre: string) => userEvent.click(screen.getByRole('tab', { name: nombre }));

describe('AlumnoFicha', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<AlumnoFicha institutionId="esc-1" studentId="s1" />);

    expect(screen.getByRole('heading', { name: 'Ficha del alumno' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cargando alumno...' })).toBeTruthy();
  });

  it('muestra la cabecera y los datos personales', async () => {
    await abrir();

    expect(screen.getByRole('link', { name: 'Volver a la lista' }).getAttribute('href')).toBe('/alumnos');
    expect(screen.getByText('DNI: 42.345.678')).toBeTruthy();
    expect(screen.getByText('Año: 2026')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Datos personales' }).getAttribute('aria-selected')).toBe('true');

    const datos = within(screen.getByRole('tabpanel'));
    expect(datos.getByText('12/03/2010')).toBeTruthy();
    expect(datos.getByText('Calle de Prueba 123')).toBeTruthy();
    expect(datos.getByText('388 000 0000')).toBeTruthy();
    expect(datos.getByText('ana@demo.rededuca')).toBeTruthy();
    expect(datos.getByText('Mañana')).toBeTruthy();
    expect(datos.getByText('Última actualización: 07/11/2026')).toBeTruthy();
  });

  it('un dato sin cargar se indica, y sin actualización no muestra el aviso', async () => {
    await abrir(ficha({ birthDate: null, address: null, phone: null, email: null, updatedAt: null }));

    expect(screen.getAllByText('Sin cargar')).toHaveLength(4);
    expect(screen.queryByText(/Última actualización/)).toBeNull();
  });

  it('la pestaña Familia muestra los tutores', async () => {
    await abrir();

    await pestana('Familia');

    expect(await screen.findByText('Tutora Demo')).toBeTruthy();
    expect(mockApi).toHaveBeenCalledWith('/students/s1/guardians', { institutionId: 'esc-1' });
  });

  it('la pestaña Familia avisa si no hay tutores', async () => {
    await abrir(ficha(), []);

    await pestana('Familia');

    expect(await screen.findByText('No hay tutores vinculados.')).toBeTruthy();
  });

  it('la pestaña Familia avisa si no se pudieron cargar', async () => {
    await abrir();
    mockApi.mockRejectedValueOnce(new Error('caída'));

    await pestana('Familia');

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron cargar los tutores');
  });

  it('la pestaña Académica pide notas y asistencia del alumno', async () => {
    await abrir();

    await pestana('Académica');

    await screen.findByText('Sin registros');
    expect(mockApi).toHaveBeenCalledWith('/students/s1/grades', { institutionId: 'esc-1' });
    expect(mockApi).toHaveBeenCalledWith('/students/s1/attendance', { institutionId: 'esc-1' });
  });

  it('al editar envía solo lo que cambió y confirma', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const telefono = screen.getByRole('textbox', { name: 'Teléfono' });
    await userEvent.clear(telefono);
    await userEvent.type(telefono, '388 111 1111');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Curso' }), 'c2');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'inactive');
    mockApi.mockResolvedValueOnce(ficha() as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByRole('heading', { name: '¡Cambios guardados!' });
    const patch = mockApi.mock.calls.find(([, opciones]) => opciones?.method === 'PATCH')!;
    expect(patch[0]).toBe('/students/s1');
    expect(JSON.parse(patch[1]!.body as string)).toEqual({
      phone: '388 111 1111',
      courseId: 'c2',
      status: 'inactive',
    });
    expect(screen.getByText('La información se actualizó correctamente.')).toBeTruthy();
  });

  it('"Ver alumno" vuelve a la ficha con los datos nuevos', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Dirección' }), ' bis');
    mockApi.mockResolvedValueOnce(ficha() as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByRole('heading', { name: '¡Cambios guardados!' });
    responder(ficha({ address: 'Calle de Prueba 123 bis' }));

    await userEvent.click(screen.getByRole('button', { name: 'Ver alumno' }));

    expect(await screen.findByText('Calle de Prueba 123 bis')).toBeTruthy();
  });

  it('borrar un dato opcional lo manda vacío', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await userEvent.clear(screen.getByRole('textbox', { name: 'Dirección' }));
    mockApi.mockResolvedValueOnce(ficha() as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByRole('heading', { name: '¡Cambios guardados!' });
    const patch = mockApi.mock.calls.find(([, opciones]) => opciones?.method === 'PATCH')!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ address: '' });
  });

  it('un alumno sin DNI cargado se puede editar sin completarlo', async () => {
    await abrir(ficha({ dni: null }));
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await userEvent.type(screen.getByRole('textbox', { name: 'Dirección' }), ' bis');
    mockApi.mockResolvedValueOnce(ficha() as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await screen.findByRole('heading', { name: '¡Cambios guardados!' });
    const patch = mockApi.mock.calls.find(([, opciones]) => opciones?.method === 'PATCH')!;
    expect(JSON.parse(patch[1]!.body as string)).toEqual({ address: 'Calle de Prueba 123 bis' });
  });

  it('si editar falla muestra el mensaje de la API y Cancelar vuelve a la ficha', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'DNI' }), '9');
    mockApi.mockRejectedValueOnce(new ApiError(409, 'Ya existe un alumno con ese DNI'));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Ya existe un alumno con ese DNI');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('heading', { name: 'Ana Prueba' })).toBeTruthy();
  });

  it('un alumno que no existe muestra el mensaje de la API', async () => {
    mockApi.mockRejectedValue(new ApiError(404, 'No se encontró el alumno'));
    render(<AlumnoFicha institutionId="esc-1" studentId="s1" />);

    await screen.findByRole('heading', { name: 'Error al cargar la ficha del alumno' });
    expect(screen.getByText('No se encontró el alumno')).toBeTruthy();
  });

  it('Reintentar vuelve a pedir la ficha', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<AlumnoFicha institutionId="esc-1" studentId="s1" />);
    await screen.findByRole('heading', { name: 'Error al cargar la ficha del alumno' });
    responder();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Ana Prueba' })).toBeTruthy();
  });
});
