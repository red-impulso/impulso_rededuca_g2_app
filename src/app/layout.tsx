import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND_COLORS } from "../config/brand";
import { DomPatch } from "../components/dom-patch";
import { SiteFooter } from "../components/layout/site-footer";

// Letra de la marca (B-03).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedEduca — IES Nº 6 de Perico",
  description:
    "Página web para docentes y familias. Creada por alumnos de IES Nº 6 de Perico, Jujuy, Argentina.",
  other: { google: "notranslate" },
};

// Color de la barra de arriba del celular (B-11), igual que el del manifest.
export const viewport: Viewport = {
  themeColor: BRAND_COLORS.ink,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      translate="no"
      className={`${inter.variable} h-full antialiased notranslate`}
    >
      <body className="min-h-full flex flex-col">
        <DomPatch />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
