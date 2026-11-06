"use client";

import { useParams } from "next/navigation";
import { GuardianOnly } from "../../../../../features/guardians/guardian-only";
import { StudentAttendance } from "../../../../../features/guardians/student-attendance";

export default function AsistenciaHijoPage() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <GuardianOnly>
      {(institutionId) => <StudentAttendance institutionId={institutionId} studentId={studentId} />}
    </GuardianOnly>
  );
}
