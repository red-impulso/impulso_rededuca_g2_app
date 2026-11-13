import Image from "next/image";
import { PilotForm } from "./pilot-form";
import { SectionHeading } from "./section-heading";

const pilotSteps: [string, string][] = [
  ["Escuchar", "Conocemos las prioridades y los procesos de cada institución."],
  ["Construir", "Diseñamos soluciones junto a quienes las van a usar."],
  ["Implementar", "Probamos de forma gradual y con acompañamiento."],
  ["Aprender", "Evaluamos lo que funciona y mejoramos en conjunto."],
];

export function PilotSection() {
  return (
    <section
      className="content-section pilot-section"
      id="piloto"
      aria-labelledby="pilot-title"
    >
      <div className="section-inner pilot-layout">
        <div className="pilot-intro">
          <SectionHeading
            eyebrow="Instituciones piloto"
            title="Postula a tu institución"
            description="Contanos sobre tu comunidad y nos pondremos en contacto para conocer sus necesidades."
            titleId="pilot-intro-title"
          />
          <div className="pilot-process">
            <h3>Un proceso colaborativo</h3>
            <ol className="step-list">
              {pilotSteps.map(([title, description], index) => (
                <li key={title}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="form-card">
          <Image
            src="/images/marca-agua-formulario.webp"
            alt=""
            fill
            aria-hidden="true"
            className="form-card-watermark"
          />
          <div className="form-heading">
            <p className="eyebrow">Formulario de postulación</p>
            <h2 id="pilot-title">Sumate a la prueba piloto</h2>
          </div>
          <PilotForm />
        </div>
      </div>
    </section>
  );
}
