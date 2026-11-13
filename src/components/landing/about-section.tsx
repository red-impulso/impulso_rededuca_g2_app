import type { ReactNode } from "react";
import { SectionHeading } from "./section-heading";

const privacyCards: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Datos de menores",
    description:
      "No compartas nombres, diagnósticos ni información que permita identificar estudiantes en este formulario.",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.5 3 8.1 7 10 4-1.9 7-5.5 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Protección de datos",
    description:
      "Antes de tratar datos reales, el piloto deberá definir prácticas y responsabilidades de acuerdo con la normativa vigente.",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <path d="M12 14v3" />
      </svg>
    ),
  },
  {
    title: "IA como asistente",
    description:
      "La inteligencia artificial puede asistir, pero nunca reemplaza el criterio profesional ni decide sobre las personas.",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
        <path d="m5.6 5.6 2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

export function AboutSection() {
  return (
    <section
      className="content-section about-section"
      id="equipo"
      aria-labelledby="about-title"
    >
      <div className="section-inner about-layout">
        <SectionHeading
          eyebrow="Quiénes somos"
          title="Un proyecto educativo y social, hecho en equipo."
          description="RedEduca es un proyecto del Laboratorio Social de Innovación junto a Red Impulso, IES 6 y el grupo impulsor. Queremos diseñar con las comunidades educativas y aprender de quienes viven estos desafíos cada día."
          titleId="about-title"
        />
        <aside className="privacy-panel" id="privacidad">
          <p className="eyebrow">Privacidad y cuidado</p>
          <h3>La confianza también se diseña.</h3>
          <div className="privacy-grid">
            {privacyCards.map((card) => (
              <article key={card.title}>
                <span className="privacy-icon">{card.icon}</span>
                <h4>{card.title}</h4>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
