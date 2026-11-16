"""Los resúmenes del sitio (herramientas/datos/lib/hash.js: MD5, SHA-1, SHA-256, SHA-384, SHA-512) frente a hashlib de Python: mensajes de todas las
longitudes alrededor de los límites de bloque, bytes aleatorios, textos con acentos y emojis, y datos de varios cientos de kilobytes."""
import base64, hashlib, json, random, shutil, subprocess, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'hash.js'
ALGS = ['md5', 'sha1', 'sha256', 'sha384', 'sha512']

def node(js, entrada):
    r = subprocess.run(['node', '-e', f"const H = require({json.dumps(str(LIB))}); const e = JSON.parse(require('fs').readFileSync(0, 'utf8')); {js}"],
                       input=json.dumps(entrada), capture_output=True, text=True, timeout=300)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

JS = "const alg = %s; console.log(JSON.stringify(e.map(h => { const b = Uint8Array.from(Buffer.from(h, 'hex')); const o = {}; alg.forEach(a => o[a] = H.hex(H[a](b))); o.b64 = H.base64(H.sha256(b)); return o; })))" % json.dumps(ALGS)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class HashLibTest(unittest.TestCase):
    def comparar(self, mensajes):
        res = node(JS, [m.hex() for m in mensajes])
        for m, r in zip(mensajes, res):
            for a in ALGS:
                self.assertEqual(r[a], hashlib.new(a, m).hexdigest(), f'{a} con {len(m)} bytes')
            self.assertEqual(r['b64'], base64.b64encode(hashlib.sha256(m).digest()).decode())

    def test_vacio_y_valores_conocidos(self):
        self.comparar([b'', b'a', b'abc', b'message digest', b'The quick brown fox jumps over the lazy dog', b'The quick brown fox jumps over the lazy dog.'])
        r = node("console.log(JSON.stringify([H.hex(H.md5([])), H.hex(H.sha256([]))]))", None)
        self.assertEqual(r, ['d41d8cd98f00b204e9800998ecf8427e', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'])

    def test_todas_las_longitudes_de_0_a_300(self):
        rnd = random.Random(7)
        self.comparar([bytes(rnd.randrange(256) for _ in range(n)) for n in range(0, 301)])

    def test_limites_de_bloque(self):
        rnd = random.Random(11)
        largos = [n for b in (64, 128) for n in (b - 17, b - 16, b - 9, b - 8, b - 1, b, b + 1, 2 * b - 17, 2 * b - 9, 2 * b - 1, 2 * b, 2 * b + 1, 3 * b)]
        self.comparar([bytes(rnd.randrange(256) for _ in range(n)) for n in largos])

    def test_bytes_extremos(self):
        self.comparar([b'\x00' * 200, b'\xff' * 200, b'\x80' * 129, bytes(range(256)) * 3])

    def test_textos_utf8(self):
        self.comparar([t.encode() for t in ['Hola, mundo', 'Canción ñandú 😀 日本', 'Ángel', '¿Qué tal? ¡Bien!', 'línea 1\nlínea 2\r\n\ttab']])

    def test_datos_grandes(self):
        rnd = random.Random(3)
        self.comparar([bytes(rnd.randrange(256) for _ in range(300_000)), b'a' * 1_000_000])

    def test_base64_de_todas_las_longitudes(self):
        rnd = random.Random(5)
        datos = [bytes(rnd.randrange(256) for _ in range(n)).hex() for n in range(0, 40)]
        res = node("console.log(JSON.stringify(e.map(h => H.base64(Uint8Array.from(Buffer.from(h, 'hex'))))))", datos)
        for h, r in zip(datos, res):
            self.assertEqual(r, base64.b64encode(bytes.fromhex(h)).decode())

    def test_mayusculas(self):
        r = node("console.log(JSON.stringify([H.hex([0, 171, 255], true), H.hex([0, 171, 255])]))", None)
        self.assertEqual(r, ['00ABFF', '00abff'])

if __name__ == '__main__':
    unittest.main()
