import Image from "next/image";
import { FeatureIcon, type FeatureIconName } from "./feature-icon";
import { SectionHeading } from "./section-heading";

const challenges: { icon: FeatureIconName; title: string; description: string }[] = [
  {
    icon: "delay",
    title: "Demoras",
    description: "Canales informales y lentitud.",
  },
  {
    icon: "dispersion",
    title: "Dispersión",
    description: "Pérdida de solicitudes e información.",
  },
  {
    icon: "disconnection",
    title: "Desconexión",
    description: "Falta de un canal unificado local.",
  },
];

export function ProblemSection() {
  return (
    <section
      className="content-section problem-section"
      id="problema"
      aria-labelledby="problem-title"
    >
      <div className="section-inner">
        <SectionHeading
          eyebrow="El problema que abordamos"
          title="¿Por qué nace RedEduca?"
          titleId="problem-title"
        />
        <div className="problem-layout">
          <figure className="problem-visual">
            <Image
              src="/images/problema-red-educa.webp"
              alt="Escena de desorganización administrativa con documentos, planillas y mensajes dispersos."
              width={1380}
              height={752}
              sizes="(max-width: 760px) 100vw, 42vw"
            />
            <figcaption>
              La información dispersa genera burocracia y resta tiempo al
              acompañamiento educativo.
            </figcaption>
          </figure>
          <div className="card-grid">
            {challenges.map((challenge) => (
              <article className="feature-card" key={challenge.icon}>
                <span className="problem-icon" aria-hidden="true">
                  <FeatureIcon name={challenge.icon} />
                </span>
                <div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
