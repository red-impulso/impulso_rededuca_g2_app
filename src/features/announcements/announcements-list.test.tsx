// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AnnouncementsList, type Announcement } from './announcements-list';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const comunicado = (over: Partial<Announcement>): Announcement => ({
  id: 'c1',
  authorId: 'prof-1',
  scope: 'institution',
  courseLabel: null,
  title: 'Reunión de padres',
  body: 'El viernes a las 18.',
  createdAt: '2026-11-06T15:00:00.000Z',
  authorName: 'Laura Gómez',
  ...over,
});

describe('AnnouncementsList', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('muestra título, autor, fecha, alcance y texto', () => {
    render(<AnnouncementsList announcements={[comunicado({})]} />);

    const item = within(screen.getByRole('article'));
    expect(item.getByRole('heading', { name: 'Reunión de padres' })).toBeTruthy();
    expect(item.getByText('El viernes a las 18.')).toBeTruthy();
    expect(item.getByText(/Laura Gómez/)).toBeTruthy();
    expect(item.getByText(/06\/11\/2026/)).toBeTruthy();
    expect(item.getByText('Toda la institución')).toBeTruthy();
  });

  it('el alcance dice el curso o que es personal', () => {
    render(
      <AnnouncementsList
        announcements={[
          comunicado({ id: 'c1', scope: 'course', courseLabel: '1°A' }),
          comunicado({ id: 'c2', scope: 'student' }),
        ]}
      />
    );

    expect(screen.getByText('Curso 1°A')).toBeTruthy();
    expect(screen.getByText('Personal')).toBeTruthy();
  });

  it('si no hay autor no rompe', () => {
    render(<AnnouncementsList announcements={[comunicado({ authorName: null })]} />);

    expect(screen.getByText(/Institución/)).toBeTruthy();
  });

  it('avisa si no hay comunicados', () => {
    render(<AnnouncementsList announcements={[]} />);

    expect(screen.getByText('Todavía no hay comunicados.')).toBeTruthy();
  });

  it('sin rol no muestra botones de gestión', () => {
    render(<AnnouncementsList announcements={[comunicado({})]} />);

    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull();
  });

  it('un tutor tampoco ve botones de gestión', () => {
    render(
      <AnnouncementsList
        announcements={[comunicado({})]}
        institutionId="esc-1"
        role="guardian"
        profileId="tut-9"
      />
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull();
  });

  it('un docente solo gestiona sus propios comunicados', () => {
    render(
      <AnnouncementsList
        announcements={[comunicado({}), comunicado({ id: 'c2', authorId: 'prof-2' })]}
        institutionId="esc-1"
        role="teacher"
        profileId="prof-1"
      />
    );

    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
  });

  it('edita con PATCH y avisa a la página', async () => {
    const onActualizado = vi.fn();
    render(
      <AnnouncementsList
        announcements={[comunicado({})]}
        institutionId="esc-1"
        role="admin"
        profileId="adm-1"
        onActualizado={onActualizado}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.type(screen.getByLabelText('Título'), 'Reunión reprogramada');

    const actualizado = comunicado({ title: 'Reunión reprogramada' });
    mockApi.mockResolvedValueOnce(actualizado);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockApi).toHaveBeenLastCalledWith('/announcements/c1', {
      method: 'PATCH',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Reunión reprogramada', body: 'El viernes a las 18.' }),
    });
    expect(onActualizado).toHaveBeenCalledWith(actualizado);
    expect(screen.getByRole('article')).toBeTruthy();
  });

  it('elimina con DELETE si se confirma y avisa a la página', async () => {
    const onEliminado = vi.fn();
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <AnnouncementsList
        announcements={[comunicado({})]}
        institutionId="esc-1"
        role="director"
        profileId="dir-1"
        onEliminado={onEliminado}
      />
    );

    mockApi.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(mockApi).toHaveBeenLastCalledWith('/announcements/c1', {
      method: 'DELETE',
      institutionId: 'esc-1',
    });
    expect(onEliminado).toHaveBeenCalledWith('c1');
    confirmar.mockRestore();
  });

  it('si no se confirma, no borra nada', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <AnnouncementsList
        announcements={[comunicado({})]}
        institutionId="esc-1"
        role="admin"
        profileId="adm-1"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(mockApi).not.toHaveBeenCalled();
    confirmar.mockRestore();
  });

  it('si la API falla muestra su mensaje', async () => {
    render(
      <AnnouncementsList
        announcements={[comunicado({})]}
        institutionId="esc-1"
        role="admin"
        profileId="adm-1"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    mockApi.mockRejectedValueOnce(new ApiError(403, 'No podés editar este comunicado'));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('No podés editar este comunicado');
  });
});
