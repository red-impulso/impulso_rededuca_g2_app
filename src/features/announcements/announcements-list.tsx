// Lo que devuelve GET /announcements (ver README de la API).
export interface Announcement {
  id: string;
  scope: "institution" | "course" | "student";
  courseLabel: string | null;
  title: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

function alcanceDe({ scope, courseLabel }: Announcement): string {
  if (scope === "institution") return "Toda la institución";
  if (scope === "student") return "Personal";
  return courseLabel ? `Curso ${courseLabel}` : "Un curso";
}

// createdAt es un instante exacto: se muestra siempre en hora de Argentina.
function mostrarFecha(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Jujuy",
  });
}

export function AnnouncementsList({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return <p>Todavía no hay comunicados.</p>;

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <article key={announcement.id} className="rounded border bg-white px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="font-semibold">{announcement.title}</h2>
            <span className="rounded bg-surface px-2 py-1 text-xs font-medium">
              {alcanceDe(announcement)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {announcement.authorName ?? "Institución"} · {mostrarFecha(announcement.createdAt)}
          </p>
          <p className="mt-2 whitespace-pre-line">{announcement.body}</p>
        </article>
      ))}
    </div>
  );
}
