import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// Boletín de calificaciones en PDF: se arma en el navegador con las notas
// (GET /students/:id/grades) y la asistencia (GET /students/:id/attendance).
// Este archivo trae jsPDF, así que el botón lo carga recién al hacer clic.

type Instancia = "tp1" | "tp2" | "parcial1" | "parcial2" | "final";

export interface NotaAlumno {
  subject: { id: string; name: string };
  period: { id: string; name: string };
  value: number;
  items?: Partial<Record<Instancia, number | null>>;
}

export interface ResumenAsistencia {
  percentage: number | null;
  present: number;
  absent: number;
  late: number;
  justified: number;
}

export interface DatosBoletin {
  escuela: string;
  alumno: string;
  curso: string;
  emitido: string;
  filas: string[][];
  asistencia: ResumenAsistencia;
}

const INSTANCIAS: Instancia[] = ["tp1", "tp2", "parcial1", "parcial2", "final"];
export const COLUMNAS_BOLETIN = [
  "Materia",
  "Período",
  "TP 1",
  "TP 2",
  "Parcial 1",
  "Parcial 2",
  "Final",
  "Promedio",
  "Estado",
];

function conComa(valor: number): string {
  return String(Number(valor)).replace(".", ",");
}

// Los mismos cortes que la planilla del docente.
function estadoDe(promedio: number): string {
  if (promedio >= 7) return "Aprobada";
  if (promedio >= 4) return "En riesgo";
  return "Desaprobada";
}

export function filasBoletin(notas: NotaAlumno[]): string[][] {
  return notas.map((nota) => [
    nota.subject.name,
    nota.period.name,
    ...INSTANCIAS.map((kind) => {
      const valor = nota.items?.[kind];
      return valor === null || valor === undefined ? "-" : conComa(valor);
    }),
    conComa(nota.value),
    estadoDe(Number(nota.value)),
  ]);
}

export function nombreArchivoBoletin(alumno: string): string {
  return `boletin ${alumno}.pdf`;
}

const TINTA: [number, number, number] = [20, 24, 90];
const ACENTO: [number, number, number] = [255, 191, 67];
const GRIS: [number, number, number] = [90, 96, 110];
const COLOR_ESTADO: Record<string, [number, number, number]> = {
  Aprobada: [22, 128, 61],
  "En riesgo": [180, 100, 0],
  Desaprobada: [200, 30, 45],
};

export function crearBoletinPdf(datos: DatosBoletin): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  const margen = 15;

  // Encabezado con los colores de RedEduca.
  doc.setFillColor(...TINTA);
  doc.rect(0, 0, ancho, 30, "F");
  doc.setFillColor(...ACENTO);
  doc.rect(0, 30, ancho, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RedEduca", margen, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Boletín de calificaciones", margen, 22);
  doc.setFontSize(9);
  doc.text(datos.escuela, ancho - margen, 14, { align: "right" });
  doc.text(`Emitido el ${datos.emitido}`, ancho - margen, 22, { align: "right" });

  // Datos del alumno.
  doc.setTextColor(...TINTA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(datos.alumno, margen, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(`Curso: ${datos.curso}`, margen, 51);

  let y = 60;
  if (datos.filas.length === 0) {
    doc.setTextColor(...TINTA);
    doc.text("Todavía no tiene notas cargadas.", margen, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margen, right: margen },
      head: [COLUMNAS_BOLETIN],
      body: datos.filas,
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, textColor: TINTA },
      headStyles: { fillColor: TINTA, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [244, 246, 252] },
      columnStyles: {
        0: { cellWidth: 34, fontStyle: "bold" },
        1: { cellWidth: 26 },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
        6: { halign: "center" },
        7: { halign: "center", fontStyle: "bold" },
        8: { halign: "center", fontStyle: "bold" },
      },
      didParseCell: (celda) => {
        if (celda.section === "body" && celda.column.index === 8) {
          celda.cell.styles.textColor = COLOR_ESTADO[String(celda.cell.raw)] ?? TINTA;
        }
      },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Asistencia.
  const { asistencia } = datos;
  doc.setTextColor(...TINTA);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    asistencia.percentage === null
      ? "Asistencia: sin registros"
      : `Asistencia: ${conComa(asistencia.percentage)} %`,
    margen,
    y,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(
    `Presentes: ${asistencia.present}   Ausentes: ${asistencia.absent}   Tardes: ${asistencia.late}   Justificadas: ${asistencia.justified}`,
    margen,
    y + 6,
  );

  // Pie.
  doc.setFontSize(8);
  doc.text(
    "Generado con RedEduca · Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina",
    ancho / 2,
    alto - 10,
    { align: "center" },
  );

  return doc;
}

export function descargarBoletin(datos: DatosBoletin): void {
  crearBoletinPdf(datos).save(nombreArchivoBoletin(datos.alumno));
}
