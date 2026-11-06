// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AnnouncementForm } from './announcement-form';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const cursos = [
  { id: 'cur-1', year: 1, division: 'A', shift: 'morning' },
  { id: 'cur-2', year: 2, division: 'A', shift: 'morning' },
];

const onPublicado = vi.fn();

async function abrir(role: 'admin' | 'director' | 'teacher') {
  mockApi.mockResolvedValueOnce(cursos);
  render(<AnnouncementForm institutionId="esc-1" role={role} onPublicado={onPublicado} />);
  await userEvent.click(screen.getByRole('button', { name: 'Nuevo comunicado' }));
  await screen.findByLabelText('Alcance');
}

const publicar = () => screen.getByRole('button', { name: 'Publicar' });
const opciones = (etiqueta: string) =>
  [...screen.getByLabelText<HTMLSelectElement>(etiqueta).options].map((o) => o.text);

async function escribir() {
  await userEvent.type(screen.getByLabelText('Título'), 'Salida al museo');
  await userEvent.type(screen.getByLabelText('Texto'), 'Traer autorización.');
}

describe('AnnouncementForm', () => {
  beforeEach(() => {
    mockApi.mockReset();
    onPublicado.mockReset();
  });
  afterEach(cleanup);

  it('un docente solo puede publicar para un curso', async () => {
    await abrir('teacher');

    expect(opciones('Alcance')).toEqual(['Un curso']);
    expect(screen.getByLabelText('Curso')).toBeTruthy();
  });

  it.each(['admin', 'director'] as const)('%s también puede publicar para toda la institución', async (role) => {
    await abrir(role);

    expect(opciones('Alcance')).toEqual(['Toda la institución', 'Un curso']);
  });

  it('toda la institución no pide curso', async () => {
    await abrir('admin');

    expect(screen.queryByLabelText('Curso')).toBeNull();
    await escribir();
    expect(publicar()).toHaveProperty('disabled', false);
  });

  it('no deja publicar sin título, sin texto o sin curso', async () => {
    await abrir('teacher');
    expect(publicar()).toHaveProperty('disabled', true);

    await escribir();
    expect(publicar()).toHaveProperty('disabled', true);

    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'cur-1');
    expect(publicar()).toHaveProperty('disabled', false);

    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.type(screen.getByLabelText('Título'), '   ');
    expect(publicar()).toHaveProperty('disabled', true);
  });

  it('publica para un curso, avisa a la página y se cierra', async () => {
    await abrir('admin');
    await userEvent.selectOptions(screen.getByLabelText('Alcance'), 'course');
    await userEvent.selectOptions(screen.getByLabelText('Curso'), 'cur-2');
    await escribir();

    const nuevo = { id: 'n1' };
    mockApi.mockResolvedValueOnce(nuevo);
    await userEvent.click(publicar());

    expect(mockApi).toHaveBeenLastCalledWith('/announcements', {
      method: 'POST',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'course',
        courseId: 'cur-2',
        title: 'Salida al museo',
        body: 'Traer autorización.',
      }),
    });
    expect(onPublicado).toHaveBeenCalledWith(nuevo);
    expect(screen.queryByLabelText('Título')).toBeNull();
  });

  it('para toda la institución no manda curso', async () => {
    await abrir('admin');
    await escribir();

    mockApi.mockResolvedValueOnce({ id: 'n1' });
    await userEvent.click(publicar());

    const body = JSON.parse(String(mockApi.mock.lastCall?.[1]?.body));
    expect(body).toEqual({
      scope: 'institution',
      title: 'Salida al museo',
      body: 'Traer autorización.',
    });
  });

  it('si la API falla muestra su mensaje y no pierde lo escrito', async () => {
    await abrir('admin');
    await escribir();

    mockApi.mockRejectedValueOnce(new ApiError(403, 'No podés publicar este comunicado'));
    await userEvent.click(publicar());

    expect((await screen.findByRole('alert')).textContent).toBe('No podés publicar este comunicado');
    expect(screen.getByLabelText<HTMLInputElement>('Título').value).toBe('Salida al museo');
    expect(onPublicado).not.toHaveBeenCalled();
  });
});
