import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
