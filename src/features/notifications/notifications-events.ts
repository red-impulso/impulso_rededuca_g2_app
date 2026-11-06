// La campanita está en el menú y la bandeja en la página: esto le avisa a la
// campanita que cambió algo sin esperar a que se navegue a otra pantalla.
export const CAMBIO_DE_NOTIFICACIONES = "rededuca:notificaciones";

export function avisarCambioDeNotificaciones() {
  window.dispatchEvent(new Event(CAMBIO_DE_NOTIFICACIONES));
}
