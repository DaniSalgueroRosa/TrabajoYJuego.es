# -*- coding: utf-8 -*-
"""Servidor local para ver el sitio mientras trabajas. Reconstruye solo cuando guardas un cambio en cualquier archivo
(HTML, CSS, JSON, imágenes…) y, si algo está mal, lo muestra en el navegador con el mismo mensaje que daría la consola."""
from __future__ import annotations

import contextlib
import html
import http.server
import os
import threading
import time
import webbrowser
from functools import partial
from pathlib import Path

from .construir import construir
from .nucleo import RAIZ, ErrorProyecto
from .plantilla import ErrorPlantilla

IGNORAR = {"dist", "dist.tmp", "dist.old", "__pycache__", "motor", "pruebas", "docs"}


def firma(raiz: Path) -> int:
    """Huella de todos los archivos que forman el sitio: cambia cuando guardas algo."""
    datos = []
    for ruta, carpetas, archivos in os.walk(raiz):
        carpetas[:] = [d for d in carpetas if d not in IGNORAR and not d.startswith(".")]
        for nombre in archivos:
            if nombre.startswith("."):
                continue
            p = os.path.join(ruta, nombre)
            try:
                st = os.stat(p)
            except OSError:
                continue
            datos.append((p, st.st_mtime_ns, st.st_size))
    return hash(tuple(sorted(datos)))


class Estado:
    def __init__(self):
        self.error: str | None = None
        self.hilo_activo = True


def pagina_de_error(texto: str) -> bytes:
    return (
        "<!doctype html><html lang='es'><meta charset='utf-8'><meta http-equiv='refresh' content='2'>"
        "<title>Error al construir</title><body style='font:16px/1.5 system-ui,sans-serif;max-width:46rem;margin:3rem auto;padding:0 1rem'>"
        "<h1 style='color:#b00020'>No se ha podido construir el sitio</h1>"
        f"<pre style='white-space:pre-wrap;background:#fdecea;padding:1rem;border-left:6px solid #b00020'>{html.escape(texto)}</pre>"
        "<p>Corrige el archivo y guárdalo: esta página se recarga sola y el sitio vuelve a verse cuando todo esté bien.</p></body></html>"
    ).encode("utf-8")


def cabeceras_de_seguridad(carpeta: str) -> list:
    """Las cabeceras de «_headers» (las mismas que llevará el hosting), para que lo que ves aquí se comporte como en producción.
    Se dejan fuera HSTS (solo vale con HTTPS) y upgrade-insecure-requests (aquí no hay HTTPS al que subir)."""
    try:
        texto = (Path(carpeta) / "_headers").read_text(encoding="utf-8")
    except OSError:
        return []
    salida = []
    for linea in texto.splitlines():
        if not linea.startswith("  ") or ": " not in linea:
            continue
        nombre, valor = linea.strip().split(": ", 1)
        if nombre == "Strict-Transport-Security":
            continue
        if nombre == "Content-Security-Policy":
            valor = "; ".join(p for p in valor.split("; ") if p != "upgrade-insecure-requests")
        salida.append((nombre, valor))
    return salida


class Manejador(http.server.SimpleHTTPRequestHandler):
    estado: Estado = None
    _pagina_de_error = False   # la página de error de construcción lleva estilos en línea a propósito: no se le aplica la política del sitio

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        if not self._pagina_de_error:
            for nombre, valor in cabeceras_de_seguridad(self.directory):
                self.send_header(nombre, valor)
        super().end_headers()

    def log_message(self, formato, *args):
        pass

    def _responder(self, codigo: int, cuerpo: bytes):
        self.send_response(codigo)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(cuerpo)

    def do_GET(self):
        if self.estado and self.estado.error and not self.path.split("?")[0].startswith("/assets/"):
            self._pagina_de_error = True
            return self._responder(500, pagina_de_error(self.estado.error))
        return super().do_GET()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            pagina = Path(self.directory) / "404.html"
            if pagina.is_file():
                return self._responder(404, pagina.read_bytes())
        super().send_error(code, message, explain)


def reconstruir(estado: Estado):
    for intento in range(4):
        try:
            informe = construir()
            estado.error = None
            print("\n" + informe.resumen())
            print("Sitio actualizado.")
            return
        except (ErrorProyecto, ErrorPlantilla) as e:
            estado.error = str(e)
            print(f"\nError al construir:\n  {e}\n(Corrígelo y guarda: se vuelve a intentar solo.)")
            return
        except OSError as e:
            # En Windows, cambiar la carpeta dist/ falla si el navegador o el antivirus tienen un archivo abierto en ese instante.
            if intento < 3:
                time.sleep(0.5)
                continue
            estado.error = (f"No se ha podido escribir la carpeta dist/ ({e}). Suele ser un programa que la tiene abierta "
                            "(antivirus, explorador de archivos). Ciérralo y guarda de nuevo.")
            print(f"\nError al construir:\n  {estado.error}")


def vigilar(estado: Estado):
    ultima = firma(RAIZ)
    while estado.hilo_activo:
        time.sleep(0.6)
        actual = firma(RAIZ)
        if actual != ultima:
            ultima = actual
            time.sleep(0.2)             # por si se están guardando varios archivos a la vez
            ultima = firma(RAIZ)
            reconstruir(estado)


@contextlib.contextmanager
def servir_carpeta(carpeta: Path):
    """Sirve una carpeta ya construida en un puerto libre y entrega el número de puerto. Lo usan las pruebas en navegador."""
    class Estatico(Manejador):
        estado = None

    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), partial(Estatico, directory=str(carpeta)))
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    try:
        yield servidor.server_address[1]
    finally:
        servidor.shutdown()
        servidor.server_close()


def principal(args: list) -> int:
    puerto = 8080
    abrir_navegador = "--sin-navegador" not in args
    if "--puerto" in args:
        try:
            puerto = int(args[args.index("--puerto") + 1])
        except (IndexError, ValueError):
            print("Uso: python3 sitio.py servir [--puerto 8080] [--sin-navegador]")
            return 2
    estado = Estado()
    reconstruir(estado)
    manejador = partial(Manejador, directory=str(RAIZ / "dist"))
    Manejador.estado = estado
    servidor = None
    for p in range(puerto, puerto + 10):
        try:
            servidor = http.server.ThreadingHTTPServer(("127.0.0.1", p), manejador)
            break
        except OSError:
            continue
    if servidor is None:
        print(f"No he podido abrir ningún puerto entre {puerto} y {puerto + 9}. Prueba con otro: --puerto 9000")
        return 1
    hilo = threading.Thread(target=vigilar, args=(estado,), daemon=True)
    hilo.start()
    direccion = f"http://localhost:{servidor.server_address[1]}/"
    print(f"\nSitio en {direccion}   (Ctrl+C para parar)")
    print("Se reconstruye solo cada vez que guardas un cambio.")
    if abrir_navegador:
        try:
            webbrowser.open(direccion)
        except Exception:
            pass   # si no se puede abrir solo, basta con pegar la dirección en el navegador
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor parado.")
    finally:
        estado.hilo_activo = False
        servidor.server_close()
    return 0
