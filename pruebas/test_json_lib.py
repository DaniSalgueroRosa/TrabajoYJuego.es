"""El analizador de JSON del sitio (herramientas/datos/lib/json.js) frente a Python: qué documentos acepta y rechaza (casos escritos a mano y miles
de mutaciones al azar), que reescribir no cambia ni un valor (números enteros grandes y 1.0 incluidos) y que los errores señalan la línea y columna correctas."""
import json, random, shutil, subprocess, unittest
from decimal import Decimal
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'json.js'

def py_acepta(t):
    def no(_): raise ValueError('constante no válida')
    try:
        json.loads(t, parse_constant=no)
        return True
    except (ValueError, RecursionError):
        return False

def py_exacto(t):
    return json.loads(t, parse_float=Decimal, parse_int=Decimal, object_pairs_hook=lambda p: ('o', p))

def node(js, entrada):
    r = subprocess.run(['node', '-e', f"const J = require({json.dumps(str(LIB))}); const e = JSON.parse(require('fs').readFileSync(0, 'utf8')); {js}"], input=json.dumps(entrada), capture_output=True, text=True, check=True)
    return json.loads(r.stdout)

VALIDOS = ['{}', '[]', '0', '-0', '1', '-1.5', '1e5', '1E+5', '1.5e-10', '0.0', '"a"', '""', 'true', 'false', 'null', ' [ 1 , 2 ] ', '\n{"a":1}\r\n', '{"a":{"b":[1,2,{"c":null}]}}',
           '"\\u00e9\\n\\t\\"\\\\\\/"', '"😀"', '[[[[[]]]]]', '{"":1}', '{"a":1,"a":2}', '12345678901234567890', '[1.0,2.50,3e2]', '"\\ud800"', '{"clave con espacios":"valor con ñ y é"}']
