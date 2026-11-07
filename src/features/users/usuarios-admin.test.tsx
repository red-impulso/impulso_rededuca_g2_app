// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { UsuariosAdmin } from './usuarios-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const usuario = (id: string, fullName: string, role: string, status = 'active') => ({
  id,
  userId: `user-${id}`,
  email: `${id}@demo.rededuca`,
  fullName,
  role,
  status,
});

const laura = usuario('m1', 'Laura Gómez', 'teacher');
const jose = usuario('m2', 'José Ejemplo', 'guardian');
const ana = usuario('m3', 'Ana Prueba', 'admin');

function responder(usuarios: unknown[] = [ana, jose, laura]) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (path === '/users' && !opciones?.method) return usuarios as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(usuarios?: unknown[]) {
  responder(usuarios);
  render(<UsuariosAdmin institutionId="esc-1" institutionName="Escuela N° 12" />);
  await screen.findByRole('list', { name: 'Usuarios' });
}

const fila = (nombre: string) => within(screen.getByRole('listitem', { name: nombre }));
const llamada = (metodo: string) => mockApi.mock.calls.find(([, opciones]) => opciones?.method === metodo)!;
const cuerpo = (metodo: string) => JSON.parse(llamada(metodo)[1]!.body as string);

describe('UsuariosAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga lo dice', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<UsuariosAdmin institutionId="esc-1" institutionName="Escuela N° 12" />);

    expect(screen.getByRole('heading', { name: 'Cargando usuarios...' })).toBeTruthy();
  });

  it('muestra cada usuario con su rol, escuela y estado', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/users', { institutionId: 'esc-1' });
    expect(fila('Laura Gómez').getAllByText('m1@demo.rededuca').length).toBeGreaterThan(0);
    expect(fila('Laura Gómez').getByText('Docente')).toBeTruthy();
    expect(fila('Laura Gómez').getByText('Escuela N° 12')).toBeTruthy();
    expect(fila('Laura Gómez').getByText('Activo')).toBeTruthy();
    expect(fila('José Ejemplo').getByText('Tutor')).toBeTruthy();
    expect(fila('Ana Prueba').getByText('Administrador')).toBeTruthy();
    expect(screen.getByText('Mostrando 1 – 3 de 3 usuarios')).toBeTruthy();
  });

  it('un usuario inactivo se indica', async () => {
    await abrir([usuario('m1', 'Laura Gómez', 'teacher', 'inactive')]);

    expect(fila('Laura Gómez').getByText('Inactivo')).toBeTruthy();
  });

  it('busca por nombre, usuario o rol, sin importar las tildes', async () => {
    await abrir();
    const buscador = screen.getByRole('searchbox', { name: 'Buscar por nombre, usuario o rol' });

    await userEvent.type(buscador, 'jose');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await userEvent.clear(buscador);
    await userEvent.type(buscador, 'docente');
    expect(screen.getByRole('listitem', { name: 'Laura Gómez' })).toBeTruthy();
    expect(screen.queryByRole('listitem', { name: 'Ana Prueba' })).toBeNull();

    await userEvent.clear(buscador);
    await userEvent.type(buscador, 'm3@demo');
    expect(screen.getByRole('listitem', { name: 'Ana Prueba' })).toBeTruthy();

    await userEvent.clear(buscador);
    await userEvent.type(buscador, 'nadie');
    expect(screen.getByText('No se encontraron usuarios con esa búsqueda.')).toBeTruthy();
  });

  it('muestra de a 10 y deja pasar de página', async () => {
    const muchos = Array.from({ length: 12 }, (_, i) =>
      usuario(`m${i}`, `Persona ${String(i).padStart(2, '0')}`, 'teacher')
    );
    await abrir(muchos);

    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(screen.getByText('Mostrando 1 – 10 de 12 usuarios')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Mostrando 11 – 12 de 12 usuarios')).toBeTruthy();
  });

  it('sin usuarios invita a agregar el primero', async () => {
    responder([]);
    render(<UsuariosAdmin institutionId="esc-1" institutionName="Escuela N° 12" />);

    await screen.findByRole('heading', { name: 'No hay usuarios cargados' });
    expect(screen.getByText('Agregá el primer usuario para comenzar.')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Agregar usuario' }));

    expect(screen.getByRole('heading', { name: 'Agregar usuario' })).toBeTruthy();
  });

  it('si no se pudieron cargar lo dice y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<UsuariosAdmin institutionId="esc-1" institutionName="Escuela N° 12" />);

    await screen.findByRole('heading', { name: 'Ocurrió un error' });
    expect(screen.getByText('No pudimos cargar los usuarios. Intentá de nuevo.')).toBeTruthy();
    responder();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('list', { name: 'Usuarios' })).toBeTruthy();
  });

  it('agrega un usuario, lo suma en orden y confirma', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar usuario' }));

    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre y apellido' }), 'Berta Demo');
    await userEvent.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'berta@demo.rededuca');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rol' }), 'director');
    await userEvent.type(screen.getByLabelText('Contraseña temporal'), 'clave-de-prueba');
    mockApi.mockResolvedValueOnce(usuario('m9', 'Berta Demo', 'director') as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Usuario agregado correctamente');
    expect(llamada('POST')[0]).toBe('/users');
    expect(cuerpo('POST')).toEqual({
      fullName: 'Berta Demo',
      email: 'berta@demo.rededuca',
      role: 'director',
      temporaryPassword: 'clave-de-prueba',
    });
    expect(fila('Berta Demo').getByText('Director')).toBeTruthy();
    expect(screen.getAllByRole('listitem')[1].textContent).toContain('Berta Demo');

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('si agregar falla muestra el mensaje de la API y deja corregir', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar usuario' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre y apellido' }), 'Berta Demo');
    await userEvent.type(screen.getByRole('textbox', { name: 'Correo electrónico' }), 'berta@demo.rededuca');
    await userEvent.type(screen.getByLabelText('Contraseña temporal'), 'clave-de-prueba');
    mockApi.mockRejectedValueOnce(new ApiError(409, 'El usuario ya tiene ese rol en la institución'));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('alert')).textContent).toContain('El usuario ya tiene ese rol');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('list', { name: 'Usuarios' })).toBeTruthy();
  });

  it('al editar envía solo lo que cambió y no pide contraseña', async () => {
    await abrir();
    await userEvent.click(fila('Laura Gómez').getByRole('button', { name: 'Editar a Laura Gómez' }));

    expect(screen.queryByLabelText('Contraseña temporal')).toBeNull();
    expect((screen.getByRole('textbox', { name: 'Correo electrónico' }) as HTMLInputElement).disabled).toBe(true);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rol' }), 'director');
    mockApi.mockResolvedValueOnce(usuario('m1', 'Laura Gómez', 'director') as never);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Usuario actualizado correctamente');
    expect(llamada('PATCH')[0]).toBe('/memberships/m1');
    expect(cuerpo('PATCH')).toEqual({ role: 'director' });
    expect(fila('Laura Gómez').getByText('Director')).toBeTruthy();
  });

  it('guardar sin cambios vuelve a la lista sin llamar a la API', async () => {
    await abrir();
    await userEvent.click(fila('Laura Gómez').getByRole('button', { name: 'Editar a Laura Gómez' }));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(llamada('PATCH')).toBeUndefined();
    expect(screen.getByRole('list', { name: 'Usuarios' })).toBeTruthy();
  });

  it('desactiva un usuario desde el menú', async () => {
    await abrir();
    await userEvent.click(fila('Laura Gómez').getByRole('button', { name: 'Acciones de Laura Gómez' }));
    mockApi.mockResolvedValueOnce(usuario('m1', 'Laura Gómez', 'teacher', 'inactive') as never);

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(await fila('Laura Gómez').findByText('Inactivo')).toBeTruthy();
    expect(cuerpo('PATCH')).toEqual({ status: 'inactive' });
  });

  it('si la API no deja desactivar muestra el motivo', async () => {
    await abrir();
    await userEvent.click(fila('Ana Prueba').getByRole('button', { name: 'Acciones de Ana Prueba' }));
    mockApi.mockRejectedValueOnce(new ApiError(409, 'No podés dejar la institución sin administradores'));

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect((await screen.findByRole('alert')).textContent).toContain('sin administradores');
    expect(fila('Ana Prueba').getByText('Activo')).toBeTruthy();
  });

  it('eliminar pide confirmación y recién al segundo toque borra', async () => {
    await abrir();
    await userEvent.click(fila('Laura Gómez').getByRole('button', { name: 'Acciones de Laura Gómez' }));

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(llamada('DELETE')).toBeUndefined();
    mockApi.mockResolvedValueOnce({ deleted: true } as never);
    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect((await screen.findByRole('status')).textContent).toContain('Usuario eliminado correctamente');
    expect(llamada('DELETE')[0]).toBe('/memberships/m1');
    expect(screen.queryByRole('listitem', { name: 'Laura Gómez' })).toBeNull();
  });
});
