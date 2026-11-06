"use client";

import { useParams } from "next/navigation";
import { GuardianOnly } from "../../../../../features/guardians/guardian-only";
import { StudentGrades } from "../../../../../features/guardians/student-grades";

export default function NotasHijoPage() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <GuardianOnly>
      {(institutionId) => <StudentGrades institutionId={institutionId} studentId={studentId} />}
    </GuardianOnly>
  );
}
