import { describe, expect, it } from 'vitest';
import { crearBoletinPdf, filasBoletin, nombreArchivoBoletin, type DatosBoletin } from './boletin';

const vacias = { tp1: null, tp2: null, parcial1: null, parcial2: null, final: null };

const notas = [
  {
    subject: { id: 's1', name: 'Lengua' },
    period: { id: 'p1', name: '1.er trimestre' },
    value: 3.5,
    items: { ...vacias, tp1: 3, tp2: 4 },
  },
  {
    subject: { id: 's2', name: 'Matemática' },
    period: { id: 'p1', name: '1.er trimestre' },
    value: 8.5,
    items: { ...vacias, tp1: 9, parcial1: 8 },
  },
  {
    subject: { id: 's3', name: 'Historia' },
    period: { id: 'p1', name: '1.er trimestre' },
    value: 6,
    items: vacias,
  },
];

describe('filasBoletin', () => {
  it('arma una fila por materia y período con las 5 instancias, el promedio y el estado', () => {
    expect(filasBoletin(notas)).toEqual([
      ['Lengua', '1.er trimestre', '3', '4', '-', '-', '-', '3,5', 'Desaprobada'],
      ['Matemática', '1.er trimestre', '9', '-', '8', '-', '-', '8,5', 'Aprobada'],
      // Una nota cargada antes de las instancias: solo el promedio.
      ['Historia', '1.er trimestre', '-', '-', '-', '-', '-', '6', 'En riesgo'],
    ]);
  });

  it('sin items (API vieja) igual arma la fila con el promedio', () => {
    const sinItems = { ...notas[0], items: undefined };
    expect(filasBoletin([sinItems])).toEqual([
      ['Lengua', '1.er trimestre', '-', '-', '-', '-', '-', '3,5', 'Desaprobada'],
    ]);
  });
});

describe('nombreArchivoBoletin', () => {
  it('usa el nombre del alumno', () => {
    expect(nombreArchivoBoletin('Pérez, Ana')).toBe('boletin Pérez, Ana.pdf');
  });
});

describe('crearBoletinPdf', () => {
  const datos: DatosBoletin = {
    escuela: 'IES Nº 6 de Perico',
    alumno: 'Pérez, Ana',
    curso: '4° Año A',
    emitido: '22/11/2026',
    filas: filasBoletin(notas),
    asistencia: { percentage: 87.5, present: 6, absent: 1, late: 1, justified: 0 },
  };

  it('genera un PDF de verdad con los datos del alumno, las notas y la asistencia', () => {
    const pdf = crearBoletinPdf(datos).output();

    expect(pdf.startsWith('%PDF-')).toBe(true);
    for (const texto of [
      'Bolet',
      'Ana',
      'Matem',
      'Parcial 1',
      'Promedio',
      'Aprobada',
      'Asistencia: 87,5 %',
      'Creado por alumnos de IES N',
    ]) {
      expect(pdf, texto).toContain(texto);
    }
  });

  it('sin notas ni asistencia avisa en vez de dejar la tabla vacía', () => {
    const pdf = crearBoletinPdf({
      ...datos,
      filas: [],
      asistencia: { percentage: null, present: 0, absent: 0, late: 0, justified: 0 },
    }).output();

    expect(pdf).toContain('Todav');
    expect(pdf).toContain('Asistencia: sin registros');
  });
});
