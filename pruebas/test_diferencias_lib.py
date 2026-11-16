"""herramientas/datos/lib/diferencias.js: reconstrucción de líneas de PDF y comparación línea a línea. Comprueba líneas y palabras en orden de lectura, iguales/añadidas/eliminadas, opciones de mayúsculas y espacios,
la similitud y que un documento enorme se compara por páginas sin bloquearse."""
import json, shutil, subprocess, unittest
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / 'herramientas' / 'datos' / 'lib' / 'diferencias.js'

def js(expr):
    r = subprocess.run(['node', '-e', f"const D=require({json.dumps(str(LIB))}); console.log(JSON.stringify({expr}))"], capture_output=True, text=True, timeout=120)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

def ls(*textos, p=1): return [{'t': t, 'p': p} for t in textos]

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class DiferenciasTest(unittest.TestCase):
    def comparar(self, a, b, op=None): return js(f'D.comparar({json.dumps(a)}, {json.dumps(b)}, {json.dumps(op or {})})')

    def test_lineas_en_orden_de_lectura(self):
        frag = [{'s': 'mundo', 'x': 60, 'y': 700, 'w': 30}, {'s': 'Hola', 'x': 10, 'y': 700.5, 'w': 30}, {'s': 'Segunda línea', 'x': 10, 'y': 680, 'w': 70}, {'s': 'Título', 'x': 10, 'y': 750, 'w': 40}, {'s': '', 'x': 0, 'y': 600, 'w': 0}]
        self.assertEqual(js(f'D.lineas({json.dumps(frag)})'), ['Título', 'Hola mundo', 'Segunda línea'])

    def test_no_separa_fragmentos_pegados(self):
        frag = [{'s': 'inter', 'x': 10, 'y': 700, 'w': 25}, {'s': 'nacional', 'x': 35, 'y': 700, 'w': 40}, {'s': 'hoy', 'x': 90, 'y': 700, 'w': 20}]
        self.assertEqual(js(f'D.lineas({json.dumps(frag)})'), ['internacional hoy'])

    def test_iguales(self):
        r = self.comparar(ls('a', 'b', 'c'), ls('a', 'b', 'c')); self.assertEqual([o['o'] for o in r['ops']], ['=', '=', '=']); self.assertEqual(r['metodo'], 'completo')
        self.assertEqual(js(f'D.similitud(D.comparar({json.dumps(ls("a","b"))}, {json.dumps(ls("a","b"))}).ops)'), 100)

    def test_cambio_insercion_y_borrado(self):
        r = self.comparar(ls('uno', 'dos', 'tres', 'cuatro'), ls('uno', 'DOS', 'tres', 'cinco', 'cuatro'))
        self.assertEqual([o['o'] for o in r['ops']], ['=', '-', '+', '=', '+', '='])
        self.assertEqual([o['a']['t'] for o in r['ops'] if o['o'] == '-'], ['dos']); self.assertEqual([o['b']['t'] for o in r['ops'] if o['o'] == '+'], ['DOS', 'cinco'])

    def test_extremos(self):
        r = self.comparar(ls('x', 'a', 'b'), ls('a', 'b', 'y'))
        self.assertEqual([o['o'] for o in r['ops']], ['-', '=', '=', '+'])
        self.assertEqual([(o.get('a') or o.get('b'))['t'] for o in r['ops']], ['x', 'a', 'b', 'y'])

    def test_vacios(self):
        self.assertEqual([o['o'] for o in self.comparar([], ls('a', 'b'))['ops']], ['+', '+'])
        self.assertEqual([o['o'] for o in self.comparar(ls('a'), [])['ops']], ['-'])
        self.assertEqual(self.comparar([], [])['ops'], [])

    def test_opciones(self):
        self.assertEqual([o['o'] for o in self.comparar(ls('Hola  mundo'), ls('hola mundo'))['ops']], ['-', '+'])
        self.assertEqual([o['o'] for o in self.comparar(ls('Hola  mundo'), ls('hola mundo'), {'mayus': True})['ops']], ['='])
        self.assertEqual([o['o'] for o in self.comparar(ls('a   b'), ls('a b'), {'espacios': False})['ops']], ['-', '+'])
        self.assertEqual([o['o'] for o in self.comparar(ls('a   b'), ls('a b'))['ops']], ['='])

    def test_conserva_paginas(self):
        a = [{'t': 'x', 'p': 1}, {'t': 'y', 'p': 2}]; b = [{'t': 'x', 'p': 1}, {'t': 'z', 'p': 3}]
        r = self.comparar(a, b); self.assertEqual([(o['o'], (o.get('a') or o.get('b'))['p']) for o in r['ops']], [('=', 1), ('-', 2), ('+', 3)])

    def test_palabras(self):
        r = js('D.palabras("el gato negro duerme", "el perro negro duerme mucho")')
        self.assertEqual([(o['o'], o['t']) for o in r], [('=', 'el'), ('-', 'gato'), ('+', 'perro'), ('=', 'negro'), ('=', 'duerme'), ('+', 'mucho')])

    def test_documento_enorme_se_compara_por_paginas(self):
        n = 3200
        r = js(f'''(() => {{ const n = {n}, A = [], B = [];
            for (let i = 0; i < n; i++) {{ A.push({{ t: 'a' + i, p: Math.floor(i / 40) + 1 }}); B.push({{ t: i % 2 ? 'b' + i : 'a' + i, p: Math.floor(i / 40) + 1 }}); }}
            const r = D.comparar(A, B); return {{ m: r.metodo, borradas: r.ops.filter(o => o.o === '-').length, anadidas: r.ops.filter(o => o.o === '+').length, iguales: r.ops.filter(o => o.o === '=').length }}; }})()''')
        self.assertEqual(r, {'m': 'paginas', 'borradas': n // 2, 'anadidas': n // 2, 'iguales': n // 2})

if __name__ == '__main__': unittest.main()
