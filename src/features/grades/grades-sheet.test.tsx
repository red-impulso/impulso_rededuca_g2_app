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

  it('borrar una nota guardada avisa y al guardar manda null', async () => {
    await abrirPlanilla();
    const casillero = screen.getByLabelText('Nota de Ruiz, Beto');

    await userEvent.clear(casillero);

    expect(casillero.getAttribute('aria-invalid')).toBe('false');
    expect(screen.getByText('Se borrará al guardar.')).toBeTruthy();
    expect(botonGuardar()).toHaveProperty('disabled', false);

    mockApi.mockResolvedValueOnce({ saved: 1 });
    await userEvent.click(botonGuardar());

    expect(mockApi).toHaveBeenLastCalledWith('/grades', {
      method: 'PUT',
      institutionId: 'esc-1',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: 'mat-1',
        periodId: 'per-1',
        entries: [{ studentId: 'a2', value: null }],
      }),
    });
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

  it('muestra el título con la materia y el curso', async () => {
    mockApi.mockResolvedValueOnce(planilla);
    render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" titulo="4°A - Matemática" />);

    expect(await screen.findByRole('heading', { name: '4°A - Matemática' })).toBeTruthy();
  });

  it('el buscador filtra por nombre y avisa si no hay nadie', async () => {
    await abrirPlanilla();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno' }), 'rui');
    expect(screen.queryByLabelText('Nota de Pérez, Ana')).toBeNull();
    expect(screen.getByLabelText('Nota de Ruiz, Beto')).toBeTruthy();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno' }), 'zzz');
    expect(screen.getByText('No hay alumnos con ese nombre.')).toBeTruthy();
  });

  it('una nota escrita y oculta por el buscador igual se guarda', async () => {
    const casillero = await abrirPlanilla();
    await userEvent.type(casillero, '9');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno' }), 'ruiz');

    mockApi.mockResolvedValueOnce(undefined);
    await userEvent.click(botonGuardar());

    expect(JSON.parse(mockApi.mock.calls[1][1]!.body as string).entries).toEqual([{ studentId: 'a1', value: 9 }]);
  });

  it('muestra el promedio del curso y se actualiza al escribir', async () => {
    const casillero = await abrirPlanilla();
    expect(screen.getByText('Promedio del curso').nextElementSibling?.textContent).toBe('7,5');

    await userEvent.type(casillero, '8,5');
    expect(screen.getByText('Promedio del curso').nextElementSibling?.textContent).toBe('8');
  });

  it('sin notas el promedio dice que no hay', async () => {
    mockApi.mockResolvedValueOnce([planilla[0]]);
    render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" />);

    expect((await screen.findByText('Promedio del curso')).nextElementSibling?.textContent).toBe('Sin notas');
  });

  it('Exportar descarga la planilla en CSV para Excel', async () => {
    const crear = vi.fn<(blob: Blob) => string>(() => 'blob:planilla');
    const revocar = vi.fn();
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    mockApi.mockResolvedValueOnce(planilla);
    render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" titulo="4°A - Matemática" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Exportar' }));

    const bytes = new Uint8Array(await crear.mock.calls[0][0].arrayBuffer());
    // BOM de UTF-8 al principio, para que Excel lea bien las tildes.
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('Nº;Alumno;Nota\r\n1;Pérez, Ana;\r\n2;Ruiz, Beto;7,5\r\n');
    const enlace = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(enlace.download).toBe('calificaciones 4°A - Matemática.csv');
    expect(revocar).toHaveBeenCalledWith('blob:planilla');
    click.mockRestore();
  });
});
