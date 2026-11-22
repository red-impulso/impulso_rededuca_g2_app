import { LogoAnimado } from "../brand/logo-animado";

// El mismo logo animado del sistema (órbitas que giran), con "RedEduca /
// Plataforma Integral" al lado, para que la landing y la app se vean iguales.
export function BrandLogo() {
  return (
    <span className="brand-image">
      <LogoAnimado size={44} conTexto />
    </span>
  );
}
