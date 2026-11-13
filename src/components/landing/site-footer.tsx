import Link from "next/link";
import { BrandLogo } from "./brand-logo";

// Con cacheComponents no se puede llamar a new Date() al prerenderizar:
// "use cache" fija el año del build (se renueva con cada deploy).
async function AnioActual() {
  "use cache";
  return new Date().getFullYear();
}

export function LandingFooter() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="#inicio">
        <BrandLogo />
      </a>
      <p>Laboratorio Social de Innovación — Red Impulso + IES 6</p>
      <Link href="/ingresar">Ingresar</Link>
      <a href="mailto:info@rededuca.edu.ar">info@rededuca.edu.ar</a>
      <small>© <AnioActual /> RedEduca</small>
    </footer>
  );
}
