# -*- coding: utf-8 -*-
"""Pruebas del empaquetador (python3 sitio.py paquete): qué entra y qué no entra en el .zip que se entrega.
Ejecutar: python3 pruebas/test_paquete.py
"""
import shutil
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from motor.construir import construir  # noqa: E402
from motor.empaquetar import empaquetar  # noqa: E402
from pruebas.ejemplos import copiar_proyecto, escribir  # noqa: E402


class Paquete(unittest.TestCase):
    def setUp(self):
        self._tmp = Path(tempfile.mkdtemp(prefix="tyj-paquete-"))
        self.raiz = copiar_proyecto(self._tmp / "trabajoyjuego-v2", conservar=("legal",))
        escribir(self.raiz / "motor/__pycache__/x.pyc", "basura")
        escribir(self.raiz / "juegos/.DS_Store", "basura")
        escribir(self.raiz / "viejo.zip", "no debe entrar")

    def tearDown(self):
        shutil.rmtree(self._tmp, ignore_errors=True)

    def nombres(self, destino):
        with zipfile.ZipFile(destino) as z:
            return z.namelist()

    def test_el_proyecto_va_en_una_sola_carpeta_y_sin_basura(self):
        destino, n = empaquetar(self.raiz, self._tmp / "juegos.zip")
        nombres = self.nombres(destino)
        self.assertEqual(len(nombres), n)
        self.assertTrue(all(x.startswith("trabajoyjuego-v2/") for x in nombres))
        self.assertIn("trabajoyjuego-v2/config/titular.json", nombres)
        self.assertIn("trabajoyjuego-v2/legal/aviso-legal/pagina.html", nombres)
        for prohibido in ("__pycache__", ".DS_Store", ".zip", "/dist/"):
            self.assertFalse(any(prohibido in x for x in nombres), prohibido)

    def test_con_vista_previa_se_anade_el_sitio_construido_fuera_del_proyecto(self):
        destino, _ = empaquetar(self.raiz, self._tmp / "juegos.zip", vista_previa=True)
        nombres = self.nombres(destino)
        self.assertIn("vista-previa/index.html", nombres)
        self.assertIn("vista-previa/legal/aviso-legal/index.html", nombres)
        self.assertIn("vista-previa/404.html", nombres)
        self.assertFalse(any(x.startswith("trabajoyjuego-v2/dist") for x in nombres))
        raices = {x.split("/")[0] for x in nombres}
        self.assertEqual(raices, {"trabajoyjuego-v2", "vista-previa"})

    def test_lo_que_se_descomprime_se_construye_igual(self):
        destino, _ = empaquetar(self.raiz, self._tmp / "juegos.zip")
        fuera = self._tmp / "extraido"
        with zipfile.ZipFile(destino) as z:
            z.extractall(fuera)
        informe = construir(fuera / "trabajoyjuego-v2")
        self.assertTrue((fuera / "trabajoyjuego-v2/dist/legal/aviso-legal/index.html").is_file())
        self.assertTrue(informe.paginas)

    def test_solo_dist_sin_carpeta_raiz(self):
        construir(self.raiz)
        destino, _ = empaquetar(self.raiz, self._tmp / "dist.zip", solo_dist=True)
        nombres = self.nombres(destino)
        self.assertIn("index.html", nombres)
        self.assertFalse(any(x.startswith("trabajoyjuego-v2/") for x in nombres))


if __name__ == "__main__":
    unittest.main()
