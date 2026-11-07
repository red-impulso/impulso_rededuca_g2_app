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

const maria = { id: 'g1', fullName: 'María Demo' };
const jose = { id: 'g2', fullName: 'José Ejemplo' };
const ana = { id: 'g3', fullName: 'Ana Prueba' };

function responder(vinculados: unknown[] = [maria], todos: unknown[] = [maria, jose, ana]) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (opciones?.method === 'POST') return jose as never;
    if (opciones?.method === 'DELETE') return { deleted: true } as never;
    if (path === '/students/s1/guardians') return vinculados as never;
    if (path === '/guardians') return todos as never;
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(vinculados?: unknown[], todos?: unknown[]) {
  responder(vinculados, todos);
  render(<StudentGuardians institutionId="esc-1" studentId="s1" />);
  await screen.findByRole('heading', { name: 'Tutores' });
}

const vinculados = () => within(screen.getByRole('list', { name: 'Tutores vinculados' }));
const selector = () => screen.getByRole('combobox', { name: 'Tutor para vincular' });

describe('StudentGuardians', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga lo dice', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<StudentGuardians institutionId="esc-1" studentId="s1" />);

    expect(screen.getByText('Cargando tutores...')).toBeTruthy();
  });

  it('muestra los tutores vinculados', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/students/s1/guardians', { institutionId: 'esc-1' });
    expect(mockApi).toHaveBeenCalledWith('/guardians', { institutionId: 'esc-1' });
    expect(vinculados().getByText('María Demo')).toBeTruthy();
  });

  it('sin tutores vinculados lo dice', async () => {
    await abrir([]);

    expect(screen.getByText('No hay tutores vinculados.')).toBeTruthy();
  });

  it('para vincular ofrece solo a quienes no están vinculados', async () => {
    await abrir();

    expect(within(selector()).queryByRole('option', { name: 'María Demo' })).toBeNull();
    expect(within(selector()).getByRole('option', { name: 'José Ejemplo' })).toBeTruthy();
  });

  it('vincula un tutor, lo suma a la lista en orden y lo saca de las opciones', async () => {
    await abrir();

    await userEvent.selectOptions(selector(), 'g2');
    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    expect(await vinculados().findByText('José Ejemplo')).toBeTruthy();
    const post = mockApi.mock.calls.find(([, opciones]) => opciones?.method === 'POST')!;
    expect(post[0]).toBe('/students/s1/guardians');
    expect(JSON.parse(post[1]!.body as string)).toEqual({ guardianMembershipId: 'g2' });
    expect(vinculados().getAllByRole('listitem')[0].textContent).toContain('José Ejemplo');
    expect(within(selector()).queryByRole('option', { name: 'José Ejemplo' })).toBeNull();
  });

  it('Vincular espera a que se elija un tutor', async () => {
    await abrir();

    expect((screen.getByRole('button', { name: 'Vincular' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('quitar pide confirmación y recién al segundo toque desvincula', async () => {
    await abrir();
    const quitar = () => screen.getByRole('button', { name: /María Demo/ });

    await userEvent.click(quitar());

    expect(mockApi.mock.calls.some(([, opciones]) => opciones?.method === 'DELETE')).toBe(false);
    expect(quitar().textContent).toContain('¿Seguro? Tocá de nuevo');

    await userEvent.click(quitar());

    expect(await screen.findByText('No hay tutores vinculados.')).toBeTruthy();
    const borrado = mockApi.mock.calls.find(([, opciones]) => opciones?.method === 'DELETE')!;
    expect(borrado[0]).toBe('/students/s1/guardians/g1');
    expect(within(selector()).getByRole('option', { name: 'María Demo' })).toBeTruthy();
  });

  it('si vincular falla muestra el mensaje de la API y no cambia la lista', async () => {
    await abrir();
    await userEvent.selectOptions(selector(), 'g2');
    mockApi.mockRejectedValueOnce(new ApiError(409, 'El tutor ya está vinculado a este alumno'));

    await userEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    expect((await screen.findByRole('alert')).textContent).toContain('El tutor ya está vinculado a este alumno');
    expect(vinculados().queryByText('José Ejemplo')).toBeNull();
  });

  it('si quitar falla mantiene al tutor en la lista', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: /María Demo/ }));
    mockApi.mockRejectedValueOnce(new Error('caída'));

    await userEvent.click(screen.getByRole('button', { name: /María Demo/ }));

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo conectar');
    expect(vinculados().getByText('María Demo')).toBeTruthy();
  });

  it('si no quedan tutores para sumar lo dice', async () => {
    await abrir([maria], [maria]);

    expect(screen.getByText('No hay más tutores para vincular.')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Tutor para vincular' })).toBeNull();
  });

  it('si no se pudieron cargar lo dice y Reintentar vuelve a pedir', async () => {
    mockApi.mockRejectedValue(new Error('caída'));
    render(<StudentGuardians institutionId="esc-1" studentId="s1" />);

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron cargar los tutores');
    responder();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Tutores' })).toBeTruthy();
  });
});
