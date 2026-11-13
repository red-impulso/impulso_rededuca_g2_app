"use client";

import { useEffect, useId, useRef } from "react";

// Logo de RedEduca: tres óvalos con satélites que los recorren alrededor del
// círculo central, cada uno en su propio sentido. Es el mismo dibujo que
// src/app/icon.svg: si cambia uno hay que actualizar el otro.
// Las órbitas se parten en mitad de atrás y mitad de adelante para que los
// satélites pasen por detrás y por delante del centro. El giro de los anillos
// y el pulso del centro están en globals.css y respetan "reducir movimiento";
// los satélites se mueven acá con requestAnimationFrame.

const NS = "http://www.w3.org/2000/svg";
const N = 120;
const TAIL = 16;
const RX = 80;
const RY = 28;
const CX = 100;
const CY = 100;

interface Orbita {
  color: string;
  angle: number;
  dir: 1 | -1;
  speed: number;
}

const ORBITAS: Orbita[] = [
  { color: "#3a34b8", angle: 0, dir: 1, speed: 1.15 },
  { color: "#f5921f", angle: 60, dir: -1, speed: 1.45 },
  { color: "#1fb6df", angle: 120, dir: 1, speed: 1.8 },
];

function punto(orbita: Orbita, u: number) {
  const a = (orbita.angle * Math.PI) / 180;
  const x = RX * Math.cos(u);
  const y = RY * Math.sin(u);
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: CX + x * c - y * s, y: CY + x * s + y * c, front: Math.sin(u) >= 0 };
}

// Recorre la elipse y junta los tramos que van por detrás del centro
// (atras) y los que van por delante (adelante), como dos paths aparte.
function trazos(orbita: Orbita) {
  let atras = "";
  let adelante = "";
  let previo: boolean | null = null;
  for (let i = 0; i <= N; i++) {
    const p = punto(orbita, (i / N) * Math.PI * 2);
    const seg = `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    if (p.front) {
      adelante += (previo === true ? "L" : "M") + seg;
    } else {
      atras += (previo === false ? "L" : "M") + seg;
    }
    previo = p.front;
  }
  return { atras, adelante };
}

const RINGS = ORBITAS.map((orbita) => ({ ...orbita, ...trazos(orbita) }));

export function LogoAnimado({
  size = 48,
  conTexto = false,
}: {
  size?: number;
  conTexto?: boolean;
}) {
  const atrasRef = useRef<SVGGElement>(null);
  const adelanteRef = useRef<SVGGElement>(null);
  const gradientId = useId();

  useEffect(() => {
    const atras = atrasRef.current;
    const adelante = adelanteRef.current;
    if (!atras || !adelante) return;

    // Los satélites se crean solo en el cliente (son 16 por órbita por lado).
    const colas = ORBITAS.map((orbita) => {
      const tb: SVGCircleElement[] = [];
      const tf: SVGCircleElement[] = [];
      for (let k = 0; k < TAIL; k++) {
        const cb = document.createElementNS(NS, "circle");
        cb.setAttribute("fill", orbita.color);
        cb.setAttribute("r", "0");
        atras.appendChild(cb);
        tb.push(cb);

        const cf = document.createElementNS(NS, "circle");
        cf.setAttribute("fill", orbita.color);
        cf.setAttribute("r", "0");
        adelante.appendChild(cf);
        tf.push(cf);
      }
      return { tb, tf };
    });

    function dibujar(ms: number) {
      const t = ms / 1000;
      ORBITAS.forEach((orbita, i) => {
        const { tb, tf } = colas[i];
        for (let k = 0; k < TAIL; k++) {
          const u = (t * orbita.speed - k * 0.075) * orbita.dir;
          const p = punto(orbita, u);
          const f = 1 - k / TAIL;
          const on = p.front ? tf[k] : tb[k];
          const off = p.front ? tb[k] : tf[k];
          on.setAttribute("cx", p.x.toFixed(1));
          on.setAttribute("cy", p.y.toFixed(1));
          on.setAttribute("r", (5.2 * f).toFixed(2));
          on.style.opacity = String((p.front ? 1 : 0.55) * Math.pow(f, 1.4));
          off.setAttribute("r", "0");
        }
      });
    }

    let raf = 0;
    // jsdom (tests) no trae matchMedia ni requestAnimationFrame: con cualquiera
    // ausente se dibuja un cuadro quieto y listo.
    const quieto =
      typeof window.matchMedia !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto || typeof requestAnimationFrame !== "function") {
      dibujar(0); // un cuadro quieto: los satélites se ven pero no se mueven
    } else {
      const frame = (ms: number) => {
        dibujar(ms);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      colas.forEach(({ tb, tf }) =>
        [...tb, ...tf].forEach((c) => c.remove()),
      );
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label="RedEduca"
      >
        <defs>
          <radialGradient id={gradientId} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#8aeaf2" />
            <stop offset="1" stopColor="#119fb5" />
          </radialGradient>
        </defs>
        {/* Mitad de las órbitas que pasa por detrás del centro. */}
        <g data-logo="orbitas" className="logo-orbitas" ref={atrasRef}>
          {RINGS.map((orbita) => (
            <path
              key={orbita.color}
              className="logo-orbita-atras"
              stroke={orbita.color}
              d={orbita.atras}
            />
          ))}
        </g>
        <g data-logo="centro">
          <g className="logo-centro-pulso">
            <circle cx={CX} cy={CY} r="20" fill={`url(#${gradientId})`} />
            <g className="logo-brillo">
              <ellipse cx="92" cy="90" rx="6" ry="4" fill="#fff" opacity=".5" />
            </g>
            <text
              x={CX}
              y="98"
              textAnchor="middle"
              fontSize="8"
              fontWeight={800}
              fill="#0b2447"
            >
              Red
            </text>
            <text
              x={CX}
              y="107"
              textAnchor="middle"
              fontSize="8"
              fontWeight={800}
              fill="#0b2447"
            >
              Educa
            </text>
          </g>
        </g>
        {/* Mitad de las órbitas que pasa por delante del centro. */}
        <g className="logo-orbitas" ref={adelanteRef}>
          {RINGS.map((orbita) => (
            <path
              key={orbita.color}
              className="logo-orbita"
              stroke={orbita.color}
              d={orbita.adelante}
            />
          ))}
        </g>
      </svg>
      {conTexto && (
        <span className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-ink">RedEduca</span>
          <span className="text-xs font-medium text-purple">Plataforma Integral</span>
        </span>
      )}
    </span>
  );
}
