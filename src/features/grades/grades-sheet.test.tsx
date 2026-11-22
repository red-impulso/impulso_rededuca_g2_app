// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { GradesSheet } from './grades-sheet';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const vacias = { tp1: null, tp2: null, parcial1: null, parcial2: null, final: null };

const planilla = [
  { student: { id: 'a1', firstName: 'Ana', lastName: 'Pérez' }, value: null, items: vacias },
  { student: { id: 'a2', firstName: 'Beto', lastName: 'Ruiz' }, value: 7.5, items: { ...vacias, tp1: 7, tp2: 8 } },
];

async function abrirPlanilla(filas: unknown[] = planilla) {
  mockApi.mockResolvedValueOnce(filas);
  render(<GradesSheet institutionId="esc-1" subjectId="mat-1" periodId="per-1" />);
  return screen.findByLabelText<HTMLInputElement>('TP 1 de Pérez, Ana');
}

const botonGuardar = () => screen.getByRole('button', { name: 'Guardar' });
const promedioDe = (nombre: string) => screen.getByLabelText(`Promedio de ${nombre}`).textContent;
const promedioDelCurso = () => screen.getByText('Promedio del curso').nextElementSibling?.textContent;
const enviado = (llamada = 1) => JSON.parse(mockApi.mock.calls[llamada][1]!.body as string);

describe('GradesSheet', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('pide la planilla y muestra las columnas del prototipo con las notas guardadas', async () => {
    await abrirPlanilla();

    expect(mockApi).toHaveBeenCalledWith('/grades?subjectId=mat-1&periodId=per-1', {
      institutionId: 'esc-1',
    });
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Nº',
      'Alumno',
      'TP 1',
      'TP 2',
      'Parcial 1',
      'Parcial 2',
      'Final',
      'Promedio',
      'Estado',
    ]);
    expect(screen.getByLabelText<HTMLInputElement>('TP 1 de Ruiz, Beto').value).toBe('7');
    expect(screen.getByLabelText<HTMLInputElement>('TP 2 de Ruiz, Beto').value).toBe('8');
    expect(screen.getByLabelText<HTMLInputElement>('Final de Ruiz, Beto').value).toBe('');
    expect(promedioDe('Ruiz, Beto')).toBe('7,5');
    expect(promedioDe('Pérez, Ana')).toBe('—');
    const filaBeto = screen.getByRole('row', { name: /Ruiz, Beto/ });
    expect(within(filaBeto).getByText('Aprobada')).toBeTruthy();
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

  it('el promedio de cada alumno se calcula al escribir', async () => {
    const casillero = await abrirPlanilla();

    await userEvent.type(casillero, '6');
    await userEvent.type(screen.getByLabelText('Parcial 1 de Pérez, Ana'), '9');

    expect(promedioDe('Pérez, Ana')).toBe('7,5');
  });

  it('una nota cargada antes sin instancias se muestra como promedio', async () => {
    await abrirPlanilla([
      planilla[0],
      { student: { id: 'a3', firstName: 'Caro', lastName: 'Sosa' }, value: 6, items: vacias },
    ]);

    expect(promedioDe('Sosa, Caro')).toBe('6');
  });

  it('borrar una nota guardada avisa y al guardar manda null en esa instancia', async () => {
    await abrirPlanilla();
    const casillero = screen.getByLabelText('TP 2 de Ruiz, Beto');

    await userEvent.clear(casillero);

    expect(casillero.getAttribute('aria-invalid')).toBe('false');
    expect(screen.getByText('Se borrará al guardar.')).toBeTruthy();
    expect(promedioDe('Ruiz, Beto')).toBe('7');

    mockApi.mockResolvedValueOnce({ saved: 1 });
    await userEvent.click(botonGuardar());

    expect(enviado()).toEqual({
      subjectId: 'mat-1',
      periodId: 'per-1',
      entries: [{ studentId: 'a2', items: { tp2: null } }],
    });
  });

  it('guarda solo las instancias que cambiaron, con la coma pasada a número', async () => {
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
        entries: [{ studentId: 'a1', items: { tp1: 8.5 } }],
      }),
    });

    terminar({ saved: 1 });

    expect((await screen.findByRole('status')).textContent).toBe('¡Listo! Las notas se guardaron.');
    expect(botonGuardar()).toHaveProperty('disabled', true);
    expect(promedioDe('Pérez, Ana')).toBe('8,5');
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
    expect(screen.queryByLabelText('TP 1 de Pérez, Ana')).toBeNull();
    expect(screen.getByLabelText('TP 1 de Ruiz, Beto')).toBeTruthy();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno' }), 'zzz');
    expect(screen.getByText('No hay alumnos con ese nombre.')).toBeTruthy();
  });

  it('una nota escrita y oculta por el buscador igual se guarda', async () => {
    const casillero = await abrirPlanilla();
    await userEvent.type(casillero, '9');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar alumno' }), 'ruiz');

    mockApi.mockResolvedValueOnce(undefined);
    await userEvent.click(botonGuardar());

    expect(enviado().entries).toEqual([{ studentId: 'a1', items: { tp1: 9 } }]);
  });

  it('muestra el promedio del curso y se actualiza al escribir', async () => {
    const casillero = await abrirPlanilla();
    expect(promedioDelCurso()).toBe('7,5');

    await userEvent.type(casillero, '8,5');
    expect(promedioDelCurso()).toBe('8');
  });

  it('sin notas el promedio del curso dice que no hay', async () => {
    await abrirPlanilla([planilla[0]]);

    expect(promedioDelCurso()).toBe('Sin notas');
  });

  it('Exportar descarga la planilla con todas las columnas en CSV para Excel', async () => {
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
    expect(new TextDecoder().decode(bytes.slice(3))).toBe(
      'Nº;Alumno;TP 1;TP 2;Parcial 1;Parcial 2;Final;Promedio\r\n' +
        '1;Pérez, Ana;;;;;;\r\n' +
        '2;Ruiz, Beto;7;8;;;;7,5\r\n'
    );
    const enlace = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(enlace.download).toBe('calificaciones 4°A - Matemática.csv');
    expect(revocar).toHaveBeenCalledWith('blob:planilla');
    click.mockRestore();
  });
});
