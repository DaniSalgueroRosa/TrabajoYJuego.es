"""herramientas/datos/lib/barras.js frente a fuentes independientes: las tablas y las barras de reportlab, un descodificador propio de Code 128 con el mínimo de símbolos calculado aparte,
y el lector de códigos de barras de OpenCV sobre imágenes dibujadas con las formas que produce la biblioteca."""
import json, random, re, subprocess, unittest
from pathlib import Path

try:
    import cv2
    import numpy as np
    from reportlab.graphics.barcode import code128 as rl128, eanbc
    from reportlab.graphics.shapes import Rect
    FALTA = None
except ImportError as e:  # pragma: no cover
    FALTA = str(e)

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'barras.js'


def node(js):
    r = subprocess.run(['node', '-e', f"const B = require({json.dumps(str(LIB))}); " + js], capture_output=True, text=True, timeout=300)
    if r.returncode:
        raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout)


def control_ref(cifras):
    """Dígito de control con los pesos de la especificación GS1, de izquierda a derecha: 12 cifras 1,3,1,3…; 11 y 7 cifras 3,1,3,1…"""
    pesos = {12: [1, 3] * 6, 11: [3, 1] * 5 + [3], 7: [3, 1] * 3 + [3]}[len(cifras)]
    s = sum(int(d) * p for d, p in zip(cifras, pesos))
    return (10 - s % 10) % 10


def modulos_reportlab(w):
    """Cadena de 0 y 1 con las barras que dibuja un widget de reportlab (barWidth 1, sin zonas blancas)."""
    rects = [s for s in w.draw().contents if isinstance(s, Rect)][1:]
    ancho = int(round(max(r.x + r.width for r in rects)))
    m = ['0'] * ancho
    for r in rects:
        for k in range(int(round(r.x)), int(round(r.x + r.width))):
            m[k] = '1'
    return ''.join(m)


def ancho_a_digitos(patron):
    return ''.join(str('abcd'.index(c.lower()) + 1) for c in patron)


# ------------------------------------------------------------ descodificador independiente de Code 128
def tabla128():
    return {ancho_a_digitos(p): v for v, p in rl128._patterns.items()}


def decodificar128(modulos):
    anchos = [len(g) for g in re.findall(r'1+|0+', modulos)]
    assert modulos[0] == '1' and modulos[-1] == '1'
    t = tabla128()
    simbolos = []
    i = 0
    while len(anchos) - i > 7:
        simbolos.append(t[''.join(map(str, anchos[i:i + 6]))])
        i += 6
    assert ''.join(map(str, anchos[i:])) == '2331112', 'parada incorrecta'
    simbolos.append(106)
    return simbolos


def texto_de_simbolos(simbolos):
    assert simbolos[0] in (104, 105) and simbolos[-1] == 106
    suma = simbolos[0] + sum(i * v for i, v in enumerate(simbolos[1:-2], 1))
    assert suma % 103 == simbolos[-2], 'el dígito de control no cuadra'
    juego = 'B' if simbolos[0] == 104 else 'C'
    out = ''
    for v in simbolos[1:-2]:
        if juego == 'B':
            if v == 99:
                juego = 'C'
            elif v < 96:
                out += chr(v + 32)
            else:
                raise AssertionError(f'símbolo inesperado {v} en el juego B')
        else:
            if v == 100:
                juego = 'B'
            elif v < 100:
                out += '%02d' % v
            else:
                raise AssertionError(f'símbolo inesperado {v} en el juego C')
    return out


