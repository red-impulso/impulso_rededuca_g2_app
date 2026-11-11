// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { GradesSheet } from './grades-sheet';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const planilla = [
  { student: { id: 'a1', firstName: 'Ana', lastName: 'Pérez' }, value: null },
  { student: { id: 'a2', firstName: 'Beto', lastName: 'Ruiz' }, value: 7.5 },
];

async function abrirPlanilla() {
  mockApi.mockResolvedValueOnce(planilla);
  render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" />);
  return screen.findByLabelText('Nota de Pérez, Ana');
}

const botonGuardar = () => screen.getByRole('button', { name: 'Guardar' });

describe('GradesSheet', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('pide la planilla de la materia y el período, y muestra las notas guardadas', async () => {
    await abrirPlanilla();

    expect(mockApi).toHaveBeenCalledWith('/grades?subjectId=mat-1&periodId=per-1', {
      institutionId: 'esc-1',
    });
    expect(screen.getByLabelText<HTMLInputElement>('Nota de Ruiz, Beto').value).toBe('7,5');
  });

  it.each(['11', '0', '10,5', '7,123', 'abc'])(
    'el valor %s marca el casillero en rojo y deshabilita Guardar',
    async (valor) => {
      const casillero = await abrirPlanilla();

      await userEvent.type(casillero, valor);

      expect(casillero.getAttribute('aria-invalid')).toBe('true');
      expect(casillero.className).toContain('border-rojo');
      expect(botonGuardar()).toHaveProperty('disabled', true);
    }
  );

  it.each(['1', '10', '7,5', '8.25'])('el valor %s es válido', async (valor) => {
    const casillero = await abrirPlanilla();

    await userEvent.type(casillero, valor);

    expect(casillero.getAttribute('aria-invalid')).toBe('false');
    expect(botonGuardar()).toHaveProperty('disabled', false);
  });

  it('sin cambios no deja guardar', async () => {
    await abrirPlanilla();

    expect(botonGuardar()).toHaveProperty('disabled', true);
  });

  it('borrar una nota guardada avisa que no se puede y deshabilita Guardar', async () => {
    await abrirPlanilla();
    const casillero = screen.getByLabelText('Nota de Ruiz, Beto');

    await userEvent.clear(casillero);

    expect(casillero.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Por ahora no se puede borrar una nota.')).toBeTruthy();
    expect(botonGuardar()).toHaveProperty('disabled', true);
  });

  it('guarda solo lo que cambió, con la coma pasada a número, y muestra Guardado', async () => {
    const casillero = await abrirPlanilla();
    await userEvent.type(casillero, '8,5');

    let terminar: (value: { saved: number }) => void = () => {};
    mockApi.mockReturnValueOnce(new Promise((resolve) => (terminar = resolve)));
    await userEvent.click(botonGuardar());

    expect(screen.getByRole('button', { name: 'Guardando...' })).toHaveProperty('disabled', true);
    expect(mockApi).toHaveBeenLastCalledWith('/grades', {
      method: 'PUT',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: 'mat-1',
        periodId: 'per-1',
        entries: [{ studentId: 'a1', value: 8.5 }],
      }),
    });

    terminar({ saved: 1 });

    expect((await screen.findByRole('status')).textContent).toBe('¡Listo! Las notas se guardaron.');
    expect(botonGuardar()).toHaveProperty('disabled', true);
  });

  it('si la API falla muestra su mensaje y deja reintentar', async () => {
    const casillero = await abrirPlanilla();
    await userEvent.type(casillero, '9');

    mockApi.mockRejectedValueOnce(new ApiError(403, 'No dictás esta materia'));
    await userEvent.click(botonGuardar());

    expect((await screen.findByRole('alert')).textContent).toBe('No dictás esta materia');
    expect(botonGuardar()).toHaveProperty('disabled', false);
  });

  it('si no se puede cargar la planilla muestra el error', async () => {
    mockApi.mockRejectedValueOnce(new ApiError(404, 'No se encontró la materia'));
    render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" />);

    expect((await screen.findByRole('alert')).textContent).toBe('No se encontró la materia');
  });

  it('avisa si el curso no tiene alumnos', async () => {
    mockApi.mockResolvedValueOnce([]);
    render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" />);

    expect(await screen.findByText('Este curso todavía no tiene alumnos.')).toBeTruthy();
  });
});
