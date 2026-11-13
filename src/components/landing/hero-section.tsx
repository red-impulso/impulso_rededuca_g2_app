import Image from "next/image";

export function HeroSection() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Una red para aprender y crecer</p>
          <h1 id="hero-title">
            Red Educa: Tecnología que conecta, acompaña y transforma la
            educación.
          </h1>
          <p className="hero-description">
            Un canal centralizado, moderno e innovador para las comunidades
            educativas de Perico.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#piloto">
              Quiero participar en la prueba piloto
            </a>
            <a
              className="secondary-button"
              href="#propuesta"
              aria-label="Explorar programas educativos"
            >
              Explorar programas educativos
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M3.5 10h13m-5-5 5 5-5 5" />
              </svg>
            </a>
          </div>
          <ul className="hero-proof" aria-label="Beneficios principales">
            <li>Un solo canal</li>
            <li>Respuestas más rápidas</li>
            <li>Gratis en la prueba piloto</li>
          </ul>
        </div>
        <figure className="hero-visual">
          <Image
            src="/images/hero-red-educa.webp"
            alt="Estudiantes y escuelas conectados mediante una plataforma educativa digital."
            width={1380}
            height={752}
            priority
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </figure>
      </div>
    </section>
  );
}
