# -*- coding: utf-8 -*-
"""Pruebas del codificador de códigos QR propio (herramientas/datos/lib/qr.js).

No se comprueba el codificador contra sí mismo: Node genera los códigos y OpenCV (un lector de QR independiente) los decodifica.
Se cubren los 4 niveles de corrección, versiones desde la 1 hasta la 40, los tres modos (numérico, alfanumérico y bytes UTF-8)
y las 8 máscaras. Se salta con un aviso si no hay Node o OpenCV (cv2) en el equipo.

Ejecutar: python3 pruebas/test_qr_codificador.py
"""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIBRERIA = RAIZ / "herramientas" / "datos" / "lib" / "qr.js"

GENERADOR = r"""
const QR = require(process.argv[2]);
const out = [];
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,:/?=&-_';
const versiones = [1, 2, 3, 6, 7, 10, 14, 20, 27, 33, 40];
for (const nivel of ['L', 'M', 'Q', 'H']) {
  for (const v of versiones) {
    const n = v === 1 ? 5 : QR.capacidadBytes(v - 1, nivel) + 1;
    let t = ''; while (t.length < n) t += pr[Math.floor(rnd() * pr.length)];
    const q = QR.generar(t, { nivel });
    out.push({ t, nivel, v: q.version, esperada: v, modo: q.modo, mk: q.mascara, m: q.modulos.map(f => f.map(b => b ? 1 : 0).join('')) });
  }
}
for (const t of ['0123456789', '12345678901234567890123456789012345678901234567890', 'HELLO WORLD', 'HTTPS://EXAMPLE.COM/ABC-123', 'ÁRBOL ñandú € 日本語', 'https://www.trabajoyjuego.es/herramientas/calculadora-de-faltas-de-fp/']) {
  for (let mk = -1; mk < 8; mk++) {
    const nivel = 'MQ'[(mk + 1) % 2], q = QR.generar(t, { nivel, mascara: mk });
    out.push({ t, nivel, v: q.version, esperada: 0, modo: q.modo, mk: q.mascara, m: q.modulos.map(f => f.map(b => b ? 1 : 0).join('')) });
  }
}
console.log(JSON.stringify(out));
"""

DECODIFICADOR = r"""
import json, sys
import numpy as np, cv2
casos = json.load(open(sys.argv[1]))
claro = cv2.QRCodeDetector(); aruco = cv2.QRCodeDetectorAruco()
def imagen(c, k, marg=4):
    m = np.array([[int(ch) for ch in f] for f in c['m']], dtype=np.uint8); n = m.shape[0]
    img = np.full(((n + 2 * marg) * k,) * 2, 255, np.uint8)
    img[marg * k:(marg + n) * k, marg * k:(marg + n) * k] = np.kron(1 - m, np.ones((k, k), np.uint8)) * 255
    return img
def leer(c):
    for k in (8, 5, 10, 6, 12, 4):
        img = imagen(c, k)
        for det in (aruco, claro):          # el detector clásico de OpenCV falla con algunos QR perfectamente válidos
            t, _, _ = det.detectAndDecode(img)
            if t == c['t']: return True
    return False
print(json.dumps({'mal': [[i, c['nivel'], c['v'], c['modo'], c['mk'], c['t'][:30]] for i, c in enumerate(casos) if not leer(c)], 'total': len(casos)}))
"""


class CodificadorQR(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which("node"):
            raise unittest.SkipTest("No hay Node en este equipo")
        try:
            import cv2  # noqa: F401
            import numpy  # noqa: F401
        except ImportError:
            raise unittest.SkipTest("No está OpenCV (cv2) ni numpy: no hay lector de QR independiente con el que comprobar")
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        (tmp / "gen.cjs").write_text(GENERADOR, encoding="utf-8")
        (tmp / "dec.py").write_text(DECODIFICADOR, encoding="utf-8")
        salida = subprocess.run(["node", str(tmp / "gen.cjs"), str(LIBRERIA)], capture_output=True, text=True, check=True).stdout
        cls.casos = json.loads(salida)
        (tmp / "casos.json").write_text(salida, encoding="utf-8")
        r = subprocess.run([sys.executable, "-I", str(tmp / "dec.py"), str(tmp / "casos.json")], capture_output=True, text=True, check=True)
        cls.lectura = json.loads(r.stdout)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "tmp"):
            cls.tmp.cleanup()

    def test_lector_independiente_decodifica_todos(self):
        self.assertEqual(self.lectura["total"], len(self.casos))
        self.assertEqual(self.lectura["mal"], [], "OpenCV no ha podido leer estos códigos (índice, nivel, versión, modo, máscara, texto)")

    def test_la_version_elegida_es_la_minima_que_cabe(self):
        for c in self.casos:
            if c["esperada"]:
                self.assertEqual(c["v"], c["esperada"], f"nivel {c['nivel']}: el texto de {len(c['t'])} caracteres debía pedir la versión {c['esperada']}")

    def test_el_tamano_sigue_la_formula_de_la_version(self):
        for c in self.casos:
            self.assertEqual(len(c["m"]), 17 + 4 * c["v"])
            self.assertTrue(all(len(f) == len(c["m"]) for f in c["m"]))

    def test_se_usan_los_tres_modos_y_las_ocho_mascaras(self):
        self.assertEqual({c["modo"] for c in self.casos} >= {"num", "alfa", "byte"}, True, {c["modo"] for c in self.casos})
        self.assertEqual({c["mk"] for c in self.casos}, set(range(8)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
