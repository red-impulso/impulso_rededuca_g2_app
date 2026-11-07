// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { StudentGuardians } from './student-guardians';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const maria = {
  id: 'g1',
  fullName: 'María Demo',
  relationship: 'madre',
  phone: '388 000 0000',
  email: 'maria@demo.rededuca',
};
const jose = { id: 'g2', fullName: 'José Ejemplo' };
const ana = { id: 'g3', fullName: 'Ana Prueba' };

const joseVinculado = { ...jose, relationship: 'padre', phone: '388 111 1111', email: 'jose@demo.rededuca' };

function responder(vinculados: unknown[] = [maria], todos: unknown[] = [maria, jose, ana]) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (opciones?.method === 'POST') return joseVinculado as never;
    if (opciones?.method === 'PATCH') return { ...maria, relationship: 'otro', phone: '388 222 2222' } as never;
    if (opciones?.method === 'DELETE') return { deleted: true } as never;
    if (path === '/students/s1/guardians') return vinculados as never;
    if (path === '/guardians') return todos as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(vinculados?: unknown[], todos?: unknown[]) {
  responder(vinculados, todos);
  render(<StudentGuardians institutionId="esc-1" studentId="s1" />);
  await screen.findByRole('heading', { name: /^Tutores \(\d+\)$/ });
}

const tarjeta = (nombre: string) => within(screen.getByRole('listitem', { name: nombre }));
const selector = () => screen.getByRole('combobox', { name: 'Tutor para vincular' });
const agregar = () => userEvent.click(screen.getAllByRole('button', { name: 'Agregar tutor' })[0]);
const llamada = (metodo: string) => mockApi.mock.calls.find(([, opciones]) => opciones?.method === metodo)!;
const cuerpo = (metodo: string) => JSON.parse(llamada(metodo)[1]!.body as string);

