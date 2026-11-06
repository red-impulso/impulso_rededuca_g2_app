// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { NotificationsInbox, mostrarCuando } from './notifications-inbox';
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

async function abrir(lista: { title: unknown }[] = avisos) {
  mockApi.mockResolvedValueOnce(lista);
  render(<NotificationsInbox institutionId="esc-1" />);
  await screen.findByText(String(lista[0].title));
}

const marcarTodas = () => screen.getByRole('button', { name: 'Marcar todas como leídas' });
const fila = (titulo: RegExp) => screen.getByRole('button', { name: titulo });
const filtro = (nombre: string) => screen.getByRole('button', { name: nombre });

describe('NotificationsInbox', () => {
  beforeEach(() => {
    mockApi.mockReset();
    push.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValueOnce(new Promise(() => {}));
    render(<NotificationsInbox institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando notificaciones...' })).toBeTruthy();
    expect(screen.getByText('Un momento, por favor.')).toBeTruthy();
  });

  it('lista los avisos con su texto por tipo y distingue los no leídos', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/notifications', { institutionId: 'esc-1' });
    expect(fila(/Nueva nota en Matemática/).textContent).toContain('Tu hijo/a tiene una nueva nota.');
    expect(fila(/estuvo ausente/).textContent).toContain('Se registró la asistencia de tu hijo/a.');
    expect(fila(/Salida/).textContent).toContain('Comunicación de la institución.');
    expect(fila(/Nueva nota en Matemática/).textContent).toContain('Sin leer');
    expect(fila(/Salida/).textContent).not.toContain('Sin leer');
  });

  it('si el aviso trae texto propio usa ese', async () => {
    await abrir([aviso({ body: 'Revisá el boletín.' })]);

    expect(fila(/Nueva nota/).textContent).toContain('Revisá el boletín.');
    expect(fila(/Nueva nota/).textContent).not.toContain('Tu hijo/a tiene una nueva nota.');
  });

  it('los filtros muestran cada grupo y Todas vuelve a mostrar todo', async () => {
    await abrir();

    await userEvent.click(filtro('Institución'));
    expect(screen.queryByText('Nueva nota en Matemática')).toBeNull();
    expect(screen.getByText('Nuevo comunicado: Salida')).toBeTruthy();
    expect(filtro('Institución').getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(filtro('Familia'));
    expect(screen.getByText('Nueva nota en Matemática')).toBeTruthy();
    expect(screen.getByText('Ana estuvo ausente el 06/11/2026')).toBeTruthy();
    expect(screen.queryByText('Nuevo comunicado: Salida')).toBeNull();

    await userEvent.click(filtro('Avisos'));
    expect(screen.getByText('Nueva nota en Matemática')).toBeTruthy();
    expect(screen.queryByText('Nuevo comunicado: Salida')).toBeNull();

    await userEvent.click(filtro('Todas'));
    expect(screen.getByText('Nuevo comunicado: Salida')).toBeTruthy();
  });

  it('un filtro sin resultados lo dice', async () => {
    await abrir([aviso({ type: 'grade' })]);

    await userEvent.click(filtro('Institución'));

    expect(screen.getByText('No hay notificaciones en este filtro.')).toBeTruthy();
  });

  it('muestra 4 avisos y Ver todas muestra el resto', async () => {
    await abrir([1, 2, 3, 4, 5].map((n) => aviso({ id: `n${n}`, title: `Aviso ${n}` })));

    expect(screen.queryByText('Aviso 5')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Ver todas las notificaciones' }));

    expect(screen.getByText('Aviso 5')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver todas las notificaciones' })).toBeNull();
  });

  it('con 4 avisos o menos no aparece Ver todas', async () => {
    await abrir();

    expect(screen.queryByRole('button', { name: 'Ver todas las notificaciones' })).toBeNull();
  });

  it.each([
    ['Nueva nota en Matemática', 'n1', '/hijos'],
    ['Ana estuvo ausente el 06/11/2026', 'n2', '/hijos'],
  ])('tocar "%s" lo marca como leído y lleva a su pantalla', async (titulo, id, destino) => {
    await abrir();
    const avisoCambio = vi.fn();
    window.addEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);

    mockApi.mockResolvedValueOnce({});
    await userEvent.click(fila(new RegExp(titulo)));

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

    await userEvent.click(fila(/Salida/));

    expect(mockApi).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/comunicados');
  });

  it('si falla marcarlo igual lleva a la pantalla', async () => {
    await abrir();

    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    await userEvent.click(fila(/Nueva nota en Matemática/));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/hijos'));
  });

  it('Marcar todas muestra "Todo al día", avisa a la campanita y Volver va al inicio', async () => {
    await abrir();
    const avisoCambio = vi.fn();
    window.addEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);

    mockApi.mockResolvedValueOnce({ read: 2 });
    await userEvent.click(marcarTodas());

    expect(mockApi).toHaveBeenLastCalledWith('/notifications/read-all', {
      method: 'POST',
      institutionId: 'esc-1',
    });
    expect(await screen.findByRole('heading', { name: '¡Todo al día!' })).toBeTruthy();
    expect(screen.getByText('No hay notificaciones nuevas en este momento.')).toBeTruthy();
    expect(avisoCambio).toHaveBeenCalled();
    window.removeEventListener(CAMBIO_DE_NOTIFICACIONES, avisoCambio);

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(push).toHaveBeenCalledWith('/inicio');
  });

  it('sin avisos sin leer, Marcar todas queda apagado', async () => {
    await abrir([aviso({ readAt: '2026-11-06T16:00:00.000Z' })]);

    expect(marcarTodas()).toHaveProperty('disabled', true);
  });

  it('si falla Marcar todas muestra el mensaje y no cambia nada', async () => {
    await abrir();

    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema en el servidor.'));
    await userEvent.click(marcarTodas());

    expect((await screen.findByRole('alert')).textContent).toBe('Hubo un problema en el servidor.');
    expect(screen.getAllByText('Sin leer')).toHaveLength(2);
  });

  it('sin notificaciones lo dice, y Volver va al inicio', async () => {
    mockApi.mockResolvedValueOnce([]);
    render(<NotificationsInbox institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'No tenés notificaciones' })).toBeTruthy();
    expect(screen.getByText('Cuando recibas novedades, las vas a ver acá.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Marcar todas como leídas' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(push).toHaveBeenCalledWith('/inicio');
  });

  it('si no se pueden cargar muestra el error y Reintentar vuelve a pedirlas', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema en el servidor.'));
    render(<NotificationsInbox institutionId="esc-1" />);

    const alerta = within(await screen.findByRole('alert'));
    expect(alerta.getByRole('heading', { name: 'Error al cargar las notificaciones' })).toBeTruthy();
    expect(alerta.getByText('Ocurrió un problema al obtener los avisos. Intentá nuevamente.')).toBeTruthy();

    mockApi.mockResolvedValueOnce(avisos);
    await userEvent.click(alerta.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Nueva nota en Matemática')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('mostrarCuando', () => {
  const ahora = new Date('2026-11-06T18:00:00.000Z'); // 15:00 en Argentina

  it('hoy muestra la hora de Argentina', () => {
    expect(mostrarCuando('2026-11-06T13:24:00.000Z', ahora)).toBe('10:24');
  });

  it('ayer dice Ayer, aunque en hora universal sea el mismo día', () => {
    expect(mostrarCuando('2026-11-06T02:00:00.000Z', ahora)).toBe('Ayer');
  });

  it('antes de ayer muestra la fecha', () => {
    expect(mostrarCuando('2026-11-04T15:00:00.000Z', ahora)).toBe('04/11/2026');
  });
});
