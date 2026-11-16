"""herramientas/datos/lib/horario.js: preparación de la rejilla del horario semanal (horas, días visibles, carriles de actividades solapadas, avisos y texto)."""
import json, shutil, subprocess, unittest
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / 'herramientas' / 'datos' / 'lib' / 'horario.js'

def js(expr):
    r = subprocess.run(['node', '-e', f"const H=require({json.dumps(str(LIB))}); console.log(JSON.stringify({expr}))"], capture_output=True, text=True, timeout=60)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)

def prep(filas, op=None): return js(f'H.preparar({json.dumps(filas)}, {json.dumps(op or {})})')
def fila(a, ini, fin, dias, **k): return {'actividad': a, 'inicio': ini, 'fin': fin, 'dias': dias, 'lugar': k.get('lugar', ''), 'color': k.get('color', 'azul')}

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class HorarioTest(unittest.TestCase):
    def test_horas(self):
        self.assertEqual([js(f'H.aMinutos({json.dumps(t)})') for t in ('08:30', '8:05', '00:00', '23:59', '24:00', '12:60', '', 'x', None)], [510, 485, 0, 1439, None, None, None, None, None])
        self.assertEqual([js(f'H.aHora({m})') for m in (0, 485, 510, 1439)], ['00:00', '08:05', '08:30', '23:59'])

    def test_rejilla_dias_y_rango(self):
        p = prep([fila('Mates', '08:20', '09:10', [0, 2]), fila('Inglés', '10:00', '10:40', [4])])
        self.assertEqual([d['nombre'] for d in p['dias']], ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'])
        self.assertEqual((p['desde'], p['hasta']), (480, 660), 'redondea a la rejilla de 30 min: 08:00 a 11:00')
        self.assertEqual(p['marcas'][0], {'min': 480, 'etiqueta': '08:00', 'hora': True}); self.assertEqual(p['marcas'][1]['hora'], False); self.assertEqual(p['marcas'][-1]['etiqueta'], '11:00')
        lunes = p['dias'][0]['bloques'][0]
        self.assertAlmostEqual(lunes['arriba'], 20 / 180 * 100); self.assertAlmostEqual(lunes['alto'], 50 / 180 * 100)
        self.assertEqual((lunes['carril'], lunes['carriles'], lunes['izq'], lunes['ancho']), (0, 1, 0, 100))
        self.assertEqual(p['actividades'], 2)
        self.assertEqual(prep([fila('a', '08:20', '09:10', [0])], {'gran': 60})['desde'], 480); self.assertEqual(prep([fila('a', '08:20', '09:10', [0])], {'gran': 15})['desde'], 495)

    def test_fin_de_semana(self):
        self.assertEqual(len(prep([fila('a', '09:00', '10:00', [0])])['dias']), 5)
        self.assertEqual([d['nombre'] for d in prep([fila('a', '09:00', '10:00', [5])])['dias']][-1], 'Sábado')
        self.assertEqual(len(prep([fila('a', '09:00', '10:00', [0])], {'finde': True})['dias']), 7)
        self.assertEqual([d['nombre'] for d in prep([fila('a', '09:00', '10:00', [6])])['dias']], ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Domingo'])

    def test_solapes_y_carriles(self):
        p = prep([fila('A', '09:00', '11:00', [0]), fila('B', '10:00', '12:00', [0]), fila('C', '10:30', '11:30', [0]), fila('D', '12:00', '13:00', [0]), fila('E', '09:00', '10:00', [1])])
        lunes = {b['actividad']: b for b in p['dias'][0]['bloques']}
        self.assertEqual([lunes[x]['carril'] for x in 'ABCD'], [0, 1, 2, 0]); self.assertEqual([lunes[x]['carriles'] for x in 'ABCD'], [3, 3, 3, 1])
        self.assertAlmostEqual(lunes['B']['izq'], 100 / 3); self.assertAlmostEqual(lunes['B']['ancho'], 100 / 3)
        self.assertEqual(len(p['conflictos']), 3, 'A-B, A-C, B-C'); self.assertTrue(all(c['dia'] == 'Lunes' for c in p['conflictos']))
        self.assertTrue(any('El lunes se solapan «A» (09:00–11:00) y «B» (10:00–12:00).' == a for a in p['avisos']), p['avisos'])
        self.assertEqual(p['dias'][1]['bloques'][0]['carriles'], 1)
        # pegadas (una termina cuando empieza la otra) no se solapan
        q = prep([fila('A', '09:00', '10:00', [0]), fila('B', '10:00', '11:00', [0])]); self.assertEqual(q['conflictos'], []); self.assertEqual([b['carriles'] for b in q['dias'][0]['bloques']], [1, 1])

    def test_filas_invalidas(self):
        p = prep([fila('Sin hora', '', '10:00', [0]), fila('Al revés', '11:00', '10:00', [0]), fila('Igual', '10:00', '10:00', [0]), fila('Sin día', '10:00', '11:00', []), fila('', '', '', []), fila('Buena', '10:00', '11:00', [2])])
        self.assertEqual(p['actividades'], 1); self.assertEqual(len(p['avisos']), 4)
        self.assertIn('no tiene hora de inicio y de fin', p['avisos'][0]); self.assertIn('termina a las 10:00, antes o a la misma hora en que empieza (11:00)', p['avisos'][1]); self.assertIn('no tiene ningún día marcado', p['avisos'][3])
        self.assertEqual(p['avisos'][0][:17], 'La actividad 1 («')

    def test_sin_actividades_y_sin_nombre(self):
        p = prep([]); self.assertEqual((p['desde'], p['hasta'], p['actividades']), (480, 900, 0)); self.assertEqual(len(p['dias']), 5)
        self.assertEqual(prep([fila('', '09:00', '10:00', [0])])['dias'][0]['bloques'][0]['actividad'], 'Sin nombre')
        self.assertEqual(prep([fila('Noche', '22:30', '23:45', [0])])['hasta'], 1440); self.assertEqual(prep([fila('Noche', '22:30', '23:45', [0])])['marcas'][-1]['etiqueta'], '23:59')

    def test_texto_y_colores(self):
        p = prep([fila('Mates', '08:00', '09:00', [0, 2], lugar='Aula 3'), fila('Lengua', '09:00', '10:00', [0])])
        t = js(f'H.texto({json.dumps(p)}, "Mi horario")')
        self.assertEqual(t.split('\n')[0], 'Mi horario'); self.assertIn('Lunes\n  08:00–09:00  Mates (Aula 3)\n  09:00–10:00  Lengua\n', t); self.assertIn('Martes\n  (sin actividades)\n', t); self.assertTrue(t.endswith('\n') and not t.endswith('\n\n'))
        cols = js('H.COLORES')
        self.assertEqual(len(cols), 8); self.assertEqual(js('H.color("zzz").id'), 'azul')
        def lum(h):
            c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]; c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]; return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
        for c in cols:
            a, b = sorted((lum(c['fondo']), lum(c['texto'])), reverse=True); self.assertGreaterEqual((a + .05) / (b + .05), 7, c['id'])

if __name__ == '__main__': unittest.main()
