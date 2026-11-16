"""herramientas/datos/lib/numeros.js frente a una implementación independiente en Python: números a letras (miles de casos, de 0 a 30 cifras, masculino, apócope y femenino),
importes en euros, dólares y pesos, lectura de números escritos de varias maneras, números romanos (los 3999, en los dos sentidos) y letra del DNI y del NIE."""
import json, random, shutil, subprocess, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'numeros.js'

def node(js):
    r = subprocess.run(['node', '-e', f"const N = require({json.dumps(str(LIB))}); " + js], capture_output=True, text=True, timeout=300)
    if r.returncode: raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout)

# ------------------------------------------------------------ referencia independiente (recursiva, por potencias de diez)
NOM = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
       'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
DECENAS = {3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa'}
CENT_M = {1: 'ciento', 2: 'doscientos', 3: 'trescientos', 4: 'cuatrocientos', 5: 'quinientos', 6: 'seiscientos', 7: 'setecientos', 8: 'ochocientos', 9: 'novecientos'}
SING = {1: 'millón', 2: 'billón', 3: 'trillón', 4: 'cuatrillón'}
PLUR = {1: 'millones', 2: 'billones', 3: 'trillones', 4: 'cuatrillones'}

def d100(n, uno):
    if n == 1: return uno
    if n == 21: return {'uno': 'veintiuno', 'un': 'veintiún', 'una': 'veintiuna'}[uno]
    if n < 30: return NOM[n]
    t, u = divmod(n, 10)
    return DECENAS[t] + ('' if u == 0 else ' y ' + (uno if u == 1 else NOM[u]))

def d1000(n, uno, fem):
    if n == 100: return 'cien'
    c, r = divmod(n, 100)
    pal = CENT_M[c] if c else ''
    if fem and c >= 2: pal = pal[:-2] + 'as'
    if r == 0: return pal
    return (pal + ' ' if pal else '') + d100(r, uno)

def menor_millon(n, uno, fem, uno_mil):
    if n < 1000: return d1000(n, uno, fem)
    q, r = divmod(n, 1000)
    cab = 'mil' if q == 1 else d1000(q, uno_mil, fem) + ' mil'
    return cab + ('' if r == 0 else ' ' + d1000(r, uno, fem))

def letras(n, genero='m', forma='uno'):
    if n == 0: return 'cero'
    fem = genero == 'f'
    uno = 'una' if fem else ('un' if forma == 'un' else 'uno'); uno_mil = 'una' if fem else 'un'
    if n < 10 ** 6: return menor_millon(n, uno, fem, uno_mil)
    k = 1
    while 10 ** (6 * (k + 1)) <= n: k += 1
    q, r = divmod(n, 10 ** (6 * k))
    cab = 'un ' + SING[k] if q == 1 else menor_millon(q, 'un', False, 'un') + ' ' + PLUR[k]
    return cab + ('' if r == 0 else ' ' + letras(r, genero, forma))

def a_romano(n):
    m = [(1000, 'M'), (900, 'CM'), (500, 'D'), (400, 'CD'), (100, 'C'), (90, 'XC'), (50, 'L'), (40, 'XL'), (10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
    s = ''
    for v, r in m:
        s += r * (n // v); n %= v
    return s

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class LetrasTest(unittest.TestCase):
    def test_ejemplos_conocidos(self):
        esperado = {'0': 'cero', '1': 'uno', '2': 'dos', '15': 'quince', '16': 'dieciséis', '20': 'veinte', '21': 'veintiuno', '22': 'veintidós', '29': 'veintinueve', '30': 'treinta', '31': 'treinta y uno',
                    '45': 'cuarenta y cinco', '99': 'noventa y nueve', '100': 'cien', '101': 'ciento uno', '110': 'ciento diez', '121': 'ciento veintiuno', '200': 'doscientos', '500': 'quinientos', '999': 'novecientos noventa y nueve',
                    '1000': 'mil', '1001': 'mil uno', '1100': 'mil cien', '1999': 'mil novecientos noventa y nueve', '2000': 'dos mil', '2024': 'dos mil veinticuatro', '10000': 'diez mil', '21000': 'veintiún mil',
                    '100000': 'cien mil', '101000': 'ciento un mil', '999999': 'novecientos noventa y nueve mil novecientos noventa y nueve', '1000000': 'un millón', '1000001': 'un millón uno', '2000000': 'dos millones',
                    '21000000': 'veintiún millones', '1000000000': 'mil millones', '2000000000': 'dos mil millones', '1000000000000': 'un billón', '3000000000000': 'tres billones', '1000000000000000000': 'un trillón',
                    '1234567': 'un millón doscientos treinta y cuatro mil quinientos sesenta y siete', '1001000000': 'mil un millones'}
        r = node(f"console.log(JSON.stringify({json.dumps(list(esperado))}.map(x => N.entero(x))))")
        for x, y in zip(esperado, r): self.assertEqual(y, esperado[x], x)

    def test_femenino_y_apocope(self):
        r = node("console.log(JSON.stringify([N.entero('21', { genero: 'f' }), N.entero('201', { genero: 'f' }), N.entero('200000', { genero: 'f' }), N.entero('1', { genero: 'f' }), N.entero('31', { forma: 'un' }), N.entero('1', { forma: 'un' }), N.entero('21021', { genero: 'f' }), N.entero('300000000', { genero: 'f' }), N.entero('41000000', { genero: 'f' })]))")
        self.assertEqual(r, ['veintiuna', 'doscientas una', 'doscientas mil', 'una', 'treinta y un', 'un', 'veintiuna mil veintiuna', 'trescientos millones', 'cuarenta y un millones'])

    def comparar(self, numeros, genero, forma):
        r = node(f"console.log(JSON.stringify({json.dumps([str(n) for n in numeros])}.map(x => N.entero(x, {{ genero: {json.dumps(genero)}, forma: {json.dumps(forma)} }}))))")
        for n, y in zip(numeros, r): self.assertEqual(y, letras(n, genero, forma), f'{n} ({genero}, {forma})')

    def test_de_0_a_5000_en_los_tres_modos(self):
        for g, f in (('m', 'uno'), ('m', 'un'), ('f', 'uno')): self.comparar(range(0, 5001), g, f)

    def test_numeros_grandes_al_azar(self):
        rng = random.Random(42); lista = []
        for cifras in range(1, 31):
            for _ in range(60): lista.append(rng.randrange(10 ** (cifras - 1) if cifras > 1 else 0, 10 ** cifras))
        lista += [10 ** k for k in range(0, 30)] + [10 ** k - 1 for k in range(1, 31)] + [10 ** k + 1 for k in range(0, 30)] + [2 * 10 ** k for k in range(0, 30)]
        for g, f in (('m', 'uno'), ('m', 'un'), ('f', 'uno')): self.comparar(lista, g, f)

    def test_limites_y_errores(self):
        r = node("const o = []; for (const x of ['1' + '0'.repeat(30), 'abc', '']) { try { o.push(N.entero(x)); } catch (e) { o.push('ERR:' + e.message); } } console.log(JSON.stringify(o))")
        self.assertTrue(r[0].startswith('ERR:El número es demasiado grande') and r[1].startswith('ERR:') and r[2].startswith('ERR:'))
        r = node("console.log(JSON.stringify(N.entero('9'.repeat(30))))"); self.assertEqual(r, letras(10 ** 30 - 1))

    def test_ceros_a_la_izquierda(self):
        self.assertEqual(node("console.log(JSON.stringify([N.entero('0007'), N.entero('000')]))"), ['siete', 'cero'])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class ParseoTest(unittest.TestCase):
    def test_formatos(self):
        casos = {'1234': ('1234', ''), '1.234': ('1234', ''), '1.234,56': ('1234', '56'), '1,234.56': ('1234', '56'), '1234,5': ('1234', '5'), '1234.5': ('1234', '5'), '1 234 567,89': ('1234567', '89'),
                 '1.234.567': ('1234567', ''), '1,234,567': ('1234567', ''), '0,05': ('0', '05'), '0.05': ('0', '05'), ',5': ('0', '5'), '12.345': ('12345', ''), '123.45': ('123', '45'), '3,14': ('3', '14'),
                 '007': ('7', ''), '1.000.000,00': ('1000000', '00'), '100': ('100', '')}
        r = node(f"console.log(JSON.stringify({json.dumps(list(casos))}.map(x => N.parsear(x))))")
        for x, p in zip(casos, r): self.assertEqual((p['entera'], p['decimal']), casos[x], x)
        r = node("console.log(JSON.stringify(['-5', '−5,5', '+7', '-0', '-0,0'].map(x => N.parsear(x))))")
        self.assertEqual([p['negativo'] for p in r], [True, True, False, False, False])
        r = node("console.log(JSON.stringify(['', 'abc', '1,2,3,4,5,x', '12.34.5,6', '--5', '1.2.3,4,5', '5€', ' '].map(x => N.parsear(x))))")
        self.assertEqual(r, [None] * 8)

    def test_frases(self):
        r = node("console.log(JSON.stringify([N.numero('3,14'), N.numero('0,05'), N.numero('-12'), N.numero('1,5', { decimales: 'digitos' }), N.numero('2,305'), N.numero('2,305', { decimales: 'digitos' }), N.numero('21', { genero: 'f' }), N.numero('0'), N.numero('21', { forma: 'un' }), N.numero('1,21', { forma: 'un' }), N.numero('1,21', { genero: 'f' }), N.numero('21,21', { forma: 'un' }), N.numero('0,01', { forma: 'un' })]))")
        self.assertEqual(r, ['tres coma catorce', 'cero coma cero cinco', 'menos doce', 'uno coma cinco', 'dos coma trescientos cinco', 'dos coma tres cero cinco', 'veintiuna', 'cero', 'veintiún', 'uno coma veintiún', 'una coma veintiuna', 'veintiuno coma veintiún', 'cero coma cero un'])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class MonedaTest(unittest.TestCase):
    def ref(self, ent, cent, m, cero=False):
        s, p, cs, cp = {'euro': ('euro', 'euros', 'céntimo', 'céntimos'), 'dolar': ('dólar', 'dólares', 'centavo', 'centavos'), 'peso': ('peso', 'pesos', 'centavo', 'centavos')}[m]
        t = letras(ent, 'm', 'un') + (' de' if ent >= 10 ** 6 and ent % 10 ** 6 == 0 else '') + ' ' + (s if ent == 1 else p)
        if cent: t += ' con ' + letras(cent, 'm', 'un') + ' ' + (cs if cent == 1 else cp)
        elif cero: t += ' con cero ' + cp
        return t

    def test_ejemplos(self):
        r = node("console.log(JSON.stringify(['1', '21', '1000000', '1234,56', '0,01', '2000000', '1500000', '1,5', '0', '1.000.000,00', '1000001', '5,10'].map(x => N.moneda(x))))")
        self.assertEqual(r, ['un euro', 'veintiún euros', 'un millón de euros', 'mil doscientos treinta y cuatro euros con cincuenta y seis céntimos', 'cero euros con un céntimo', 'dos millones de euros', 'un millón quinientos mil euros',
                             'un euro con cincuenta céntimos', 'cero euros', 'un millón de euros', 'un millón un euros', 'cinco euros con diez céntimos'])
        r = node("console.log(JSON.stringify([N.moneda('3', { moneda: 'dolar' }), N.moneda('1,01', { moneda: 'dolar' }), N.moneda('2000000', { moneda: 'peso' }), N.moneda('7', { ceroCentimos: true }), N.moneda('-4,5')]))")
        self.assertEqual(r, ['tres dólares', 'un dólar con un centavo', 'dos millones de pesos', 'siete euros con cero céntimos', 'menos cuatro euros con cincuenta céntimos'])

    def test_al_azar(self):
        rng = random.Random(7); casos = []
        for _ in range(1500):
            ent = rng.choice([rng.randrange(0, 100), rng.randrange(0, 10 ** 4), rng.randrange(0, 10 ** 9), rng.randrange(0, 10 ** 15), rng.randrange(1, 40) * 10 ** 6, rng.randrange(1, 5) * 10 ** 12])
            cent = rng.choice([0, 0, rng.randrange(0, 100)]); m = rng.choice(['euro', 'dolar', 'peso'])
            casos.append((ent, cent, m))
        entradas = [f"{e}" + (f",{c:02d}" if c else '') for e, c, _ in casos]
        r = node(f"const M = {json.dumps([c[2] for c in casos])}; console.log(JSON.stringify({json.dumps(entradas)}.map((x, i) => N.moneda(x, {{ moneda: M[i] }}))))")
        for (e, c, m), x, y in zip(casos, entradas, r): self.assertEqual(y, self.ref(e, c, m), x)

    def test_errores(self):
        r = node("const o = []; for (const x of ['1,234', 'abc', '']) { try { o.push(N.moneda(x)); } catch (e) { o.push('ERR:' + e.message); } } console.log(JSON.stringify(o))")
        self.assertTrue(r[0].startswith('ERR:Un importe admite como mucho dos decimales') and r[1].startswith('ERR:No entiendo') and r[2].startswith('ERR:'))
        self.assertEqual(node("console.log(JSON.stringify(N.moneda('1,500')))"), 'un euro con cincuenta céntimos')

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class RomanosTest(unittest.TestCase):
    def test_los_3999(self):
        r = node("const o = []; for (let n = 1; n <= 3999; n++) o.push(N.aRomano(n)); console.log(JSON.stringify(o))")
        self.assertEqual(r, [a_romano(n) for n in range(1, 4000)])
        r = node("const o = []; for (let n = 1; n <= 3999; n++) o.push(N.deRomano(N.aRomano(n))); console.log(JSON.stringify(o))")
        self.assertEqual(r, list(range(1, 4000)))

    def test_minusculas_y_espacios(self):
        self.assertEqual(node("console.log(JSON.stringify([N.deRomano(' mcmxciv '), N.deRomano('iv')]))"), [1994, 4])

    def test_no_canonicos(self):
        r = node("""const o = []; for (const x of ['IIII', 'VV', 'IC', 'IL', 'XM', 'MMMM', 'IIV', 'ABC', '', 'VX', 'LC', 'MCMC', 'IXI', 'CMD']) { try { o.push(N.deRomano(x)); } catch (e) { o.push('ERR'); } } console.log(JSON.stringify(o))""")
        self.assertEqual(r, ['ERR'] * 14)
        r = node("""const o = []; for (const x of ['IIII', 'XXXX', 'VIIII', 'DCCCC', 'IIIII', 'MMMM', 'VV']) { try { o.push(N.deRomano(x, { estricto: false })); } catch (e) { o.push('ERR'); } } console.log(JSON.stringify(o))""")
        self.assertEqual(r, [4, 40, 9, 900, 'ERR', 'ERR', 10])

    def test_limites(self):
        r = node("const o = []; for (const x of [0, 4000, -1, 1.5, NaN]) { try { o.push(N.aRomano(x)); } catch (e) { o.push('ERR'); } } console.log(JSON.stringify(o))")
        self.assertEqual(r, ['ERR'] * 5)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class DniTest(unittest.TestCase):
    L = 'TRWAGMYFPDXBNJZSQVHLCKE'

    def test_conocidos(self):
        r = node("console.log(JSON.stringify(['12345678', '00000000', '99999999', '1', '12345678Z', 'x1234567', 'Y0000000', 'Z0000000', 'X0000000', '12.345.678', '12345678-z'].map(x => N.letraDni(x))))")
        esperado = [('DNI', '12345678', 'Z'), ('DNI', '00000000', 'T'), ('DNI', '99999999', 'R'), ('DNI', '00000001', 'R'), None, ('NIE', 'X1234567', 'L'), ('NIE', 'Y0000000', 'Z'), ('NIE', 'Z0000000', 'M'), ('NIE', 'X0000000', 'T'), ('DNI', '12345678', 'Z'), None]
        for x, e in zip(r, esperado):
            if e is None: self.assertIsNone(x)
            else: self.assertEqual((x['tipo'], x['numero'], x['letra']), e)

    def test_contra_la_formula(self):
        rng = random.Random(3); nums = [rng.randrange(0, 10 ** 8) for _ in range(3000)]
        r = node(f"console.log(JSON.stringify({json.dumps([str(n) for n in nums])}.map(x => N.letraDni(x).letra)))")
        self.assertEqual(r, [self.L[n % 23] for n in nums])
        nies = [(rng.choice('XYZ'), rng.randrange(0, 10 ** 7)) for _ in range(2000)]
        r = node(f"console.log(JSON.stringify({json.dumps([a + str(b) for a, b in nies])}.map(x => N.letraDni(x).letra)))")
        self.assertEqual(r, [self.L[int(str('XYZ'.index(a)) + f'{b:07d}') % 23] for a, b in nies])

    def test_revision(self):
        r = node("console.log(JSON.stringify(['12345678Z', '12345678A', '12345678', 'X1234567L', 'X1234567A', 'abc', '1234567890Z', 'Z'].map(x => N.revisarDni(x))))")
        self.assertEqual([(x.get('ok'), x.get('esperada')) for x in r[:5]], [(True, 'Z'), (False, 'Z'), (None, 'Z'), (True, 'L'), (False, 'L')])
        self.assertTrue(all(x.get('error') for x in r[5:]))

if __name__ == '__main__':
    unittest.main()
