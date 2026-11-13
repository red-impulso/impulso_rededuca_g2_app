export type FeatureIconName =
  | "delay"
  | "dispersion"
  | "disconnection"
  | "centralization"
  | "communication"
  | "accompany"
  | "institution"
  | "teacher"
  | "student"
  | "family"
  | "innovation";

export function FeatureIcon({
  name,
  className = "",
}: {
  name: FeatureIconName;
  className?: string;
}) {
  return (
    <svg
      className={`feature-icon ${className}`.trim()}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {name === "delay" && (
        <>
          <circle cx="25" cy="33" r="17" />
          <path d="M25 23v11l7 4M20 8h10m-5 8v-5M13 14l-4-4" />
          <path d="M45 26h12m-8 7h12m-10 7h8" />
        </>
      )}
      {name === "dispersion" && (
        <>
          <circle cx="32" cy="32" r="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="52" cy="12" r="4" />
          <circle cx="12" cy="52" r="4" />
          <circle cx="52" cy="52" r="4" />
          <path d="m16 16 12 12m8 0 12-12M16 48l12-12m8 0 12 12" />
        </>
      )}
      {name === "disconnection" && (
        <>
          <path d="M11 14h38a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H31l-11 7v-7h-9a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5Z" />
          <path d="m16 21 32 22M48 21 16 43" />
        </>
      )}
      {name === "centralization" && (
        <>
          <rect x="20" y="20" width="24" height="25" rx="3" />
          <path d="M25 27h14m-14 7h14m-14 7h8" />
          <circle cx="32" cy="9" r="3" />
          <circle cx="53" cy="32" r="3" />
          <circle cx="32" cy="55" r="3" />
          <circle cx="9" cy="32" r="3" />
          <path d="M32 12v6m18 14h-6M32 46v6M14 32h6" />
        </>
      )}
      {name === "communication" && (
        <>
          <path d="M8 11h25a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H20l-8 6v-6H8a5 5 0 0 1-5-5V16a5 5 0 0 1 5-5Z" />
          <path d="M31 39h12l8 6v-6h2a5 5 0 0 0 5-5V24a5 5 0 0 0-5-5h-9" />
          <path d="M12 21h16m-16 6h11m19 3h6" />
          <circle cx="22" cy="50" r="7" />
          <path d="M8 62a14 14 0 0 1 28 0m7-12a6 6 0 1 0 0-12" />
        </>
      )}
      {name === "accompany" && (
        <>
          <path d="M32 52C10 38 8 22 16 15a11 11 0 0 1 16 3 11 11 0 0 1 16-3c8 7 6 23-16 37Z" />
          <path d="M14 34h10l4-7 6 13 4-6h12" />
        </>
      )}
      {name === "institution" && (
        <>
          <path d="m6 26 26-16 26 16H6Z" />
          <path d="M12 30v20m13-20v20m14-20v20m13-20v20M6 56h52" />
        </>
      )}
      {name === "teacher" && (
        <>
          <rect x="4" y="8" width="38" height="26" rx="3" />
          <path d="M11 17h24m-24 8h14" />
          <circle cx="50" cy="26" r="6" />
          <path d="M39 56a11 11 0 0 1 22 0M20 34v22m-8 0h16" />
        </>
      )}
      {name === "student" && (
        <>
          <path d="M32 12 5 25l27 13 27-13-27-13Z" />
          <path d="M15 32v13c0 4 8 9 17 9s17-5 17-9V32M59 25v18" />
        </>
      )}
      {name === "family" && (
        <>
          <circle cx="20" cy="14" r="6" />
          <circle cx="44" cy="14" r="6" />
          <circle cx="32" cy="42" r="5" />
          <path d="M8 34a12 12 0 0 1 24 0M32 34a12 12 0 0 1 24 0M23 60a9 9 0 0 1 18 0" />
        </>
      )}
      {name === "innovation" && (
        <>
          <path d="M20 27a12 12 0 1 1 24 0c0 5-3 8-6 12-2 2-2 4-2 6H28c0-2 0-4-2-6-3-4-6-7-6-12Z" />
          <path d="M28 49h8m-7 5h6M32 2v7m21 1-5 5m14 17h-7M11 15l-5-5M4 32h7m8-18 4 10 6 5-3 6 7-4 5-9" />
        </>
      )}
    </svg>
  );
}
