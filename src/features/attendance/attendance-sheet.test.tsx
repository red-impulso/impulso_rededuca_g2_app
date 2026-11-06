// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { AttendanceSheet, hoyLocal } from './attendance-sheet';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const lista = [
  { student: { id: 'a1', firstName: 'Ana', lastName: 'Pérez' }, status: null },
  { student: { id: 'a2', firstName: 'Beto', lastName: 'Ruiz' }, status: 'absent' },
  { student: { id: 'a3', firstName: 'Caro', lastName: 'Soto' }, status: null },
];

async function abrirLista(filas: unknown[] = lista) {
  mockApi.mockResolvedValueOnce(filas);
  render(<AttendanceSheet institutionId="esc-1" courseId="cur-1" date="2026-11-06" />);
  await screen.findByRole('group', { name: 'Pérez, Ana' });
}

const alumno = (nombre: string) => within(screen.getByRole('group', { name: nombre }));
const estado = (nombre: string, etiqueta: string) => alumno(nombre).getByRole('button', { name: etiqueta });
const marcado = (boton: HTMLElement) => boton.getAttribute('aria-pressed');
const botonGuardar = () => screen.getByRole('button', { name: 'Guardar' });

describe('AttendanceSheet', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('pide la lista del curso y la fecha, y muestra lo guardado', async () => {
    await abrirLista();

    expect(mockApi).toHaveBeenCalledWith('/attendance?courseId=cur-1&date=2026-11-06', {
      institutionId: 'esc-1',
    });
    expect(marcado(estado('Ruiz, Beto', 'Ausente'))).toBe('true');
    expect(marcado(estado('Pérez, Ana', 'Presente'))).toBe('false');
  });

  it('cada alumno tiene P, A, T y J, y tocar uno lo marca', async () => {
    await abrirLista();

    for (const [letra, etiqueta] of [
      ['P', 'Presente'],
      ['A', 'Ausente'],
      ['T', 'Tarde'],
      ['J', 'Justificado'],
    ]) {
      expect(estado('Pérez, Ana', etiqueta).textContent).toBe(letra);
    }

    await userEvent.click(estado('Pérez, Ana', 'Tarde'));

    expect(marcado(estado('Pérez, Ana', 'Tarde'))).toBe('true');
    expect(marcado(estado('Pérez, Ana', 'Presente'))).toBe('false');
  });

  it('Todos presentes marca a los que faltan y no pisa lo ya marcado', async () => {
    await abrirLista();

    await userEvent.click(screen.getByRole('button', { name: 'Todos presentes' }));

    expect(marcado(estado('Pérez, Ana', 'Presente'))).toBe('true');
    expect(marcado(estado('Soto, Caro', 'Presente'))).toBe('true');
    expect(marcado(estado('Ruiz, Beto', 'Ausente'))).toBe('true');
  });

  it('no deja guardar si faltan alumnos, y dice cuántos', async () => {
    await abrirLista();

    expect(botonGuardar()).toHaveProperty('disabled', true);
    expect(screen.getByText('Faltan marcar 2 alumnos.')).toBeTruthy();

    await userEvent.click(estado('Pérez, Ana', 'Presente'));
    expect(screen.getByText('Falta marcar 1 alumno.')).toBeTruthy();

    await userEvent.click(estado('Soto, Caro', 'Presente'));
    expect(botonGuardar()).toHaveProperty('disabled', false);
  });

  it('guarda solo lo que cambió y muestra los estados', async () => {
    await abrirLista();
    await userEvent.click(screen.getByRole('button', { name: 'Todos presentes' }));

    let terminar: (value: { saved: number }) => void = () => {};
    mockApi.mockReturnValueOnce(new Promise((resolve) => (terminar = resolve)));
    await userEvent.click(botonGuardar());

    expect(screen.getByRole('button', { name: 'Guardando...' })).toHaveProperty('disabled', true);
    expect(mockApi).toHaveBeenLastCalledWith('/attendance', {
      method: 'PUT',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: 'cur-1',
        date: '2026-11-06',
        entries: [
          { studentId: 'a1', status: 'present' },
          { studentId: 'a3', status: 'present' },
        ],
      }),
    });

    terminar({ saved: 2 });

    expect((await screen.findByRole('status')).textContent).toBe('Guardado');
    expect(botonGuardar()).toHaveProperty('disabled', true);
  });

  it('si la API falla muestra su mensaje y deja reintentar', async () => {
    await abrirLista();
    await userEvent.click(screen.getByRole('button', { name: 'Todos presentes' }));

    mockApi.mockRejectedValueOnce(new ApiError(403, 'No das clases en este curso'));
    await userEvent.click(botonGuardar());

    expect((await screen.findByRole('alert')).textContent).toBe('No das clases en este curso');
    expect(botonGuardar()).toHaveProperty('disabled', false);
  });

  it('si no se puede cargar la lista muestra el error', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(400, 'La fecha no es válida o es futura'));
    render(<AttendanceSheet institutionId="esc-1" courseId="cur-1" date="2999-01-01" />);

    expect((await screen.findByRole('alert')).textContent).toBe('La fecha no es válida o es futura');
  });

  it('avisa si el curso no tiene alumnos', async () => {
    mockApi.mockResolvedValueOnce([]);
    render(<AttendanceSheet institutionId="esc-1" courseId="cur-1" date="2026-11-06" />);

    expect(await screen.findByText('Este curso todavía no tiene alumnos.')).toBeTruthy();
  });
});

describe('hoyLocal', () => {
  afterEach(() => vi.useRealTimers());

  it('usa la fecha local: a las 22 h de Argentina sigue siendo hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6, 22, 30));

    expect(hoyLocal()).toBe('2026-11-06');
  });
});
