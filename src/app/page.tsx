import { LandingHeader } from "../components/landing/site-header";
import { LandingFooter } from "../components/landing/site-footer";
import { HeroSection } from "../components/landing/hero-section";
import { ProblemSection } from "../components/landing/problem-section";
import { ProposalSection } from "../components/landing/proposal-section";
import { PilotSection } from "../components/landing/pilot-section";
import { AboutSection } from "../components/landing/about-section";
import "./landing.css";

// Portada pública de RedEduca: la landing del proyecto
// proyecto_red_educa_grupo_2, con su diseño propio (clases .landing-scope).
// El botón "Ingresar" del menú lleva a /ingresar (Supabase).
// Las rutas del panel siguen pidiendo sesión: eso lo maneja src/proxy.ts.
export default function Home() {
  return (
    <div className="landing-scope">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>

      <LandingHeader />

      <main id="contenido" className="flex-1">
        <HeroSection />
        <ProblemSection />
        <ProposalSection />
        <PilotSection />
        <AboutSection />
      </main>

      <LandingFooter />
    </div>
  );
}
