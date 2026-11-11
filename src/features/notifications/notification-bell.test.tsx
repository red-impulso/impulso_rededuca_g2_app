// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { NotificationBell } from './notification-bell';
import { avisarCambioDeNotificaciones } from './notifications-events';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

let pathname = '/inicio';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const mockApi = vi.mocked(apiFetch);

describe('NotificationBell', () => {
  beforeEach(() => {
    mockApi.mockReset();
    pathname = '/inicio';
  });
  afterEach(cleanup);

  it('muestra la cantidad de no leídas y enlaza a la bandeja', async () => {
    mockApi.mockResolvedValue({ count: 3 });

    render(<NotificationBell institutionId="esc-1" />);

    const link = await screen.findByRole('link', { name: 'Notificaciones: 3 sin leer' });
    expect(link.getAttribute('href')).toBe('/notificaciones');
    expect(link.textContent).toContain('3');
    expect(mockApi).toHaveBeenCalledWith('/notifications/unread-count', { institutionId: 'esc-1' });
  });

  it('sin avisos el contador va en gris, y con avisos el número va en morado', async () => {
    mockApi.mockResolvedValue({ count: 0 });
    const { unmount } = render(<NotificationBell institutionId="esc-1" />);

    await waitFor(() => expect(mockApi).toHaveBeenCalled());
    const cero = await screen.findByText('0');
    expect(cero.className).toContain('bg-gray-300');
    unmount();

    mockApi.mockResolvedValue({ count: 3 });
    render(<NotificationBell institutionId="esc-1" />);

    expect((await screen.findByText('3')).className).toContain('bg-secundario');
  });

  it('más de 99 muestra 99+', async () => {
    mockApi.mockResolvedValue({ count: 120 });

    render(<NotificationBell institutionId="esc-1" />);

    expect(await screen.findByText('99+')).toBeTruthy();
  });

  it('se actualiza al navegar', async () => {
    mockApi.mockResolvedValue({ count: 1 });
    const { rerender } = render(<NotificationBell institutionId="esc-1" />);
    await screen.findByRole('link', { name: 'Notificaciones: 1 sin leer' });

    mockApi.mockResolvedValue({ count: 2 });
    pathname = '/hijos';
    rerender(<NotificationBell institutionId="esc-1" />);

    expect(await screen.findByRole('link', { name: 'Notificaciones: 2 sin leer' })).toBeTruthy();
  });

  it('se actualiza cuando la bandeja avisa de un cambio', async () => {
    mockApi.mockResolvedValue({ count: 2 });
    render(<NotificationBell institutionId="esc-1" />);
    await screen.findByRole('link', { name: 'Notificaciones: 2 sin leer' });

    mockApi.mockResolvedValue({ count: 0 });
    act(() => avisarCambioDeNotificaciones());

    expect(await screen.findByRole('link', { name: 'Notificaciones' })).toBeTruthy();
  });

  it('una respuesta vieja que llega tarde no pisa a la nueva', async () => {
    let responderViejo: (value: { count: number }) => void = () => {};
    mockApi.mockReturnValueOnce(new Promise((resolve) => (responderViejo = resolve)));
    render(<NotificationBell institutionId="esc-1" />);

    mockApi.mockResolvedValueOnce({ count: 0 });
    act(() => avisarCambioDeNotificaciones());
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(2));

    await act(async () => responderViejo({ count: 3 }));

    expect(screen.getByRole('link', { name: 'Notificaciones' })).toBeTruthy();
  });

  it('si falla una actualización conserva el último número', async () => {
    mockApi.mockResolvedValueOnce({ count: 2 });
    render(<NotificationBell institutionId="esc-1" />);
    await screen.findByRole('link', { name: 'Notificaciones: 2 sin leer' });

    mockApi.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'));
    act(() => avisarCambioDeNotificaciones());
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(2));

    expect(screen.getByRole('link', { name: 'Notificaciones: 2 sin leer' })).toBeTruthy();
  });

  it('si la API falla la campanita sigue ahí, sin número', async () => {
    mockApi.mockRejectedValue(new ApiError(500, 'Hubo un problema'));

    render(<NotificationBell institutionId="esc-1" />);

    await waitFor(() => expect(mockApi).toHaveBeenCalled());
    expect(screen.getByRole('link', { name: 'Notificaciones' })).toBeTruthy();
  });
});
