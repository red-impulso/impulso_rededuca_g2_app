// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnnouncementsList, type Announcement } from './announcements-list';

const comunicado = (over: Partial<Announcement>): Announcement => ({
  id: 'c1',
  scope: 'institution',
  courseLabel: null,
  title: 'Reunión de padres',
  body: 'El viernes a las 18.',
  createdAt: '2026-11-06T15:00:00.000Z',
  authorName: 'Laura Gómez',
  ...over,
});

describe('AnnouncementsList', () => {
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
});
