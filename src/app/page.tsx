import { redirect } from "next/navigation";

// La raíz no tiene pantalla propia. Sin sesión, src/proxy.ts ya manda a /ingresar.
export default function Home() {
  redirect("/inicio");
}
