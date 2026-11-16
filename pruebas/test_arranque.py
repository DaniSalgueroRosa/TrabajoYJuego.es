# -*- coding: utf-8 -*-
"""Pruebas de cómo se arranca el sitio: sin argumentos (botón ▶ de VS Code), con «servir» y en modo aislado.

Ejecutar: python3 pruebas/test_arranque.py
"""
import os
import subprocess
import sys
import time
import unittest
import urllib.request
from pathlib import Path
from unittest import mock

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))
import sitio  # noqa: E402


class SinArgumentos(unittest.TestCase):
    def test_sin_argumentos_equivale_a_servir(self):
        with mock.patch("motor.servir.principal", return_value=0) as servir:
            self.assertEqual(sitio.main(["sitio.py"]), 0)
        servir.assert_called_once_with([])

    def test_ayuda_explicita_sigue_mostrando_la_ayuda(self):
        with mock.patch("motor.servir.principal") as servir:
            self.assertEqual(sitio.main(["sitio.py", "ayuda"]), 0)
        servir.assert_not_called()

    def test_orden_desconocida_da_error_y_ayuda(self):
        self.assertEqual(sitio.main(["sitio.py", "volar"]), 2)

    def test_python_antiguo_explica_que_hace_falta_otro(self):
        class Version(tuple):
            pass
        with mock.patch.object(sitio.sys, "version_info", Version((3, 9, 1))):
            self.assertEqual(sitio.main(["sitio.py", "ayuda"]), 1)


class ServidorReal(unittest.TestCase):
    def _arrancar(self, *args, puerto):
        entorno = {**os.environ, "PYTHONIOENCODING": "cp1252"}   # una consola de Windows antigua: no debe romper nada
        return subprocess.Popen([sys.executable, *args, "--puerto", str(puerto), "--sin-navegador"], cwd=RAIZ.parent,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", env=entorno)

    def _esperar_y_pedir(self, proceso, puerto):
        try:
            for _ in range(80):
                try:
                    r = urllib.request.urlopen(f"http://127.0.0.1:{puerto}/", timeout=1)
                    return r.status, r.read().decode("utf-8")
                except OSError:
                    if proceso.poll() is not None:
                        break
                    time.sleep(0.25)
            self.fail("el servidor no ha arrancado:\n" + (proceso.stdout.read() if proceso.poll() is not None else "(sigue sin responder)"))
        finally:
            proceso.terminate()
            proceso.wait(timeout=10)

    def test_servir_desde_otra_carpeta_responde_la_portada(self):
        puerto = 18741
        estado, cuerpo = self._esperar_y_pedir(self._arrancar(str(RAIZ / "sitio.py"), "servir", puerto=puerto), puerto)
        self.assertEqual(estado, 200)
        self.assertIn("TrabajoYJuego", cuerpo)

    def test_funciona_en_modo_aislado(self):
        puerto = 18742
        estado, _ = self._esperar_y_pedir(self._arrancar("-I", str(RAIZ / "sitio.py"), "servir", puerto=puerto), puerto)
        self.assertEqual(estado, 200)


if __name__ == "__main__":
    unittest.main(verbosity=2)
