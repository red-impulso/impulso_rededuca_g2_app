import Image from "next/image";

const logoProps = {
  src: "/images/logo_landing.webp",
  width: 609,
  height: 224,
  unoptimized: true,
};

export function BrandLogo({ priority = false }: { priority?: boolean }) {
  return (
    <span className="brand-image" role="img" aria-label="RedEduca, Plataforma Integral">
      <span className="logo-stage">
        <Image className="logo-text" alt="" {...logoProps} priority={priority} aria-hidden="true" />
        <span className="logo-spin" aria-hidden="true">
          <Image className="logo-spin-image" alt="" {...logoProps} priority={priority} />
        </span>
      </span>
    </span>
  );
}
