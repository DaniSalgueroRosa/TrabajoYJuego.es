"""La librería de calendario (herramientas/datos/lib/calendario.js) comparada con Python: rejilla de cada mes, semanas ISO, Pascua y festivos de 1900 a 2200."""
import calendar, json, shutil, subprocess, unittest
from datetime import date, timedelta
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'calendario.js'

def pascua(y):
    a = y % 19; b, c = divmod(y, 100); d, e = divmod(b, 4); f = (b + 8) // 25; g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30; i, k = divmod(c, 4); l = (32 + 2 * e + 2 * i - h - k) % 7; m = (a + 11 * h + 22 * l) // 451
    mes, dia = divmod(h + l - 7 * m + 114, 31)
    return date(y, mes, dia + 1)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class CalendarioTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        js = f"""const CAL = require({json.dumps(str(LIB))}); const out = {{ meses: [], festivos: {{}}, semanas: {{}} }};
for (let a = 1900; a <= 2200; a++) {{
  for (let m = 0; m < 12; m++) {{ out.meses.push([a, m, CAL.mes(a, m, true), CAL.mes(a, m, false)]); }}
  out.festivos[a] = CAL.festivos(a); out.semanas[a] = CAL.semanasDelAnio(a);
}}
process.stdout.write(JSON.stringify(out));"""
        cls.datos = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

    def test_rejilla_de_cada_mes(self):
        for a, m, lunes, domingo in self.datos['meses']:
            for datos_js, primero in ((lunes, 0), (domingo, 6)):
                esperado = calendar.Calendar(firstweekday=primero).monthdayscalendar(a, m + 1)
                obtenido = [[d or 0 for d in s['dias']] for s in datos_js['semanas']]
                self.assertEqual(obtenido, esperado, f'{a}-{m + 1} primer día {primero}')

    def test_numero_de_semana_iso_de_cada_fila(self):
        for a, m, lunes, _ in self.datos['meses']:
            primero = date(a, m + 1, 1)
            for r, s in enumerate(lunes['semanas']):
                lun = primero - timedelta(days=primero.weekday()) + timedelta(days=7 * r)
                self.assertEqual(s['iso'], lun.isocalendar()[1], f'{a}-{m + 1} fila {r}')

    def test_semanas_con_domingo_primero_no_llevan_numero(self):
        self.assertTrue(all(s['iso'] is None for s in self.datos['meses'][5][3]['semanas']))

    def test_semanas_por_ano(self):
        for a, n in self.datos['semanas'].items():
            self.assertEqual(n, date(int(a), 12, 28).isocalendar()[1], a)

    def test_festivos_nacionales_y_viernes_santo(self):
        for a, f in self.datos['festivos'].items():
            a = int(a)
            fijos = {date(a, 1, 1), date(a, 1, 6), date(a, 5, 1), date(a, 8, 15), date(a, 10, 12), date(a, 11, 1), date(a, 12, 6), date(a, 12, 8), date(a, 12, 25)}
            esperado = fijos | {pascua(a) - timedelta(days=2)}
            self.assertEqual({date.fromisoformat(k) for k in f}, esperado, a)
            self.assertEqual(len(f), 10)
        self.assertEqual(self.datos['festivos']['2026']['2026-04-03'], 'Viernes Santo')
        self.assertEqual(self.datos['festivos']['2027']['2027-03-26'], 'Viernes Santo')

if __name__ == '__main__':
    unittest.main()
