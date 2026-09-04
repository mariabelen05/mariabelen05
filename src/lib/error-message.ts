/**
 * Convierte un error atrapado en un mensaje apto para mostrarle al docente.
 *
 * Los errores que nosotros mismos lanzamos en las server actions (ej.
 * "Completá el paso 1 primero.") son cortos, están en español y se muestran
 * tal cual. Cualquier otra cosa — un fallo de red, un error interno de
 * React/Next, una traza minificada con link a react.dev/errors — se
 * reemplaza por un mensaje genérico y accionable en vez de exponer texto
 * técnico que no le dice nada al docente.
 */
export function mensajeError(e: unknown, accion: string): string {
  const mensaje = e instanceof Error ? e.message : "";
  const pareceTecnico =
    !mensaje || /react\.dev|minified react error|chunkloaderror|networkerror|fetch failed|unexpected token/i.test(mensaje);
  if (!pareceTecnico) return mensaje;
  return `No pudimos ${accion}. Volvé a intentarlo — si el problema sigue, recargá la página.`;
}
