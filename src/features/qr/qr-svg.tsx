import QRCode from "qrcode";

// La matriz del QR: true = cuadradito negro.
export function matrizQr(texto: string): boolean[][] {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
  const lado = modules.size;
  return Array.from({ length: lado }, (_, y) =>
    Array.from({ length: lado }, (_, x) => Boolean(modules.data[y * lado + x]))
  );
}

// Dibuja el QR como SVG (nítido en pantalla y al imprimir), con el margen
// blanco que necesitan las cámaras para leerlo.
export function QrSvg({ texto, etiqueta, className }: { texto: string; etiqueta: string; className?: string }) {
  const matriz = matrizQr(texto);
  const lado = matriz.length;
  const margen = 4;
  let d = "";
  matriz.forEach((fila, y) =>
    fila.forEach((negro, x) => {
      if (negro) d += `M${x} ${y}h1v1h-1z`;
    })
  );

  return (
    <svg
      role="img"
      aria-label={etiqueta}
      viewBox={`${-margen} ${-margen} ${lado + margen * 2} ${lado + margen * 2}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-margen} y={-margen} width={lado + margen * 2} height={lado + margen * 2} fill="#fff" />
      <path d={d} fill="#14185a" />
    </svg>
  );
}
