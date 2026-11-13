import { FeatureIcon, type FeatureIconName } from "./feature-icon";
import { SectionHeading } from "./section-heading";

const pillars: { icon: FeatureIconName; title: string; description: string }[] = [
  {
    icon: "communication",
    title: "Comunicar",
    description:
      "Avisos, comunicados y novedades claras entre la institución y las familias.",
  },
  {
    icon: "accompany",
    title: "Acompañar",
    description:
      "Seguimiento de calificaciones, asistencia y evolución de cada estudiante.",
  },
  {
    icon: "centralization",
    title: "Organizar",
    description:
      "La información y los procesos de la institución, centralizados y con trazabilidad.",
  },
  {
    icon: "innovation",
    title: "Potenciar",
    description:
      "Reportes y estadísticas para decidir mejor y reducir tareas repetitivas.",
  },
];

const actors: { icon: FeatureIconName; title: string; description: string }[] = [
  {
    icon: "institution",
    title: "Institución",
    description: "Reduce burocracia y obtiene estadísticas.",
  },
  {
    icon: "teacher",
    title: "Docentes",
    description: "Registran la información una sola vez.",
  },
  {
    icon: "student",
    title: "Estudiantes",
    description: "Consultan actividades y conocen su evolución.",
  },
  {
    icon: "family",
    title: "Familias",
    description: "Reciben información clara y avisos a tiempo.",
  },
];

export function ProposalSection() {
  return (
    <section
      className="content-section proposal-section"
      id="propuesta"
      aria-labelledby="proposal-title"
    >
      <div className="section-inner">
        <SectionHeading
          eyebrow="La propuesta"
          title="Una solución pensada para nuestras comunidades educativas"
          description="RedEduca simplifica la gestión y fortalece los vínculos de cada institución a partir de cuatro ejes."
          titleId="proposal-title"
        />
        <div className="benefit-grid">
          {pillars.map((pillar) => (
            <article className="benefit-card" key={pillar.title}>
              <FeatureIcon name={pillar.icon} className="benefit-icon" />
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
        <div className="actors-block">
          <h3>Una red que beneficia a sus cuatro actores</h3>
          <ul className="actor-grid">
            {actors.map((actor) => (
              <li className="actor-card" key={actor.title}>
                <span className="actor-icon" aria-hidden="true">
                  <FeatureIcon name={actor.icon} />
                </span>
                <div>
                  <h4>{actor.title}</h4>
                  <p>{actor.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="inclusion-note">
          <h3>Una plataforma para distintas trayectorias</h3>
          <p>
            La tecnología debe adaptarse a las personas. Queremos acompañar
            distintas maneras de comunicarse, participar y aprender, trabajando
            con estudiantes, familias y equipos educativos.
          </p>
        </div>
      </div>
    </section>
  );
}
