import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "../config/brand";

// Datos para instalar RedEduca en el celular (B-11).
// Next lo publica en /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RedEduca",
    short_name: "RedEduca",
    description: "Página web para docentes y familias. Creada por alumnos de IES Nº 6 de Perico, Jujuy, Argentina.",
    lang: "es",
    start_url: "/inicio",
    display: "standalone",
    theme_color: BRAND_COLORS.ink,
    background_color: BRAND_COLORS.surface,
    // Íconos de B-03. icon-192.png se genera desde src/app/icon.svg igual que icon.png.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
