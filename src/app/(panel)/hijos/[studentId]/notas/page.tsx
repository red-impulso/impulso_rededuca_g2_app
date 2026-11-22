"use client";

import { useParams } from "next/navigation";
import { BoletinBoton } from "../../../../../features/boletin/boletin-boton";
import { GuardianOnly } from "../../../../../features/guardians/guardian-only";
import { StudentGrades } from "../../../../../features/guardians/student-grades";

export default function NotasHijoPage() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <GuardianOnly>
      {(institutionId) => (
        <div className="flex flex-col gap-4">
          <BoletinBoton institutionId={institutionId} studentId={studentId} />
          <StudentGrades institutionId={institutionId} studentId={studentId} />
        </div>
      )}
    </GuardianOnly>
  );
}