INVALIDOS = ['', ' ', '{', '}', '[', ']', '{"a"}', '{"a":}', '{"a":1,}', '[1,]', '[,1]', '[1 2]', '{"a":1 "b":2}', "{'a':1}", '{a:1}', '[undefined]', '[NaN]', '[Infinity]', '[-Infinity]', '01', '+1', '.5', '1.', '1e', '-', '--1', '0x10',
             '"a', '"\\x"', '"\\u12"', '"a\nb"', '"a\tb"', 'tru', 'truex', 'nul', 'True', '{"a":1}}', '[1]]', '1 2', '{"a":1} x', '// c\n1', '/* c */ 1', '[1,2', '{"a":[1,2}', '{"a":1', '"\\', '{"a":"b"', "'a'", '[01]', '[1.e1]', '[0e]', '{"a" 1}', '{1:2}', '[}', '{]']

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class JsonLibTest(unittest.TestCase):
    def test_acepta_y_rechaza_como_python(self):
        casos = VALIDOS + INVALIDOS
        res = node("console.log(JSON.stringify(e.map(t => J.analizar(t).ok)))", casos)
        for t, r in zip(casos, res):
            self.assertEqual(r, py_acepta(t), repr(t))
        for t in VALIDOS: self.assertTrue(py_acepta(t), repr(t))
        for t in INVALIDOS: self.assertFalse(py_acepta(t), repr(t))

    def test_mutaciones_al_azar(self):
        rnd = random.Random(2026)
        base = ['{"a":[1,2,{"b":"c\\n"}],"d":null,"e":true,"f":-1.5e3}', '[{"x":1,"y":"z"},{"x":2,"y":"w"}]', '{"k":{"k":{"k":[[],{}]}}}', '[0,-0,10,1.25,"\\u00e9"]']
        alfabeto = list('{}[]",:\\ \n-+.0123456789eEtrufalsn/\'#') + ['é', '\x01']
        casos = []
        for _ in range(4000):
            t = list(rnd.choice(base))
            for _ in range(rnd.randint(1, 3)):
                op = rnd.choice('bci')
                p = rnd.randrange(len(t) + 1)
                if op == 'b' and t: del t[min(p, len(t) - 1)]
                elif op == 'c' and t: t[min(p, len(t) - 1)] = rnd.choice(alfabeto)
                else: t.insert(p, rnd.choice(alfabeto))
            casos.append(''.join(t))
        res = node("console.log(JSON.stringify(e.map(t => J.analizar(t).ok)))", casos)
        malos = [(t, r) for t, r in zip(casos, res) if r != py_acepta(t)]
        self.assertEqual(malos[:5], [], f'{len(malos)} diferencias de {len(casos)}')

    def test_reescribir_no_cambia_ningun_valor(self):
        entradas = [t for t in VALIDOS] + ['{"n":12345678901234567890,"f":1.0,"g":2.50,"e":1E5,"neg":-0}', '{"b":2,"a":[1,{"z":1,"y":2}]}', '{"a":"\\u00e9\\n","b":["x",{"c":null}]}']
        for modo in ({'sangria': None}, {'sangria': '  '}, {'sangria': '    '}, {'sangria': '\t'}, {'sangria': '  ', 'ordenar': True}):
            res = node("console.log(JSON.stringify(e.map(t => { const r = J.analizar(t); return J.escribir(r.raiz, " + json.dumps(modo) + "); })))", entradas)
            for t, salida in zip(entradas, res):
                a, b = py_exacto(t), py_exacto(salida)
                if modo.get('ordenar'):
                    def orden(x):
                        if isinstance(x, tuple): return ('o', sorted(((k, orden(v)) for k, v in x[1]), key=lambda p: (p[0].lower(), p[0])))
                        if isinstance(x, list): return [orden(v) for v in x]
                        return x
                    a, b = orden(a), orden(b)
                self.assertEqual(a, b, f'{modo} {t!r} → {salida!r}')

    def test_minificado_no_deja_espacios_fuera_de_cadenas(self):
        t = '{ "a" : [ 1 , 2 , { "b" : "x y" } ] ,\n "c" : null }'
        self.assertEqual(node("console.log(JSON.stringify(J.escribir(J.analizar(e).raiz, { sangria: null })))", t), '{"a":[1,2,{"b":"x y"}],"c":null}')

    def test_sangria_igual_que_python(self):
        for t in ['{"a":1,"b":[1,2,{"c":"d"}],"e":{}}', '[[],{},[1],[[2]]]', '{"x":{"y":{"z":[true,false,null]}}}']:
            for sang, py_sang in (('  ', 2), ('    ', 4), ('\t', '\t')):
                s = node(f"console.log(JSON.stringify(J.escribir(J.analizar(e).raiz, {{ sangria: {json.dumps(sang)} }})))", t)
                self.assertEqual(s, json.dumps(json.loads(t), indent=py_sang, ensure_ascii=False), (t, sang))

    def test_posicion_de_los_errores(self):
        casos = [('{\n  "a": 1,\n  "b": \n}', 4, 1), ('{"a": 1,}', 1, 9), ('[1,\n2,\n3 4]', 3, 3), ('{"a":\n  tru}', 2, 3), ('{\n"a" 1}', 2, 5), ('\n\n  x', 3, 3)]
        for t, lin, col in casos:
            r = node("const r = J.analizar(e); console.log(JSON.stringify(r.error))", t)
            self.assertEqual((r['linea'], r['columna']), (lin, col), (t, r['mensaje']))

    def test_duplicadas_y_estadisticas(self):
        r = node("const r = J.analizar(e); console.log(JSON.stringify(r.stats))", '{"a":1,"b":{"a":[1,2,{"c":3}]},"a":2}')
        self.assertEqual(r['duplicadas'], [{'clave': 'a', 'pos': 31}])
        self.assertEqual((r['objetos'], r['matrices'], r['claves'], r['valores'], r['profundidad']), (3, 1, 5, 5, 4))

    def test_valor_conserva_enteros_grandes(self):
        r = node("console.log(JSON.stringify(J.valor(J.analizar(e).raiz)))", '[12345678901234567890, 123, 1.5, "x", null, true]')
        self.assertEqual(r, ['12345678901234567890', 123, 1.5, 'x', None, True])

if __name__ == '__main__':
    unittest.main()
