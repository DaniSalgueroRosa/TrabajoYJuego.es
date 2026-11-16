"""herramientas/datos/lib/sinonimos.js: el diccionario propio de sinónimos y antónimos. Comprueba la forma de los datos (sin repetidos, sin palabras que sean sinónimo y antónimo a la vez), la simetría de las relaciones,
la búsqueda sin tildes, el reconocimiento de plurales, femeninos y verbos conjugados, las sugerencias cuando no hay resultado y la adaptación de número, género y mayúsculas."""
import json, shutil, subprocess, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'sinonimos.js'

def js(expr):
    r = subprocess.run(['node', '-e', f"const S=require({json.dumps(str(LIB))}); console.log(JSON.stringify({expr}))"], capture_output=True, text=True, timeout=60)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class SinonimosTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.g = js('S.grupos()'); cls.est = js('S.estadisticas()')

    def test_forma_de_los_datos(self):
        self.assertGreaterEqual(len(self.g), 700); self.assertGreaterEqual(self.est['palabras'], 4500)
        for i, g in enumerate(self.g):
            self.assertGreaterEqual(len(g['s']), 2, g)
            for w in g['s'] + g['a']:
                self.assertEqual(w, w.strip(), g); self.assertEqual(w, w.lower(), w); self.assertTrue(w, g)
        malos = js("S.grupos().map((g, i) => [i, g.s.concat(g.a).map(S.clave)]).filter(x => new Set(x[1]).size !== x[1].length).map(x => x[0])")
        self.assertEqual(malos, [], 'hay palabras repetidas o que son sinónimo y antónimo a la vez en los grupos indicados')

    def test_simetria_de_sinonimos_y_antonimos(self):
        fallos = js("""(() => { const f = []; S.grupos().forEach((g, i) => {
            if (S.buscar(g.s[1]).sinonimos.indexOf(g.s[0]) < 0) f.push(['sin', g.s[0], g.s[1]]);
            if (g.a.length) { if (S.buscar(g.s[0]).antonimos.indexOf(g.a[0]) < 0) f.push(['ant', g.s[0], g.a[0]]); if (S.buscar(g.a[0]).antonimos.indexOf(g.s[0]) < 0) f.push(['ant2', g.a[0], g.s[0]]); } }); return f; })()""")
        self.assertEqual(fallos, [])

    def test_sin_tildes_ni_mayusculas(self):
        a = js('S.buscar("rápido")'); b = js('S.buscar("RAPIDO")'); c = js('S.buscar("  Rápido ")')
        self.assertEqual(a['sinonimos'], b['sinonimos']); self.assertEqual(a['sinonimos'], c['sinonimos']); self.assertIn('veloz', a['sinonimos']); self.assertIn('lento', a['antonimos'])

    def test_flexiones(self):
        casos = [('bonitas', 'bonito', 'plural'), ('trabajadora', 'trabajador', 'femenino'), ('luces', 'luz', 'plural'), ('felices', 'feliz', 'plural'), ('tocaba', 'tocar', 'conjugacion'), ('pienso', 'pensar', 'conjugacion'), ('buscando', 'buscar', 'conjugacion'), ('quiero', 'querer', 'conjugacion')]
        for w, base, via in casos:
            r = js(f'S.buscar({json.dumps(w)})'); self.assertEqual((r['base'], r['via']), (base, via), w)
        self.assertNotIn('base', js('S.buscar("tocaba", {sinVerbos: true})'))

    def test_sugerencias(self):
        r = js('S.buscar("hermsoo")'); self.assertNotIn('base', r); self.assertIn('hermoso', r['sugerencias'])
        self.assertEqual(js('S.buscar("xyzzyq")')['sugerencias'], [])
        self.assertEqual(js('S.buscar("")')['sugerencias'], [])

    def test_varios_sentidos(self):
        r = js('S.buscar("claro")'); self.assertGreaterEqual(len(r['sentidos']), 2)
        self.assertIn('evidente', r['sinonimos']); self.assertIn('luminoso', r['sinonimos'])

    def test_adaptar(self):
        casos = [('bonitas', 'hermoso', 'hermosas'), ('Bonito', 'hermoso', 'Hermoso'), ('BONITO', 'hermoso', 'HERMOSO'), ('felices', 'dichoso', 'dichosos'), ('luces', 'resplandor', 'resplandores'), ('trabajadora', 'laborioso', 'laboriosa'),
                 ('canciones', 'melodía', 'melodías'), ('comunes', 'común', 'comunes'), ('ciudades', 'urbe', 'urbes')]
        for original, sin, esperado in casos:
            plural = original.lower().endswith('s'); fem = original.lower() in ('bonitas', 'trabajadora')
            r = json.dumps({'plural': plural, 'fem': fem})
            self.assertEqual(js(f'S.adaptar({json.dumps(original)}, {r}, {json.dumps(sin)})'), esperado, original)

if __name__ == '__main__': unittest.main()