def minimo_simbolos(texto):
    """Menor número de símbolos de dato y de cambio de juego (sin contar inicio, control ni parada), por programación dinámica hacia atrás."""
    n = len(texto)
    INF = 10 ** 9
    f = {}

    def par(i):
        return i + 1 < n and texto[i].isdigit() and texto[i + 1].isdigit()

    def dato_b(i):
        return 1 + f[('B', i + 1)]

    def dato_c(i):
        return 1 + f[('C', i + 2)] if par(i) else INF

    f[('B', n)] = f[('C', n)] = 0
    f[('B', n + 1)] = f[('C', n + 1)] = INF
    for i in range(n - 1, -1, -1):
        f[('B', i)] = min(dato_b(i), 1 + dato_c(i))
        f[('C', i)] = min(dato_c(i), 1 + dato_b(i))
    return min(dato_b(0), dato_c(0))


@unittest.skipIf(FALTA, f'faltan dependencias de prueba: {FALTA}')
class TestBarras(unittest.TestCase):
    def test_tablas_ean_como_reportlab(self):
        t = node('console.log(JSON.stringify(B.TABLAS))')
        self.assertEqual(t['L'], list(eanbc.Ean13BarcodeWidget._left[0]))
        self.assertEqual(t['G'], list(eanbc.Ean13BarcodeWidget._left[1]))
        self.assertEqual(t['R'], list(eanbc.Ean13BarcodeWidget._right))
        par = [''.join('LG'[x] for x in eanbc.Ean13BarcodeWidget._lhconvert[str(d)]) for d in range(10)]
        self.assertEqual(t['PARIDAD'], par)

    def test_tabla_code128_como_reportlab(self):
        t = node('console.log(JSON.stringify(B.TABLAS.CODE128))')
        self.assertEqual(len(t), 107)
        self.assertEqual(t, [ancho_a_digitos(rl128._patterns[v]) for v in range(107)])
        for p in t[:106]:  # seis anchos que suman 11 módulos: tres barras y tres espacios
            self.assertEqual(sum(map(int, p)), 11)
            self.assertEqual(sum(int(c) for c in p[0::2]) % 2, 0)
        self.assertEqual(len(set(t)), 107)

    def test_digito_de_control(self):
        conocidos = {'400638133393': 1, '590123412345': 7, '9638507': 4, '03600029145': 2, '978030640615': 7, '00000000000': 0, '0000000': 0}
        rnd = random.Random(7)
        casos = list(conocidos) + [''.join(rnd.choice('0123456789') for _ in range(rnd.choice([7, 11, 12]))) for _ in range(3000)]
        r = node(f"console.log(JSON.stringify({json.dumps(casos)}.map(c => B.control(c))))")
        for c, v in zip(casos, r):
            self.assertEqual(v, control_ref(c), c)
        for c, v in conocidos.items():
            self.assertEqual(control_ref(c), v, c)

    def test_ean13_ean8_y_upca_como_reportlab(self):
        rnd = random.Random(11)
        d13 = [''.join(rnd.choice('0123456789') for _ in range(12)) for _ in range(400)] + ['400638133393', '000000000000', '999999999999', '012345678901']
        d8 = [''.join(rnd.choice('0123456789') for _ in range(7)) for _ in range(200)] + ['9638507', '0000000']
        d11 = [''.join(rnd.choice('0123456789') for _ in range(11)) for _ in range(200)] + ['03600029145', '00000000000']
        js = (f"const o = {{ ean13: {json.dumps(d13)}.map(c => B.generar('ean13', c).modulos), ean8: {json.dumps(d8)}.map(c => B.generar('ean8', c).modulos), "
              f"upca: {json.dumps(d11)}.map(c => B.generar('upca', c).modulos) }}; console.log(JSON.stringify(o));")
        r = node(js)
        for c, m in zip(d13, r['ean13']):
            self.assertEqual(m, modulos_reportlab(eanbc.Ean13BarcodeWidget(c, barWidth=1, humanReadable=0, lquiet=0, rquiet=0)), c)
        for c, m in zip(d8, r['ean8']):
            self.assertEqual(m, modulos_reportlab(eanbc.Ean8BarcodeWidget(c, barWidth=1, humanReadable=0, lquiet=0, rquiet=0)), c)
        for c, m in zip(d11, r['upca']):  # un UPC-A es un EAN-13 con un cero delante
            self.assertEqual(m, modulos_reportlab(eanbc.Ean13BarcodeWidget('0' + c, barWidth=1, humanReadable=0, lquiet=0, rquiet=0)), c)
            self.assertEqual(len(m), 95)

    def test_entradas_con_control_y_errores(self):
        r = node("""
          const g = (t, x) => { try { const c = B.generar(t, x); return { texto: c.texto, control: c.control, calculado: c.calculado }; } catch (e) { return { error: e.message }; } };
          console.log(JSON.stringify([g('ean13', '4006381333931'), g('ean13', '400 638-133393 1'), g('ean13', '400638133393'), g('ean13', '4006381333930'), g('ean13', '12345'), g('ean13', '40063813339x'),
            g('ean8', '96385074'), g('ean8', '9638507'), g('upca', '036000291452'), g('upca', '036000291453'), g('upca', ''), g('code128', ''), g('code128', 'año'), g('code128', 'a'.repeat(81)), g('code128', 'a'.repeat(80)), g('qr', '1')]));
        """)
        self.assertEqual(r[0], {'texto': '4006381333931', 'control': '1', 'calculado': False})
        self.assertEqual(r[1], {'texto': '4006381333931', 'control': '1', 'calculado': False})
        self.assertEqual(r[2], {'texto': '4006381333931', 'control': '1', 'calculado': True})
        self.assertIn('debería ser 1', r[3]['error'])
        self.assertIn('tiene 12 cifras', r[4]['error'])
        self.assertIn('«x»', r[5]['error'])
        self.assertEqual(r[6]['texto'], '96385074')
        self.assertEqual(r[7], {'texto': '96385074', 'control': '4', 'calculado': True})
        self.assertEqual(r[8], {'texto': '036000291452', 'control': '2', 'calculado': False})
        self.assertIn('debería ser 2', r[9]['error'])
        self.assertIn('Escribe el número', r[10]['error'])
        self.assertIn('Escribe el texto', r[11]['error'])
        self.assertIn('«ñ»', r[12]['error'])
        self.assertIn('80 caracteres', r[13]['error'])
        self.assertEqual(r[14]['texto'], 'a' * 80)
        self.assertIn('desconocido', r[15]['error'])

    def test_code128_como_reportlab_en_casos_sin_ambiguedad(self):
        # sin pares de cifras: solo cabe el juego B, y reportlab da los mismos símbolos
        textos = ['ABC123', 'Hola mundo', 'a1b2c3', 'X-1', '~!@#', 'Z', 'The quick brown fox 5 jumps 7']
        r = node(f"console.log(JSON.stringify({json.dumps(textos)}.map(t => B.generar('code128', t).simbolos)))")
        for t, s in zip(textos, r):
            c = rl128.Code128(t, checksum=1)
            c.validate()
            c.encode()
            self.assertEqual(s, list(c.encoded), t)

    def test_code128_se_descodifica_y_usa_el_minimo_de_simbolos(self):
        rnd = random.Random(5)
        alfabeto = [chr(c) for c in range(32, 127)]
        textos = []
        for _ in range(1500):
            n = rnd.randint(1, 40)
            t = ''
            while len(t) < n:
                t += ''.join(rnd.choice('0123456789') for _ in range(rnd.randint(1, 12))) if rnd.random() < 0.5 else ''.join(rnd.choice(alfabeto) for _ in range(rnd.randint(1, 6)))
            textos.append(t[:80])
        textos += ['1', '12', '123', '1234', '12345', '123456', 'A1234', 'A12345', '1234A', '12345A', 'AB1234CD', '0' * 80, '9' * 79, ' ', '~', '00', '0123456789012345678901234567890123456789']
        js = f"console.log(JSON.stringify({json.dumps(textos)}.map(t => {{ const c = B.generar('code128', t); return [c.modulos, c.simbolos, c.control, c.anchoModulos]; }})))"
        r = node(js)
        for t, (m, s, ctl, ancho) in zip(textos, r):
            self.assertEqual(decodificar128(m), s, t)
            self.assertEqual(texto_de_simbolos(s), t)
            self.assertEqual(int(ctl), s[-2])
            self.assertEqual(ancho, 11 * (len(s) - 1) + 13)
            self.assertEqual(len(s) - 3, minimo_simbolos(t), f'{t!r}: no usa el menor número de símbolos')

    def test_dibujo_y_svg(self):
        r = node("""
          const c = B.generar('ean13', '400638133393');
          const d = B.dibujo(c, { modulo: 2, alto: 80, texto: false });
          const s = B.aSVG(B.generar('code128', 'A&B<C'), { modulo: 1, alto: 40, color: '#102030', fondo: '#fefefe' });
          const e = B.dibujo(c, { modulo: 3, alto: 100 });
          console.log(JSON.stringify({ d: { ancho: d.ancho, alto: d.alto, n: d.rects.length, x0: d.rects[0].x, w0: d.rects[0].w, h: d.rects.map(r => r.h) }, s, e: { ancho: e.ancho, textos: e.textos.slice().sort((a, b) => a.x - b.x).map(t => t.t).join(''), n: e.textos.length, altas: e.rects.filter(r => r.h > 100).length } }));
        """)
        d = r['d']
        self.assertEqual(d['ancho'], (95 + 22) * 2)                       # 11 módulos de zona blanca a cada lado
        self.assertEqual(d['x0'], 22)
        self.assertEqual(d['w0'], 2)
        self.assertEqual(set(d['h']), {80})
        ref = modulos_reportlab(eanbc.Ean13BarcodeWidget('400638133393', barWidth=1, humanReadable=0, lquiet=0, rquiet=0))
        self.assertEqual(d['n'], len(re.findall('1+', ref)))
        self.assertEqual(r['e']['textos'], '4006381333931')
        self.assertEqual(r['e']['n'], 13)
        self.assertEqual(r['e']['ancho'], (95 + 22) * 3)
        self.assertEqual(r['e']['altas'], 6)
        s = r['s']
        self.assertTrue(s.startswith('<svg ') and s.endswith('</svg>'))
        self.assertIn('A&amp;B&lt;C', s)
        self.assertNotIn('A&B', s)
        self.assertIn('fill="#102030"', s)
        self.assertIn('fill="#fefefe"', s)
        # el camino del SVG reproduce exactamente las barras del código
        c128 = node("const c = B.generar('code128', 'A&B<C'); console.log(JSON.stringify(c.modulos))")
        camino = re.search(r' d="([^"]+)"', s).group(1)
        barras = re.findall(r'M(\d+) (\d+)h(\d+)v(\d+)h-\d+z', camino)
        m = ['0'] * len(c128)
        for x, y, w, h in barras:
            for k in range(int(x) - 11, int(x) - 11 + int(w)):
                m[k] = '1'
        self.assertEqual(''.join(m), c128)

    def test_guardas_largas(self):
        r = node("""
          const out = {};
          for (const [t, x] of [['ean13', '400638133393'], ['ean8', '9638507'], ['upca', '03600029145'], ['code128', 'ABC']]) {
            const c = B.generar(t, x), d = B.dibujo(c, { modulo: 2, alto: 80 });
            out[t] = { altas: d.rects.filter(r => r.h > 80).length, total: d.rects.length };
          }
          console.log(JSON.stringify(out));
        """)
        # EAN-13: guarda inicial (2 barras), central (2) y final (2) → 6 barras largas
        self.assertEqual(r['ean13']['altas'], 6)
        self.assertEqual(r['ean8']['altas'], 6)
        self.assertEqual(r['code128']['altas'], 0)
        # UPC-A: además la primera y la última cifra tienen las barras largas (de 3 y 4 barras)
        c = node("console.log(JSON.stringify(B.generar('upca', '03600029145').modulos))")
        self.assertGreater(r['upca']['altas'], 6)
        primera = len(re.findall('1+', c[3:10]))
        ultima = len(re.findall('1+', c[85:92]))
        self.assertEqual(r['upca']['altas'], 6 + primera + ultima)

    def _imagen(self, tipo, texto, modulo=3, alto=120, borde=30):
        """Imagen en gris con las barras tal como las dibuja la biblioteca y las cuatro esquinas del código con sus zonas blancas."""
        d = node(f"const c = B.generar({json.dumps(tipo)}, {json.dumps(texto)}); console.log(JSON.stringify(B.dibujo(c, {{ modulo: {modulo}, alto: {alto}, texto: false, margen: 12 }})))")
        img = np.full((d['alto'], d['ancho']), 255, np.uint8)
        for r in d['rects']:
            img[r['y']:r['y'] + r['h'], r['x']:r['x'] + r['w']] = 0
        img = cv2.copyMakeBorder(img, borde, borde, borde, borde, cv2.BORDER_CONSTANT, value=255)
        x1, y1, x2, y2 = borde, borde, borde + d['ancho'], borde + d['alto']      # el recuadro incluye las zonas blancas, como en una foto
        return img, np.array([[[x1, y1], [x2, y1], [x2, y2], [x1, y2]]], dtype=np.float32)

    def test_lector_de_opencv_ean13_ean8_y_upca(self):
        det = cv2.barcode.BarcodeDetector()
        rnd = random.Random(21)
        casos = [('ean13', ''.join(rnd.choice('0123456789') for _ in range(12))) for _ in range(60)] + [('ean8', ''.join(rnd.choice('0123456789') for _ in range(7))) for _ in range(40)] \
            + [('upca', ''.join(rnd.choice('0123456789') for _ in range(11))) for _ in range(40)] + [('ean13', '400638133393'), ('ean13', '590123412345'), ('ean13', '000000000000'), ('ean8', '9638507'), ('upca', '03600029145')]
        malos = []
        tipos_leidos = set()
        for tipo, datos in casos:
            esperado = node(f"console.log(JSON.stringify(B.generar({json.dumps(tipo)}, {json.dumps(datos)}).texto))")
            for modulo in (2, 3):
                img, pts = self._imagen(tipo, datos, modulo=modulo)
                ok, leidos, tipos = det.decodeWithType(img, pts)
                tipos_leidos.update(tipos)
                # un EAN-13 que empieza por 0 y un UPC-A son el mismo símbolo: el lector puede devolver cualquiera de los dos nombres
                igual = ok and len(leidos) == 1 and (leidos[0] == esperado if tipo == 'ean8' else leidos[0].zfill(13) == esperado.zfill(13))
                if not igual:
                    malos.append((tipo, modulo, esperado, leidos))
        self.assertEqual(malos, [], f'OpenCV no leyó {len(malos)} de {len(casos) * 2}: {malos[:5]}')
        self.assertTrue({'EAN_13', 'EAN_8'} <= set(tipos_leidos), tipos_leidos)

    def test_lector_de_opencv_no_acepta_un_codigo_alterado(self):
        """Control negativo: con un módulo cambiado el lector no devuelve el mismo número (así la prueba anterior comprueba algo)."""
        det = cv2.barcode.BarcodeDetector()
        img, pts = self._imagen('ean13', '400638133393')
        ok, leidos, _ = det.decodeWithType(img, pts)
        self.assertEqual(leidos, ('4006381333931',))
        x = 30 + 12 * 3 + 20 * 3                      # un módulo del cuerpo del código
        img[:, x:x + 3] = 255 - img[:, x:x + 3]
        ok, leidos, _ = det.decodeWithType(img, pts)
        self.assertNotIn('4006381333931', leidos)


if __name__ == '__main__':
    unittest.main()