describe('StudentGuardians', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga lo dice', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<StudentGuardians institutionId="esc-1" studentId="s1" />);

    expect(screen.getByRole('heading', { name: 'Cargando tutores...' })).toBeTruthy();
  });

  it('muestra cada tutor con su parentesco y contacto', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/students/s1/guardians', { institutionId: 'esc-1' });
    expect(mockApi).toHaveBeenCalledWith('/guardians', { institutionId: 'esc-1' });
    expect(screen.getByRole('heading', { name: 'Tutores (1)' })).toBeTruthy();
    expect(tarjeta('María Demo').getByText('Madre')).toBeTruthy();
    expect(tarjeta('María Demo').getByText('388 000 0000')).toBeTruthy();
    expect(tarjeta('María Demo').getByText('maria@demo.rededuca')).toBeTruthy();
  });

  it('un dato sin cargar se indica', async () => {
    await abrir([{ ...jose, relationship: null, phone: null, email: null }]);

    expect(tarjeta('José Ejemplo').getByText('Sin teléfono')).toBeTruthy();
    expect(tarjeta('José Ejemplo').getByText('Sin correo')).toBeTruthy();
  });

  it('sin tutores invita a agregar uno', async () => {
    await abrir([]);

    expect(screen.getByRole('heading', { name: 'No hay tutores registrados' })).toBeTruthy();
    expect(screen.getByText('Aún no se han agregado tutores para este alumno.')).toBeTruthy();

    await userEvent.click(screen.getAllByRole('button', { name: 'Agregar tutor' })[1]);

    expect(selector()).toBeTruthy();
  });

  it('para agregar ofrece solo a quienes no están vinculados', async () => {
    await abrir();
    await agregar();

    expect(within(selector()).queryByRole('option', { name: 'María Demo' })).toBeNull();
    expect(within(selector()).getByRole('option', { name: 'José Ejemplo' })).toBeTruthy();
  });

  it('vincula un tutor con parentesco y teléfono, y lo suma en orden', async () => {
    await abrir();
    await agregar();

    await userEvent.selectOptions(selector(), 'g2');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Parentesco' }), 'padre');
    await userEvent.type(screen.getByRole('textbox', { name: 'Teléfono' }), '388 111 1111');
    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(await tarjeta('José Ejemplo').findByText('Padre')).toBeTruthy();
    expect(llamada('POST')[0]).toBe('/students/s1/guardians');
    expect(cuerpo('POST')).toEqual({ guardianMembershipId: 'g2', relationship: 'padre', phone: '388 111 1111' });
    expect(screen.getAllByRole('listitem')[0].textContent).toContain('José Ejemplo');
    expect(screen.queryByRole('combobox', { name: 'Tutor para vincular' })).toBeNull();
  });

  it('sin parentesco ni teléfono no los manda', async () => {
    await abrir();
    await agregar();

    await userEvent.selectOptions(selector(), 'g2');
    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    await tarjeta('José Ejemplo').findByText('Padre');
    expect(cuerpo('POST')).toEqual({ guardianMembershipId: 'g2' });
  });

  it('Vincular espera a que se elija un tutor', async () => {
    await abrir();
    await agregar();

    expect((screen.getByRole('button', { name: 'Vincular' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('si no quedan tutores para sumar lo dice', async () => {
    await abrir([maria], [maria]);
    await agregar();

    expect(screen.getByText(/No hay más tutores para vincular/)).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Tutor para vincular' })).toBeNull();
  });

  it('si vincular falla muestra el mensaje de la API y no cambia la lista', async () => {
    await abrir();
    await agregar();
    await userEvent.selectOptions(selector(), 'g2');
    mockApi.mockRejectedValueOnce(new ApiError(409, 'El tutor ya está vinculado a este alumno'));

    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    expect((await screen.findByRole('alert')).textContent).toContain('El tutor ya está vinculado a este alumno');
    expect(screen.queryByRole('listitem', { name: 'José Ejemplo' })).toBeNull();
  });

  it('edita el parentesco y el teléfono', async () => {
    await abrir();
    await userEvent.click(tarjeta('María Demo').getByRole('button', { name: 'Editar a María Demo' }));

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Parentesco' }), 'otro');
    const telefono = screen.getByRole('textbox', { name: 'Teléfono' });
    await userEvent.clear(telefono);
    await userEvent.type(telefono, '388 222 2222');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await tarjeta('María Demo').findByText('388 222 2222')).toBeTruthy();
    expect(llamada('PATCH')[0]).toBe('/students/s1/guardians/g1');
    expect(cuerpo('PATCH')).toEqual({ relationship: 'otro', phone: '388 222 2222' });
    expect(tarjeta('María Demo').getByText('Otro')).toBeTruthy();
  });

  it('Cancelar la edición no cambia nada', async () => {
    await abrir();
    await userEvent.click(tarjeta('María Demo').getByRole('button', { name: 'Editar a María Demo' }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(llamada('PATCH')).toBeUndefined();
    expect(tarjeta('María Demo').getByText('Madre')).toBeTruthy();
  });

  it('quitar pide confirmación y recién al segundo toque desvincula', async () => {
    await abrir();
    await userEvent.click(tarjeta('María Demo').getByRole('button', { name: 'Acciones de María Demo' }));

    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }));

    expect(llamada('DELETE')).toBeUndefined();
    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect(await screen.findByRole('heading', { name: 'No hay tutores registrados' })).toBeTruthy();
    expect(llamada('DELETE')[0]).toBe('/students/s1/guardians/g1');
  });

  it('si quitar falla mantiene al tutor en la lista', async () => {
    await abrir();
    await userEvent.click(tarjeta('María Demo').getByRole('button', { name: 'Acciones de María Demo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    mockApi.mockRejectedValueOnce(new Error('caída'));

    await userEvent.click(screen.getByRole('button', { name: '¿Seguro? Tocá de nuevo' }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    expect(screen.getByRole('listitem', { name: 'María Demo' })).toBeTruthy();
  });

  it('si no se pudieron cargar lo dice y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<StudentGuardians institutionId="esc-1" studentId="s1" />);

    await screen.findByRole('heading', { name: 'Error al cargar los tutores' });
    responder();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Tutores (1)' })).toBeTruthy();
  });
});
