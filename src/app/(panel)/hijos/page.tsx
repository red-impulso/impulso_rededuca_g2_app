"use client";

import { ChildrenList } from "../../../features/guardians/children-list";
import { GuardianOnly } from "../../../features/guardians/guardian-only";

export default function HijosPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Mis hijos</h1>
      <GuardianOnly>
        {(institutionId) => <ChildrenList institutionId={institutionId} />}
      </GuardianOnly>
    </main>
  );
}
