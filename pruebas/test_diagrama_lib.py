"""herramientas/datos/lib/diagrama.js: lectura del texto del diagrama, disposición por capas y SVG.
Se comprueban propiedades que deben cumplirse en cualquier grafo (también con 60 grafos aleatorios con ciclos, saltos de capa y componentes sueltos):
pasos dentro del dibujo y sin solaparse, flechas ortogonales que salen y llegan a sus pasos, sin atravesar otros pasos, capas coherentes con el sentido de cada flecha,
resultado repetible, y un SVG que es XML válido con todo escapado."""
import json, shutil, subprocess, tempfile, unittest, xml.etree.ElementTree as ET
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / 'herramientas' / 'datos' / 'lib' / 'diagrama.js'

def js(expr, timeout=120):
    r = subprocess.run(['node', '-e', f"const D=require({json.dumps(str(LIB))}); console.log(JSON.stringify({expr}))"], capture_output=True, text=True, timeout=timeout)
    if r.returncode: raise AssertionError(r.stderr[-1800:])
    return json.loads(r.stdout)

COMPROBAR = r"""
const D = require(%s);
function comprobar(g, d, nombre) {
  const fallos = [], caja = n => ({ x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 });
  const cajas = d.nodos.map(caja);
  d.nodos.forEach((n, i) => { const c = cajas[i]; if (c.x0 < -0.01 || c.y0 < -0.01 || c.x1 > d.ancho + 0.01 || c.y1 > d.alto + 0.01) fallos.push(nombre + ': el paso ' + n.texto + ' se sale del dibujo'); });
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) { const a = cajas[i], b = cajas[j]; if (a.x0 < b.x1 - 0.01 && b.x0 < a.x1 - 0.01 && a.y0 < b.y1 - 0.01 && b.y0 < a.y1 - 0.01) fallos.push(nombre + ': se solapan ' + d.nodos[i].texto + ' y ' + d.nodos[j].texto); }
  d.aristas.forEach((a, k) => {
    const o = d.nodos[a.de], t = d.nodos[a.a], p = a.puntos;
    if (p.length < 2) { fallos.push(nombre + ': la flecha ' + k + ' tiene menos de dos puntos'); return; }
    if (a.atras ? !(o.capa > t.capa) : !(o.capa < t.capa)) fallos.push(nombre + ': la capa de la flecha ' + k + ' no encaja con su sentido (' + o.capa + ' → ' + t.capa + ', atras=' + a.atras + ')');
    for (let i = 0; i + 1 < p.length; i++) {
      const dx = Math.abs(p[i].x - p[i + 1].x), dy = Math.abs(p[i].y - p[i + 1].y);
      if (dx > 1e-6 && dy > 1e-6) fallos.push(nombre + ': tramo en diagonal en la flecha ' + k);
      cajas.forEach((c, m) => {                                           // un tramo no puede cruzar el interior de un paso que no es ni su origen ni su destino
        if (m === a.de || m === a.a) return;
        const x0 = Math.min(p[i].x, p[i + 1].x), x1 = Math.max(p[i].x, p[i + 1].x), y0 = Math.min(p[i].y, p[i + 1].y), y1 = Math.max(p[i].y, p[i + 1].y);
        if (x0 < c.x1 - 0.5 && x1 > c.x0 + 0.5 && y0 < c.y1 - 0.5 && y1 > c.y0 + 0.5) fallos.push(nombre + ': la flecha ' + k + ' (' + o.texto + ' → ' + t.texto + ') atraviesa el paso ' + d.nodos[m].texto);
      });
    }
    const co = caja(o), ct = caja(t), ini = p[0], fin = p[p.length - 1], eps = 1.01;
    const sobre = (c, q) => q.x >= c.x0 - eps && q.x <= c.x1 + eps && q.y >= c.y0 - eps && q.y <= c.y1 + eps;
    if (!sobre(co, ini)) fallos.push(nombre + ': la flecha ' + k + ' no sale de su paso de origen');
    if (!sobre(ct, fin)) fallos.push(nombre + ': la flecha ' + k + ' no llega a su paso de destino');
    p.forEach(q => { if (q.x < -0.01 || q.x > d.ancho + 0.01 || q.y < -0.01 || q.y > d.alto + 0.01) fallos.push(nombre + ': un punto de la flecha ' + k + ' queda fuera del dibujo'); });
  });
  return fallos;
}
module.exports = { comprobar };
""" % json.dumps(str(LIB))

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class AnalisisTest(unittest.TestCase):
    def test_flechas_cadenas_y_etiquetas(self):
        g = js('D.analizar("Inicio -> Leer -> ¿Es válido? -> Guardar | Sí\\n¿Es válido? -> Error | No\\n# un comentario\\n\\nError -> Leer\\nGuardar -> Fin")')
        self.assertEqual([(n['texto'], n['forma']) for n in g['nodos']], [('Inicio', 'terminador'), ('Leer', 'proceso'), ('¿Es válido?', 'decision'), ('Guardar', 'proceso'), ('Error', 'proceso'), ('Fin', 'terminador')])
        self.assertEqual([(a['de'], a['a'], a['etiqueta']) for a in g['aristas']], [(0, 1, ''), (1, 2, ''), (2, 3, 'Sí'), (2, 4, 'No'), (4, 1, ''), (3, 5, '')])
        self.assertEqual((g['errores'], g['avisos']), ([], []))
        self.assertEqual([a['linea'] for a in g['aristas']], [1, 1, 1, 2, 5, 6])

    def test_formas_explicitas_y_identidad_de_pasos(self):
        g = js('D.analizar("(Empezar) -> /Pedir nombre/ -> {Mayor de edad} -> [Fin]\\nempezar -> pedir   NOMBRE\\nA → B --> C")')
        self.assertEqual([(n['texto'], n['forma']) for n in g['nodos'][:4]], [('Empezar', 'terminador'), ('Pedir nombre', 'entrada'), ('Mayor de edad', 'decision'), ('Fin', 'proceso')], 'las marcas mandan sobre la deducción: [Fin] es un proceso')
        self.assertEqual(len(g['nodos']), 7, 'mismo paso aunque cambien mayúsculas y espacios'); self.assertEqual(len(g['aristas']), 3 + 1 + 2 - 1, 'una conexión repetida no se duplica')
        self.assertTrue(any('ya estaba' in a for a in g['avisos']))
        self.assertEqual(js('D.analizar("Fin\\nFin -> (Fin)").nodos[0].forma'), 'terminador', 'una marca explícita posterior fija la forma')
        self.assertEqual(js('D.analizar("Revisar\\n").nodos.length'), 1); self.assertEqual(js('D.analizar("Revisar").aristas.length'), 0)

    def test_errores_y_avisos(self):
        g = js('D.analizar("A ->\\n-> B\\nC -> D")'); self.assertEqual(len(g['errores']), 2); self.assertIn('Línea 1: falta el texto después de la flecha', g['errores'][0]); self.assertIn('Línea 2: falta el texto antes', g['errores'][1])
        g = js('D.analizar("A -> A\\nA -> B")'); self.assertEqual(len(g['aristas']), 1); self.assertIn('apunta a sí mismo', g['avisos'][0])
        g = js('D.analizar("A -> B | ' + 'x' * 60 + '")'); self.assertEqual(len(g['aristas'][0]['etiqueta']), 40)
        g = js('D.analizar("' + 'y' * 200 + ' -> B")'); self.assertEqual(len(g['nodos'][0]['texto']), 120); self.assertTrue(g['avisos'])
        g = js('D.analizar(Array.from({length: 160}, (_, i) => "n" + i + " -> n" + (i + 1)).join("\\n"))'); self.assertTrue(any('máximo es 150' in e for e in g['errores']))
        self.assertEqual(js('D.analizar("").nodos.length'), 0); self.assertEqual(js('D.analizar("  \\n # solo comentario").nodos.length'), 0)
        self.assertEqual(js('D.analizar("a | b -> c").nodos.map(n => n.texto)'), ['a | b', 'c'], 'una barra antes de la flecha es parte del texto')

    def test_formas_deducidas(self):
        t = js('D.analizar("Start -> End\\n¿Ok? -> ¿Seguro")').get('nodos'); self.assertEqual([n['forma'] for n in t], ['terminador', 'terminador', 'decision', 'decision'])
        self.assertEqual(js('D.analizar("¿Sí o no? -> x").nodos[0].forma'), 'decision'); self.assertEqual(js('D.analizar("Qué hacer? -> x").nodos[0].forma'), 'decision')

    def test_envolver(self):
        self.assertEqual(js('D.envolver("uno dos tres cuatro", t => t.length * 10, 100)'), ['uno dos', 'tres', 'cuatro'])
        l = js('D.envolver("Procesar la solicitud de reembolso del cliente", t => t.length * 8, 160)'); self.assertTrue(all(len(x) * 8 <= 160 for x in l)); self.assertEqual(' '.join(l), 'Procesar la solicitud de reembolso del cliente')
        l = js('D.envolver("supercalifragilisticoespialidosisimo", t => t.length * 8, 100)'); self.assertTrue(len(l) > 1 and ''.join(l) == 'supercalifragilisticoespialidosisimo')

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class DisposicionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dir = tempfile.mkdtemp(); cls.comprobador = Path(cls.dir) / 'comprobar.js'; cls.comprobador.write_text(COMPROBAR)

    def revisar(self, codigo_js):
        r = subprocess.run(['node', '-e', f"const D=require({json.dumps(str(LIB))}); const {{comprobar}}=require({json.dumps(str(self.comprobador))}); {codigo_js}"], capture_output=True, text=True, timeout=180)
        if r.returncode: raise AssertionError(r.stderr[-2000:])
        return json.loads(r.stdout)

    def test_ejemplo_clasico(self):
        r = self.revisar('''const g = D.analizar("Inicio -> Leer datos -> ¿Datos válidos?\\n¿Datos válidos? -> Procesar | Sí\\n¿Datos válidos? -> Mostrar error | No\\nMostrar error -> Leer datos\\nProcesar -> Fin"); const d = D.disponer(g);
          console.log(JSON.stringify({ fallos: comprobar(g, d, 'clasico'), capas: d.capas, cruces: d.cruces, por: d.nodos.map(n => [n.texto, n.capa]), atras: d.aristas.map(a => a.atras), etiquetas: d.aristas.filter(a => a.etiqueta).map(a => a.etiqueta) }))''')
        self.assertEqual(r['fallos'], []); self.assertEqual(r['capas'], 5); self.assertEqual(r['cruces'], 0)
        self.assertEqual(r['por'], [['Inicio', 0], ['Leer datos', 1], ['¿Datos válidos?', 2], ['Procesar', 3], ['Mostrar error', 3], ['Fin', 4]])
        self.assertEqual(r['atras'], [False, False, False, False, True, False], 'solo la flecha que vuelve a «Leer datos» es de retorno'); self.assertEqual(r['etiquetas'], ['Sí', 'No'])

    def test_arbol_sin_cruces_y_centrado(self):
        r = self.revisar('''const g = D.analizar("R -> A\\nR -> B\\nR -> C\\nA -> A1\\nA -> A2\\nB -> B1\\nC -> C1\\nC -> C2"); const d = D.disponer(g);
          const x = Object.fromEntries(d.nodos.map(n => [n.texto, n.x])); console.log(JSON.stringify({ fallos: comprobar(g, d, 'arbol'), cruces: d.cruces, raizEntre: x.R >= x.A && x.R <= x.C, hijosOrdenados: x.A1 < x.A2 && x.A2 < x.B1 && x.B1 < x.C1 && x.C1 < x.C2 }))''')
        self.assertEqual((r['fallos'], r['cruces'], r['raizEntre'], r['hijosOrdenados']), ([], 0, True, True))

    def test_flecha_que_salta_capas(self):
        r = self.revisar('''const g = D.analizar("A -> B -> C -> D -> E\\nA -> E | atajo"); const d = D.disponer(g);
          const a = d.aristas[d.aristas.length - 1]; console.log(JSON.stringify({ fallos: comprobar(g, d, 'salto'), capas: d.capas, vertices: a.puntos.length, orto: a.puntos.every((p, i) => !i || p.x === a.puntos[i - 1].x || p.y === a.puntos[i - 1].y) }))''')
        self.assertEqual(r['fallos'], []); self.assertEqual(r['capas'], 5); self.assertGreaterEqual(r['vertices'], 4, 'el atajo rodea los pasos intermedios'); self.assertTrue(r['orto'])

    def test_ciclos_y_componentes_sueltos(self):
        r = self.revisar('''const casos = ["A -> B -> C -> A", "A -> B\\nB -> A", "X -> Y\\nP -> Q -> R\\nSuelto", "A -> B\\nA -> C\\nB -> D\\nC -> D\\nD -> A", "solo"];
          console.log(JSON.stringify(casos.map((t, i) => { const g = D.analizar(t), d = D.disponer(g); return { f: comprobar(g, d, 'caso' + i), capas: d.capas, ancho: d.ancho > 0 && d.alto > 0 }; })))''')
        for x in r: self.assertEqual(x['f'], []); self.assertTrue(x['ancho'])
        self.assertEqual([x['capas'] for x in r], [3, 2, 3, 3, 1])

    def test_vacio_y_determinista(self):
        self.assertEqual(js('D.disponer(D.analizar("")).nodos.length'), 0)
        a = js('D.disponer(D.analizar("A -> B -> C\\nA -> C\\nC -> A"))'); b = js('D.disponer(D.analizar("A -> B -> C\\nA -> C\\nC -> A"))'); self.assertEqual(a, b)

    def test_grafos_aleatorios(self):
        r = self.revisar('''let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
          const malos = []; let total = 0;
          for (let caso = 0; caso < 60; caso++) {
            const n = 2 + Math.floor(rnd() * 28), m = Math.floor(n * (0.6 + rnd() * 1.4)), lineas = [];
            for (let k = 0; k < m; k++) { const a = Math.floor(rnd() * n), b = Math.floor(rnd() * n); lineas.push((rnd() < 0.2 ? '¿Paso ' + a + ' con un texto algo largo para envolver? -> ' : 'Paso ' + a + ' -> ') + 'Paso ' + b + (rnd() < 0.3 ? ' | sí' : '')); }
            for (let k = 0; k < 2; k++) lineas.push('Suelto ' + caso + k);
            const g = D.analizar(lineas.join('\\n')), d = D.disponer(g); total += g.nodos.length;
            comprobar(g, d, 'aleatorio ' + caso).forEach(f => malos.push(f));
            if (g.nodos.length !== d.nodos.length || g.aristas.length !== d.aristas.length) malos.push('aleatorio ' + caso + ': cambia el número de pasos o de flechas');
          }
          console.log(JSON.stringify({ malos: malos.slice(0, 8), total }))''')
        self.assertEqual(r['malos'], []); self.assertGreater(r['total'], 500)

    def test_grafo_grande_rapido(self):
        r = self.revisar('''let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; const l = [];
          for (let i = 0; i < 149; i++) { l.push('n' + i + ' -> n' + (i + 1)); if (rnd() < 0.5) l.push('n' + i + ' -> n' + Math.min(149, i + 2 + Math.floor(rnd() * 6))); if (rnd() < 0.1) l.push('n' + (i + 1) + ' -> n' + Math.floor(rnd() * i)); }
          const t0 = Date.now(), g = D.analizar(l.join('\\n')), d = D.disponer(g), ms = Date.now() - t0;
          console.log(JSON.stringify({ nodos: g.nodos.length, errores: g.errores, ms, fallos: comprobar(g, d, 'grande').slice(0, 5) }))''')
        self.assertEqual(r['errores'], []); self.assertEqual(r['fallos'], []); self.assertLess(r['ms'], 8000, f"tardó {r['ms']} ms")

    def test_svg_valido_y_escapado(self):
        svg = js('(() => { const g = D.analizar("Inicio -> ¿a < b & \\"c\\"? | Sí & <no>\\n¿a < b & \\"c\\"? -> Fin"); return D.svg(D.disponer(g), { titulo: "Mi <diagrama> & \\"cosas\\"" }); })()')
        raiz = ET.fromstring(svg); ns = '{http://www.w3.org/2000/svg}'
        self.assertEqual(raiz.tag, ns + 'svg'); self.assertEqual(raiz.find(ns + 'title').text, 'Mi <diagrama> & "cosas"')
        self.assertEqual(len(raiz.findall(f'.//{ns}g')), 3); self.assertEqual(len(raiz.findall(f'.//{ns}path[@class="dg-flecha"]')), 2)
        self.assertEqual(raiz.find(f'.//{ns}text[@class="dg-etiqueta"]').text, 'Sí & <no>')
        self.assertIn('¿a < b & "c"?', ''.join(t.text for t in raiz.iter(ns + 'tspan')).replace('¿a <', '¿a <'))
        self.assertNotIn('http://', svg.replace('http://www.w3.org/2000/svg', ''), 'sin recursos externos')
        self.assertEqual(raiz.get('role'), 'img'); self.assertTrue(raiz.get('viewBox').startswith('0 0 '))

if __name__ == '__main__': unittest.main()
