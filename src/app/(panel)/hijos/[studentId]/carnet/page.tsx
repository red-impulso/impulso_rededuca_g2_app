"use client";

import { useParams } from "next/navigation";
import { GuardianOnly } from "../../../../../features/guardians/guardian-only";
import { CarnetHijo } from "../../../../../features/qr/carnet-hijo";

export default function CarnetHijoPage() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <GuardianOnly>
      {(institutionId) => <CarnetHijo institutionId={institutionId} studentId={studentId} />}
    </GuardianOnly>
  );
}
