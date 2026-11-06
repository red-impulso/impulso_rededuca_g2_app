// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { Dashboard, mostrarHoy } from './dashboard';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const curso = { id: 'c1', year: 1, division: 'A', shift: 'morning' };

const tablero = {
  students: 248,
  courses: 12,
  teachers: 8,
  attendanceAverage: 92.5,
  lowAttendance: [
    { student: { id: 'a1', firstName: 'Ana', lastName: 'Pérez' }, course: curso, percentage: 60.5 },
  ],
  gradeAverages: [
    { subject: { id: 's1', name: 'Matemática' }, course: curso, average: 7.5 },
    { subject: { id: 's2', name: 'Lengua' }, course: curso, average: null },
  ],
};

const comunicados = [1, 2, 3, 4, 5].map((n) => ({
  id: `c${n}`,
  title: `Comunicado ${n}`,
  body: `Texto ${n}`,
  createdAt: '2026-11-05T15:00:00.000Z',
}));

function apiResponde(respuestas: Record<string, unknown>) {
  const responder = async (ruta: string) => {
    const respuesta = respuestas[ruta];
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  };
  mockApi.mockImplementation(responder as unknown as typeof apiFetch);
}

const abrir = async (respuestas: Record<string, unknown> = {}) => {
  apiResponde({ '/dashboard': tablero, '/announcements': comunicados, ...respuestas });
  render(<Dashboard institutionId="esc-1" />);
  await screen.findByRole('group', { name: 'Total de estudiantes' });
};

const dato = (nombre: string) => screen.getByRole('group', { name: nombre }).textContent;
const seccion = (nombre: string) => within(screen.getByRole('region', { name: nombre }));

describe('Dashboard', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('mientras carga muestra el estado de carga', () => {
    mockApi.mockReturnValue(new Promise(() => {}));
    render(<Dashboard institutionId="esc-1" />);

    expect(screen.getByRole('heading', { name: 'Cargando datos del tablero...' })).toBeTruthy();
  });

  it('muestra los 4 números', async () => {
    await abrir();

    expect(mockApi).toHaveBeenCalledWith('/dashboard', { institutionId: 'esc-1' });
    expect(dato('Total de estudiantes')).toContain('248');
    expect(dato('Cursos activos')).toContain('12');
    expect(dato('Docentes')).toContain('8');
    expect(dato('Asistencia promedio')).toContain('92,5 %');
  });

  it('sin asistencia cargada muestra una raya, no un cero', async () => {
    await abrir({ '/dashboard': { ...tablero, attendanceAverage: null } });

    expect(dato('Asistencia promedio')).toContain('—');
  });

  it('lista a los alumnos con baja asistencia', async () => {
    await abrir();

    const lista = seccion('Alumnos con baja asistencia');
    expect(lista.getByText('Ana Pérez')).toBeTruthy();
    expect(lista.getByText('1°A')).toBeTruthy();
    expect(lista.getByText('60,5 %')).toBeTruthy();
  });

  it('sin alumnos con baja asistencia lo dice', async () => {
    await abrir({ '/dashboard': { ...tablero, lowAttendance: [] } });

    expect(seccion('Alumnos con baja asistencia').getByText('Nadie por debajo del 85 %.')).toBeTruthy();
  });

  it('muestra los promedios por materia, y Sin notas si no hay', async () => {
    await abrir();

    const promedios = seccion('Promedios por materia');
    expect(promedios.getByText('Matemática · 1°A')).toBeTruthy();
    expect(promedios.getByText('7,5')).toBeTruthy();
    expect(promedios.getByText('Lengua · 1°A')).toBeTruthy();
    expect(promedios.getByText('Sin notas')).toBeTruthy();
  });

  it('muestra hasta 4 novedades y enlaza a comunicados', async () => {
    await abrir();

    const novedades = seccion('Últimas novedades');
    expect(novedades.getByText('Comunicado 4')).toBeTruthy();
    expect(novedades.queryByText('Comunicado 5')).toBeNull();
    expect(novedades.getAllByText('05/11')).toHaveLength(4);
    expect(novedades.getByRole('link', { name: 'Ver todas' }).getAttribute('href')).toBe('/comunicados');
  });

  it('si fallan las novedades el tablero se ve igual', async () => {
    await abrir({ '/announcements': new ApiError(500, 'Hubo un problema') });

    expect(dato('Total de estudiantes')).toContain('248');
    expect(seccion('Últimas novedades').getByText('No se pudieron cargar las novedades.')).toBeTruthy();
  });

  it('sin datos en la institución muestra el estado vacío', async () => {
    apiResponde({
      '/dashboard': { ...tablero, students: 0, courses: 0, teachers: 0, lowAttendance: [], gradeAverages: [] },
      '/announcements': [],
    });
    render(<Dashboard institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'No hay datos disponibles' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('si falla muestra el error; Reintentar confirma y Ver tablero lo abre', async () => {
    apiResponde({ '/dashboard': new ApiError(500, 'Hubo un problema'), '/announcements': comunicados });
    render(<Dashboard institutionId="esc-1" />);

    const alerta = within(await screen.findByRole('alert'));
    expect(alerta.getByRole('heading', { name: 'Error al cargar la información' })).toBeTruthy();

    apiResponde({ '/dashboard': tablero, '/announcements': comunicados });
    await userEvent.click(alerta.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: '¡Datos actualizados!' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Ver tablero' }));

    expect(dato('Total de estudiantes')).toContain('248');
  });
});

describe('mostrarHoy', () => {
  it('dice la fecha en castellano y en hora de Argentina', () => {
    // 01:00 del 7/11 en hora universal son las 22:00 del 6/11 en Argentina.
    expect(mostrarHoy(new Date('2026-11-07T01:00:00.000Z'))).toBe('Hoy, 6 de noviembre de 2026');
  });
});
