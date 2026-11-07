// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { InteresadosAdmin } from './interesados-admin';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

// Datos inventados: nunca datos reales.
const postulacion = (id: string, institutionName: string, status: string, over: Record<string, unknown> = {}) => ({
  id,
  institutionName,
  institutionType: 'Institución educativa pública',
  city: 'Perico',
  studentCount: 320,
  contactName: 'Ana Prueba',
  phone: '388 400-0000',
  email: 'ana@prueba.edu.ar',
  comment: 'Nos interesa la propuesta',
  status,
  createdAt: '2026-11-07T15:00:00Z',
  ...over,
});

const nueva = postulacion('l1', 'Escuela Prueba Uno', 'new');
const otraNueva = postulacion('l2', 'Escuela Prueba Dos', 'new', { comment: null });
const contactada = postulacion('l3', 'Escuela Prueba Tres', 'contacted');
const descartada = postulacion('l4', 'Escuela Prueba Cuatro', 'discarded');

function responder(lista: unknown[] = [nueva, otraNueva, contactada, descartada]) {
  mockApi.mockImplementation(async (path, opciones) => {
    if (path === '/leads' && !opciones?.method) return lista as never;
    if (opciones?.method === 'PATCH') {
      const id = path.split('/').at(-1);
      const { status } = JSON.parse(opciones.body as string);
      return { ...(lista as { id: string }[]).find((item) => item.id === id), status } as never;
    }
    throw new Error(`ruta inesperada: ${path}`);
  });
}

async function abrir(lista?: unknown[]) {
  responder(lista);
  render(<InteresadosAdmin institutionId="esc-1" />);
  await screen.findByRole('tablist', { name: 'Filtrar por estado' });
}

const tarjeta = (nombre: string) => within(screen.getByRole('listitem', { name: nombre }));
const nombres = () => screen.queryAllByRole('listitem').map((item) => item.getAttribute('aria-label'));

describe('InteresadosAdmin', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga lo dice', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<InteresadosAdmin institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando postulaciones...' })).toBeTruthy();
  });

  it('pide GET /leads con la escuela activa', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/leads', { institutionId: 'esc-1' });
  });

  it('sin postulaciones dice que todavía no hay', async () => {
    responder([]);
    render(<InteresadosAdmin institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'Todavía no hay postulaciones' })).toBeTruthy();
  });

  it('si falla la carga, avisa y deja reintentar', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema en el servidor.'));
    responder();
    render(<InteresadosAdmin institutionId="esc-1" />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    await screen.findByRole('tablist', { name: 'Filtrar por estado' });
    expect(mockApi).toHaveBeenCalledTimes(2);
  });

  it('arranca en Nuevos y muestra cuántas hay en cada estado', async () => {
    await abrir();

    const pestanas = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(pestanas).toEqual(['Nuevos (2)', 'Contactados (1)', 'Descartados (1)', 'Todos (4)']);
    expect(screen.getByRole('tab', { name: 'Nuevos (2)' }).getAttribute('aria-selected')).toBe('true');
    expect(nombres()).toEqual(['Escuela Prueba Uno', 'Escuela Prueba Dos']);
  });

  it('cambia de filtro', async () => {
    await abrir();
    const user = userEvent.setup();

    await user.click(screen.getByRole('tab', { name: 'Contactados (1)' }));
    expect(nombres()).toEqual(['Escuela Prueba Tres']);

    await user.click(screen.getByRole('tab', { name: 'Todos (4)' }));
    expect(nombres()).toHaveLength(4);
    expect(tarjeta('Escuela Prueba Cuatro').getByText('Descartado')).toBeTruthy();
  });

  it('muestra institución, tipo, localidad, alumnos, contacto, mensaje y fecha', async () => {
    await abrir();

    const uno = tarjeta('Escuela Prueba Uno');
    expect(uno.getByText('Institución educativa pública')).toBeTruthy();
    expect(uno.getByText('Perico')).toBeTruthy();
    expect(uno.getByText('320 alumnos')).toBeTruthy();
    expect(uno.getByText('Ana Prueba')).toBeTruthy();
    expect(uno.getByText('Nos interesa la propuesta')).toBeTruthy();
    expect(uno.getByText('07/11/2026')).toBeTruthy();
    expect(tarjeta('Escuela Prueba Dos').queryByText('Nos interesa la propuesta')).toBeNull();
  });

  it('el teléfono abre WhatsApp y el correo abre el mail', async () => {
    await abrir();

    const uno = tarjeta('Escuela Prueba Uno');
    const whatsapp = uno.getByRole('link', { name: /388 400-0000/ });
    expect(whatsapp.getAttribute('href')).toBe('https://wa.me/5493884000000');
    expect(whatsapp.getAttribute('target')).toBe('_blank');
    expect(whatsapp.getAttribute('rel')).toContain('noopener');
    expect(uno.getByRole('link', { name: /ana@prueba.edu.ar/ }).getAttribute('href')).toBe(
      'mailto:ana@prueba.edu.ar'
    );
  });

  it('marcar como contactada manda PATCH /leads/:id y la saca de Nuevos', async () => {
    await abrir();
    const user = userEvent.setup();

    await user.click(tarjeta('Escuela Prueba Uno').getByRole('button', { name: 'Marcar como contactada' }));

    expect(mockApi).toHaveBeenCalledWith('/leads/l1', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    });
    expect(await screen.findByText('Escuela Prueba Uno quedó en Contactados')).toBeTruthy();
    expect(nombres()).toEqual(['Escuela Prueba Dos']);
    expect(screen.getByRole('tab', { name: 'Contactados (2)' })).toBeTruthy();
  });

  it('cada estado ofrece pasar a los otros dos', async () => {
    await abrir();
    const user = userEvent.setup();
    const botones = (nombre: string) =>
      tarjeta(nombre)
        .getAllByRole('button')
        .map((boton) => boton.textContent);

    expect(botones('Escuela Prueba Uno')).toEqual(['Marcar como contactada', 'Descartar']);
    await user.click(screen.getByRole('tab', { name: 'Contactados (1)' }));
    expect(botones('Escuela Prueba Tres')).toEqual(['Volver a Nuevos', 'Descartar']);
    await user.click(screen.getByRole('tab', { name: 'Descartados (1)' }));
    expect(botones('Escuela Prueba Cuatro')).toEqual(['Volver a Nuevos', 'Marcar como contactada']);
  });

  it('si el cambio falla, avisa y la deja donde estaba', async () => {
    await abrir();
    mockApi.mockRejectedValueOnce(new ApiError(404, 'No se encontró la postulación'));
    const user = userEvent.setup();

    await user.click(tarjeta('Escuela Prueba Uno').getByRole('button', { name: 'Descartar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No se encontró la postulación');
    expect(nombres()).toEqual(['Escuela Prueba Uno', 'Escuela Prueba Dos']);
  });

  it('un filtro sin postulaciones lo dice', async () => {
    await abrir([contactada]);

    expect(screen.getByText('No hay postulaciones nuevas.')).toBeTruthy();
  });
});
