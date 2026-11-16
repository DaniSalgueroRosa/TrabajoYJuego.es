"""herramientas/datos/lib/palabras-es.js: la lista de palabras para frases de contraseña y nombres de usuario. Comprueba que no hay repetidas, que solo usa a-z, que las longitudes son de 3 a 9,
que tiene más de mil palabras, que cada categoría está incluida en la lista, que no contiene palabras que llevarían tilde y que no hay palabras de las que descartamos a mano."""
import json, re, shutil, subprocess, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'palabras-es.js'

def datos():
    r = subprocess.run(['node', '-e', f"console.log(JSON.stringify(require({json.dumps(str(LIB))})))"], capture_output=True, text=True, timeout=60)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class PalabrasTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.d = datos(); cls.lista = cls.d['lista']

    def test_forma(self):
        self.assertGreaterEqual(len(self.lista), 1000)
        self.assertEqual(len(set(self.lista)), len(self.lista), 'hay palabras repetidas')
        self.assertEqual(self.lista, sorted(self.lista))
        malas = [w for w in self.lista if not re.fullmatch(r'[a-z]{3,9}', w)]
        self.assertEqual(malas, [])

    def test_categorias(self):
        esperadas = {'animales', 'naturaleza', 'cocina', 'casa', 'objetos', 'oficios', 'verbos', 'adjetivos', 'cuerpo', 'lugares', 'tiempo', 'ciencia', 'musica', 'deportes', 'ropa', 'comunes'}
        self.assertEqual(set(self.d['categorias']), esperadas)
        todas = set()
        for c, ws in self.d['categorias'].items():
            self.assertGreaterEqual(len(ws), 25, c)
            self.assertEqual(len(set(ws)), len(ws), c); self.assertTrue(set(ws) <= set(self.lista), c); todas |= set(ws)
        self.assertEqual(todas, set(self.lista))

    def test_sin_palabras_que_llevarian_tilde(self):
        # palabras terminadas en -cion, -sion, -ia/-io tónico habituales, esdrújulas y agudas en n/s que no deben aparecer sin tilde
        prohibidas = {'cancion', 'corazon', 'camion', 'balcon', 'jardin', 'sillon', 'colchon', 'leon', 'raton', 'pulmon', 'melon', 'atun', 'sofa', 'pure', 'cafe', 'bebe', 'frio', 'vacio', 'dia', 'rio', 'lampara', 'platano', 'maquina', 'musica', 'telefono',
                      'arbol', 'facil', 'lapiz', 'azucar', 'carcel', 'angel', 'tunel', 'sabado', 'medico', 'brujula', 'mascara', 'opera', 'trio', 'limite', 'epoca', 'sandia', 'rabano', 'judia', 'guia', 'esqui', 'compas', 'mastil', 'peonia', 'magico'}
        self.assertEqual(sorted(set(self.lista) & prohibidas), [])
        self.assertEqual([w for w in self.lista if re.search(r'(cion|sion)$', w)], [])
        # las acabadas en n deben ser monosílabos o llanas conocidas (todas las demás habrían llevado tilde)
        llanas_n = {'pan', 'fin', 'plan', 'flan', 'examen', 'volumen', 'imagen', 'orden', 'origen'}
        self.assertEqual([w for w in self.lista if w.endswith('n') and w not in llanas_n], [])

    def test_descartes_a_mano(self):
        for w in ('rock', 'golf', 'hockey', 'sprint', 'surf', 'jersey', 'una', 'fe', 'cerca', 'bien'): self.assertNotIn(w, self.lista)

    def test_palabras_inofensivas(self):
        # lista corta de palabras que no queremos en frases de contraseña ni en nombres de usuario
        malsonantes = {'puta', 'puto', 'mierda', 'culo', 'polla', 'coño', 'cono', 'joder', 'follar', 'zorra', 'nazi', 'sida', 'cancer', 'droga', 'muerte', 'asesino', 'violar'}
        self.assertEqual(sorted(set(self.lista) & malsonantes), [])

if __name__ == '__main__':
    unittest.main()
