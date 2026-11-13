import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function LandingHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="RedEduca, inicio">
        <BrandLogo priority />
      </a>
      <nav className="main-navigation" aria-label="Navegación principal">
        <a href="#inicio">Inicio</a>
        <a href="#problema">El problema</a>
        <a href="#propuesta">Propuesta</a>
        <Link className="nav-ingresar" href="/ingresar">
          Ingresar
        </Link>
        <a className="nav-cta" href="#piloto">
          Postular
        </a>
      </nav>
    </header>
  );
}
