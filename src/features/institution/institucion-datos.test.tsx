// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { InstitucionDatos } from './institucion-datos';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

describe('InstitucionDatos', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('manda solo los campos con contenido', async () => {
    mockApi.mockResolvedValue({ id: 'esc-1', name: 'IES 6', address: null, levels: [] });
    render(<InstitucionDatos institutionId="esc-1" nombreActual="IES N° 6" />);

    await userEvent.type(screen.getByLabelText('Dirección'), 'San Martín 123');
    await userEvent.type(screen.getByLabelText(/Niveles/), 'Primario, Secundario');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(mockApi).toHaveBeenCalledWith('/institution', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'IES N° 6',
        address: 'San Martín 123',
        levels: ['Primario', 'Secundario'],
      }),
    });
  });

  it('si no hay cambios no llama a la API', async () => {
    render(<InstitucionDatos institutionId="esc-1" nombreActual="" />);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(mockApi).not.toHaveBeenCalled();
    expect(screen.getByText('Escribí algo para cambiar.')).toBeTruthy();
  });

  it('al guardar muestra los datos que devolvió la API', async () => {
    mockApi.mockResolvedValue({
      id: 'esc-1',
      name: 'IES 6',
      address: 'San Martín 123',
      levels: ['Secundario'],
    });
    render(<InstitucionDatos institutionId="esc-1" nombreActual="IES 6" />);

    await userEvent.type(screen.getByLabelText('Dirección'), 'San Martín 123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Guardado.')).toBeTruthy();
    expect(screen.getByText('San Martín 123')).toBeTruthy();
    expect(screen.getByText('Secundario')).toBeTruthy();
  });

  it('muestra el error que devuelve la API', async () => {
    mockApi.mockRejectedValue(new ApiError(400, 'El nombre de la institución no puede estar vacío'));
    render(<InstitucionDatos institutionId="esc-1" nombreActual="IES 6" />);

    await userEvent.type(screen.getByLabelText('Dirección'), 'algo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'El nombre de la institución no puede estar vacío'
    );
  });
});
