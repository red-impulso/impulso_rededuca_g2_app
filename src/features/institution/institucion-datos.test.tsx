// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { InstitucionDatos } from './institucion-datos';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const escuela = {
  id: 'esc-1',
  name: 'Instituto San Martín',
  address: 'Av. San Martín 123',
  levels: ['Terciario'],
  code: 'ITSM-001',
  phone: '388 123 4567',
  email: 'instituto@rededuca.edu.ar',
  shift: 'Vespertino',
  modality: 'Presencial',
};

const vacia = {
  id: 'esc-1',
  name: 'Escuela',
  address: null,
  levels: [],
  code: null,
  phone: null,
  email: null,
  shift: null,
  modality: null,
};

async function abrir(datos: unknown = escuela) {
  mockApi.mockResolvedValueOnce(datos);
  render(<InstitucionDatos institutionId="esc-1" />);
  await screen.findByRole('heading', { level: 2 });
}

describe('InstitucionDatos', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<InstitucionDatos institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando datos de la institución...' })).toBeTruthy();
  });

  it('muestra los datos generales y los adicionales', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/institution', { institutionId: 'esc-1' });
    expect(screen.getByRole('heading', { name: 'Instituto San Martín' })).toBeTruthy();
    for (const texto of ['Activo', 'ITSM-001', 'Av. San Martín 123', '388 123 4567', 'instituto@rededuca.edu.ar', 'Vespertino', 'Terciario', 'Presencial']) {
      expect(screen.getByText(texto)).toBeTruthy();
    }
  });

  it('un dato sin cargar lo dice', async () => {
    await abrir({ ...escuela, phone: null });

    expect(screen.getByText('Sin cargar')).toBeTruthy();
  });

  it('sin datos muestra el estado vacío, y Agregar datos abre el formulario', async () => {
    await abrir(vacia);

    expect(screen.getByRole('heading', { name: 'No hay datos de institución' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Agregar datos' }));

    expect(screen.getByLabelText('Código institucional')).toBeTruthy();
  });

  it('Editar guarda, muestra Datos actualizados y Ver detalle vuelve', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const telefono = screen.getByLabelText('Teléfono');
    await userEvent.clear(telefono);
    await userEvent.type(telefono, '388 000');
    const nivel = screen.getByLabelText('Nivel');
    await userEvent.clear(nivel);
    await userEvent.type(nivel, 'Primario, Secundario');

    mockApi.mockResolvedValueOnce({ ...escuela, phone: '388 000', levels: ['Primario', 'Secundario'] });
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('heading', { name: '¡Datos actualizados!' })).toBeTruthy();
    const [ruta, opciones] = mockApi.mock.lastCall ?? [];
    expect(ruta).toBe('/institution');
    expect(opciones?.method).toBe('PATCH');
    expect(JSON.parse(String(opciones?.body))).toEqual({
      name: 'Instituto San Martín',
      code: 'ITSM-001',
      address: 'Av. San Martín 123',
      phone: '388 000',
      email: 'instituto@rededuca.edu.ar',
      shift: 'Vespertino',
      levels: ['Primario', 'Secundario'],
      modality: 'Presencial',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(screen.getByText('388 000')).toBeTruthy();
    expect(screen.getByText('Primario, Secundario')).toBeTruthy();
  });

  it('Cancelar vuelve a los datos sin guardar', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('ITSM-001')).toBeTruthy();
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  it('si falla guardar muestra el mensaje y no pierde lo escrito', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    mockApi.mockRejectedValueOnce(new ApiError(400, 'El correo electrónico no es válido'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('El correo electrónico no es válido');
    expect(screen.getByLabelText<HTMLInputElement>('Teléfono').value).toBe('388 123 4567');
  });

  it('si falla la carga muestra el error y Reintentar vuelve a pedirla', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(500, 'Hubo un problema'));
    render(<InstitucionDatos institutionId="esc-1" />);

    const alerta = within(await screen.findByRole('alert'));
    expect(alerta.getByRole('heading', { name: 'Error al cargar los datos' })).toBeTruthy();

    mockApi.mockResolvedValueOnce(escuela);
    await userEvent.click(alerta.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Instituto San Martín' })).toBeTruthy();
  });
});
