// Logo de RedEduca con las órbitas girando sobre el centro, que queda quieto.
// Es el mismo dibujo que src/app/icon.svg (PROVISORIO de B-03): cuando llegue
// el original de UX/UI hay que actualizar los dos.
// El giro está en globals.css (.logo-orbitas) y respeta "reducir movimiento".
export function LogoAnimado({
  size = 48,
  conTexto = false,
}: {
  size?: number;
  conTexto?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        viewBox="0 0 512 512"
        width={size}
        height={size}
        role="img"
        aria-label="RedEduca"
      >
        <defs>
          <radialGradient id="logo-esfera" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#7cc4ff" />
            <stop offset="55%" stopColor="#2f6fe0" />
            <stop offset="100%" stopColor="#1b2f8a" />
          </radialGradient>
        </defs>
        <g data-logo="orbitas" className="logo-orbitas">
          <ellipse cx="256" cy="256" rx="206" ry="96" fill="none" stroke="#2b2f8f" strokeWidth="34" transform="rotate(-28 256 256)" />
          <ellipse cx="256" cy="256" rx="196" ry="84" fill="none" stroke="#22c3e6" strokeWidth="30" transform="rotate(38 256 256)" />
          <circle cx="148" cy="86" r="40" fill="#833dff" />
          <circle cx="436" cy="226" r="36" fill="#f79a3e" />
        </g>
        <g data-logo="centro">
          <circle cx="256" cy="256" r="78" fill="#ffffff" />
          <circle cx="256" cy="256" r="66" fill="url(#logo-esfera)" />
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
