import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DomPatch } from "../components/dom-patch";
import { SiteFooter } from "../components/layout/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased notranslate`}
    >
      <body className="min-h-full flex flex-col">
        <DomPatch />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
