"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { STUDENT_TABS } from "../../config/student-tabs";

// Pestañas de la ficha de un hijo, armadas desde STUDENT_TABS.
export function StudentTabsNav() {
  const { studentId } = useParams<{ studentId: string }>();
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 border-b pb-2">
      <Link href="/hijos" className="mr-2 text-sm text-gray-600 hover:underline">
        ← Mis hijos
      </Link>
      {STUDENT_TABS.map((tab) => {
        const href = `/hijos/${studentId}/${tab.segment}`;
        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100 aria-[current=page]:bg-gray-200"
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
