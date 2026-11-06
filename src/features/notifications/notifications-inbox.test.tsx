// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { NotificationsInbox } from './notifications-inbox';
import { CAMBIO_DE_NOTIFICACIONES } from './notifications-events';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const mockApi = vi.mocked(apiFetch);

const aviso = (over: Record<string, unknown>) => ({
  id: 'n1',
  type: 'grade',
  title: 'Nueva nota en Matemática',
  body: null,
  readAt: null,
  createdAt: '2026-11-06T15:00:00.000Z',
  ...over,
});

const avisos = [
  aviso({ id: 'n1', type: 'grade', title: 'Nueva nota en Matemática' }),
  aviso({ id: 'n2', type: 'attendance', title: 'Ana estuvo ausente el 06/11/2026' }),
  aviso({ id: 'n3', type: 'announcement', title: 'Nuevo comunicado: Salida', readAt: '2026-11-06T16:00:00.000Z' }),
];

async function abrir(lista: unknown[] = avisos) {
  mockApi.mockResolvedValueOnce(lista);
  render(<NotificationsInbox institutionId="esc-1" />);
  await screen.findByText(lista.length > 0 ? 'Nueva nota en Matemática' : 'No tenés notificaciones.');
}

const marcarTodas = () => screen.getByRole('button', { name: 'Marcar todas como leídas' });

describe('NotificationsInbox', () => {
  beforeEach(() => {
    mockApi.mockReset();
    push.mockReset();
  });
  afterEach(cleanup);

  it('lista los avisos y distingue los no leídos', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/notifications', { institutionId: 'esc-1' });
    expect(screen.getByRole('button', { name: /Nueva nota en Matemática/ }).textContent).toContain('Sin leer');
    expect(screen.getByRole('button', { name: /Nuevo comunicado: Salida/ }).textContent).not.toContain('Sin leer');
    expect(screen.getByRole('button', { name: /Nuevo comunicado: Salida/ }).textContent).toContain('06/11/2026');
  });

  it.each([
    ['Nueva nota en Matemática', 'n1', '/hijos'],
    ['Ana estuvo ausente el 06/11/2026', 'n2', '/hijos'],
  ])('tocar "%s" lo marca como leído y lleva a su pantalla', async (titulo, id, destino) => {
    await abrir();
    const avisoCambio = vi.fn();
    window.addEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);

    mockApi.mockResolvedValueOnce({});
    await userEvent.click(screen.getByRole('button', { name: new RegExp(titulo) }));

    expect(mockApi).toHaveBeenLastCalledWith(`/notifications/${id}/read`, {
      method: 'POST',
      institutionId: 'esc-1',
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith(destino));
    expect(avisoCambio).toHaveBeenCalled();
    window.removeEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);
  });

  it('un aviso ya leído lleva a su pantalla sin volver a marcarlo', async () => {
    await abrir();
    mockApi.mockClear();

    await userEvent.click(screen.getByRole('button', { name: /Nuevo comunicado: Salida/ }));

    expect(mockApi).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/comunicados');
  });

  it('si falla marcarlo igual lleva a la pantalla', async () => {
    await abrir();

    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    await userEvent.click(screen.getByRole('button', { name: /Nueva nota en Matemática/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/hijos'));
  });

  it('Marcar todas las deja leídas, avisa a la campanita y se apaga', async () => {
    await abrir();
    const avisoCambio = vi.fn();
    window.addEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);

    mockApi.mockResolvedValueOnce({ read: 2 });
    await userEvent.click(marcarTodas());

    expect(mockApi).toHaveBeenLastCalledWith('/notifications/read-all', {
      method: 'POST',
      institutionId: 'esc-1',
    });
    await waitFor(() => expect(marcarTodas()).toHaveProperty('disabled', true));
    expect(screen.queryByText('Sin leer')).toBeNull();
    expect(avisoCambio).toHaveBeenCalled();
    window.removeEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);
  });

  it('si falla Marcar todas muestra el mensaje y no cambia nada', async () => {
    await abrir();

    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema en el servidor.'));
    await userEvent.click(marcarTodas());

    expect((await screen.findByRole('alert')).textContent).toBe('Hubo un problema en el servidor.');
    expect(screen.getAllByText('Sin leer')).toHaveLength(2);
  });

  it('avisa si no hay notificaciones', async () => {
    await abrir([]);

    expect(await screen.findByText('No tenés notificaciones.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Marcar todas como leídas' })).toBeNull();
  });

  it('muestra el error si no se pueden cargar', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema en el servidor.'));
    render(<NotificationsInbox institutionId="esc-1" />);

    expect((await screen.findByRole('alert')).textContent).toBe('Hubo un problema en el servidor.');
  });
});
