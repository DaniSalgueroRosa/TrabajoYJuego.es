// Ayudas comunes de las pruebas de los juegos.
import fs from 'node:fs';

/* Guarda una captura solo si se ha pedido (CAPTURAS=/ruta/carpeta); en las pruebas normales no deja archivos. */
export async function capturar(c, nombre, completa = true) {
  const dir = process.env.CAPTURAS;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  await c.captura(`${dir}/${nombre}.png`, completa);
}
