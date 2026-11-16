"""El minificador del sitio (herramientas/datos/lib/minificar.js). JavaScript: cada programa de un corpus escrito para forzar los casos difíciles (inserción automática de
punto y coma, expresiones regulares, plantillas, ++ y --, comentarios…) se ejecuta antes y después y debe dar lo mismo; todos los .js del proyecto se minifican y compilan;
y las librerías propias minificadas deben comportarse igual que las originales. CSS y HTML: resultados exactos en casos pequeños e idempotencia sobre todos los archivos del sitio."""
import json, shutil, subprocess, tempfile, unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'minificar.js'

def node(js, entrada=None, timeout=300):
    r = subprocess.run(['node', '-e', f"const M = require({json.dumps(str(LIB))}); const e = JSON.parse(require('fs').readFileSync(0, 'utf8')); {js}"],
                       input=json.dumps(entrada), capture_output=True, text=True, timeout=timeout)
    if r.returncode: raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout)

# Cada programa escribe su resultado con salida(...). Se ejecutan tal cual y minificados en un contexto aislado.
PROGRAMAS = [
    'var a = 1; var b = 2; salida(a + b);',
    'function f(a, b) {\n  // suma\n  return a + b; /* otra */\n}\nsalida(f(2, 3));',
    'let x = 1\nlet y = 2\nsalida(x + y)',
    'let a = 1\nlet b = a\n++b\nsalida(a, b)',
    'var a = 5, b = 3;\nsalida(a++ + ++b, a, b);',
    'var a = 5, b = -3;\nsalida(a - -b, a + +b, a- --b, b);',
    'var a = 5; var b = 2;\nsalida(a / b / 2, a /b);',
    'var s = "a/b"; salida(/a\\/b/.test(s), s.split(/\\//).length, "x".replace(/x/g, "/"));',
    'var re = /[/]+"\'/g; salida(re.test("//\\"\'"), String(re));',
    'var t = 4; salida(`a${t}b${`c${t + 1}d`}e`);',
    'var o = {a: 1}; salida(`x${ {b: 2}.b }y${o.a}`);',
    'function g() {\n  return\n  5;\n}\nsalida(g());',
    'function h() {\n  return (\n    5\n  );\n}\nsalida(h());',
    'var a = 1\nvar f = function () { return 2 }\n;(function () { salida(a + f()) })()',
    'var a = [1, 2, 3]\nvar b = a\n[1]\nsalida(b)',
    'var x = 3\nvar y = x\n/2/1\nsalida(y)',
    'salida(typeof /x/, typeof "a", void 0, 1 in [5, 6], "a" in {a: 1});',
    'var n = 1; salida(n .toString(), 1..toString(), 1.5.toFixed(1), 0x1F, 1e3, .5 + 5., 10n * 2n === 20n);',
    'var a = 1; var b = a ? .5 : 1; salida(b);',
    'var u = undefined; salida(u?.x, ({a: {b: 1}}).a?.b, u ?? "n", 2 ** 3);',
    'var i = 0; while (i < 3) i++\nsalida(i)',
    'var r = []; for (var i = 0; i < 3; i++) { if (i % 2) r.push(i); else r.push(-i) }\nsalida(r.join())',
    'var f = x => x * 2, g = (x, y) => { return x + y }\nsalida(f(2), g(1, 2))',
    'label: for (var i = 0; i < 3; i++) { for (;;) { continue label } }\nsalida(i)',
    'var a = "x"; var b = a\n.toUpperCase()\n.repeat(2)\nsalida(b)',
    'var s = "línea \\\ncontinuada"; salida(s);',
    'class A { #p = 1; static s = 2; get v() { return this.#p } }\nsalida(new A().v, A.s)',
    'var a = { if: 1, class: 2, "k-1": 3, get x() { return 4 }, [1 + 1]: 5 }\nsalida(a.if + a.class + a["k-1"] + a.x + a[2])',
    'try { throw new Error("e") } catch (e) { salida(e.message) } finally { salida("f") }',
    'var a = 1, b = 2\nif (a < b) salida("menor")\nelse salida("mayor")',
    'var x = 10; x /= 2; x **= 2; x >>>= 1; x ||= 7; x &&= 8; salida(x);',
    'var s = ""; for (const k of [1, 2]) s += k\nfor (const k in {a: 1}) s += k\nsalida(s)',
    'async function f() { await null; return 3 }\nf().then(function (v) { salida(v) })',
    'function* g() { yield 1; yield* [2, 3] }\nsalida([...g()].join())',
    'var a = 1; /* @preserve texto */ salida(a);',
    'var a = 1 //c\n+ 2\nsalida(a)',
    'var a = (1,\n2)\nsalida(a)',
    'salida("a" + /b/.source + "c" + / d /.source)',
    'var d = 4, e = 2, g = 1; salida(d / e / g, d /e/ g);',
    'var obj = {\n  a: 1,\n  b: 2,\n};\nvar { a, b } = obj;\nsalida(a, b, [1,2,3,].length)',
    'if (true) { salida("a") }\nelse { salida("b") }\nswitch (1) { case 1: salida("uno"); break; default: salida("otro") }',
    'do salida("d"); while (false)\nsalida("fin")',
    'var a = 3; salida(a<!--b\n);'.replace('<!--b\n', '< 4'),
]

EJEC = r"""
const vm = require('vm');
const ejecutar = (codigo) => { const sal = []; const ctx = vm.createContext({ salida: (...a) => sal.push(a.map(String).join('|')), setTimeout, Promise }); try { vm.runInContext(codigo, ctx, { timeout: 5000 }); } catch (err) { sal.push('ERROR ' + err.constructor.name); } return Promise.resolve().then(() => new Promise(r => setTimeout(r, 20))).then(() => sal); };
"""

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class MinificarTest(unittest.TestCase):
    def test_programas_dan_lo_mismo(self):
        js = EJEC + "(async () => { const res = []; for (const p of e) { const m = M.js(p); res.push({ ant: await ejecutar(p), des: await ejecutar(m.salida), min: m.salida, av: m.avisos }); } console.log(JSON.stringify(res)); })()"
        res = node(js, PROGRAMAS)
        for p, r in zip(PROGRAMAS, res):
            self.assertEqual(r['av'], [], f'{p!r} → {r["min"]!r}')
            self.assertEqual(r['ant'], r['des'], f'{p!r} → {r["min"]!r}')
            self.assertFalse(any(x.startswith('ERROR') for x in r['ant']), f'el programa original falla: {p!r} {r["ant"]}')
            self.assertLessEqual(len(r['min']), len(p), p)

    def test_valores_exactos_js(self):
        casos = {
            'function f(a, b) {\n  return a + b;\n}': 'function f(a,b){return a+b;}',
            'let x = 1\nlet y = 2': 'let x=1\nlet y=2',
            'a = b\n++c': 'a=b\n++c',
            'a = b +\n c': 'a=b+c',
            'a - -b': 'a- -b', 'a + +b': 'a+ +b', 'a++ + b': 'a++ +b', 'a+ ++b': 'a+ ++b',
            'x = a / b / c': 'x=a/b/c',
            'return /a b/.test(x)': 'return/a b/.test(x)',
            'if (a) {\n} else {\n}': 'if(a){}else{}',
            'x = "  a  "  +  \'  b  \'': 'x="  a  "+\'  b  \'',
            'var s = `  a ${ b }  c `': 'var s=`  a ${ b }  c `',
            '/* @license MIT */\nvar a = 1;': '/* @license MIT */\nvar a=1;',
            '/*! v1 */ var a = 1': '/*! v1 */\nvar a=1',
            '// nada\n// más': '',
            '1 .toString()': '1 .toString()',
            'a = b ? .5 : 1': 'a=b?.5:1',
            'typeof x === "undefined"': 'typeof x==="undefined"',
            'return\n5': 'return\n5',
        }
        res = node("console.log(JSON.stringify(e.map(t => M.js(t).salida)))", list(casos))
        for (t, esperado), r in zip(casos.items(), res):
            self.assertEqual(r, esperado, repr(t))

    def test_js_roto_se_deja_como_esta(self):
        for t in ['var a = "sin cerrar', 'var a = `sin cerrar ${', '/* sin cerrar']:
            r = node("console.log(JSON.stringify(M.js(e)))", t)
            self.assertEqual(r['salida'], t)
            self.assertTrue(r['av'] if 'av' in r else r['avisos'])

    def test_todos_los_js_del_proyecto_compilan_minificados(self):
        archivos = [str(p) for p in RAIZ.rglob('*.js') if 'dist' not in p.parts and '__pycache__' not in p.parts and 'node_modules' not in p.parts]
        self.assertGreater(len(archivos), 100)
        js = r"""
const vm = require('vm'), fs = require('fs'); const res = [];
for (const f of e) {
  const src = fs.readFileSync(f, 'utf8'), m = M.js(src); let compila = true, original = true;
  try { new vm.Script(src); } catch (x) { original = false; }
  try { new vm.Script(m.salida); } catch (x) { compila = false; }
  const otra = M.js(m.salida);
  res.push({ f, original, compila, sinAviso: !m.avisos.length, idem: otra.salida === m.salida, ant: src.length, des: m.salida.length });
}
console.log(JSON.stringify(res));
"""
        res = node(js, archivos, timeout=600)
        malos = [r for r in res if r['original'] and not (r['compila'] and r['sinAviso'])]
        self.assertEqual(malos, [], 'archivos que no compilan o se han dejado sin minificar')
        # los módulos (import/export) no compilan como script: no cuentan, pero que sean muy pocos
        self.assertLess(len([r for r in res if not r['original']]), 5)
        noidem = [r['f'] for r in res if r['original'] and not r['idem']]
        self.assertEqual(noidem, [], 'minificar dos veces debe dar lo mismo')
        ahorro = 1 - sum(r['des'] for r in res if r['original']) / sum(r['ant'] for r in res if r['original'])
        self.assertGreater(ahorro, 0.05)

    def test_librerias_propias_minificadas_se_comportan_igual(self):
        libs = RAIZ / 'herramientas' / 'datos' / 'lib'
        js = r"""
const fs = require('fs'), path = require('path'), os = require('os');
const d = fs.mkdtempSync(path.join(os.tmpdir(), 'min-'));
const cargar = (n) => { const o = path.join(libs, n); const m = M.js(fs.readFileSync(o, 'utf8')); if (m.avisos.length) throw new Error(n + ': ' + m.avisos); const p = path.join(d, n); fs.writeFileSync(p, m.salida); return [require(o), require(p), fs.statSync(o).size, m.salida.length]; };
const r = {};
let [a, b, x, y] = cargar('hash.js'); r.hash = ['', 'abc', 'Canción ñandú 😀', 'x'.repeat(1000)].every(t => { const by = Buffer.from(t); return ['md5', 'sha1', 'sha256', 'sha384', 'sha512'].every(f => a.hex(a[f](by)) === b.hex(b[f](by))); });
[a, b] = cargar('json.js'); r.json = ['{"a":[1,2,{"b":null}],"c":12345678901234567890}', '{"a":1,}', '[1.50, 2E5, "\\u00e9"]'].every(t => { const p = a.analizar(t), q = b.analizar(t); return JSON.stringify(p) === JSON.stringify(q) && (!p.ok || a.escribir(p.raiz, { sangria: '  ' }) === b.escribir(q.raiz, { sangria: '  ' })); });
[a, b] = cargar('qr.js'); r.qr = ['Hola', 'https://www.trabajoyjuego.es/', '0123456789', 'Ñandú ñoño'].every(t => ['L', 'M', 'Q', 'H'].every(n => JSON.stringify(a.generar(t, { nivel: n }).modulos) === JSON.stringify(b.generar(t, { nivel: n }).modulos)));
[a, b] = cargar('calendario.js'); r.cal = JSON.stringify(Object.keys(a)) === JSON.stringify(Object.keys(b));
console.log(JSON.stringify(r));
""".replace('libs', json.dumps(str(libs)))
        r = node(js)
        self.assertEqual(r, {'hash': True, 'json': True, 'qr': True, 'cal': True})

    def test_css_exacto(self):
        casos = {
            'a  >  b , c { color : red ; margin : 0 auto ; }': 'a>b,c{color:red;margin:0 auto}',
            '/* x */ .d:hover > .e{background:url( a.png ) ; width:calc( 1px + 2px ) }': '.d:hover>.e{background:url(a.png);width:calc(1px + 2px)}',
            '@media (min-width: 600px) and (max-width: 900px) { a:hover > b { x: y } }': '@media (min-width:600px) and (max-width:900px){a:hover>b{x:y}}',
            'a { --x : 1px + 2px ; width : calc( var(--x) * 2 ) }': 'a{--x:1px + 2px;width:calc(var(--x) * 2)}',
            'a + b ~ c { margin : -1px  -2px }': 'a+b~c{margin:-1px -2px}',
            'a { margin: 0 + 5px }': 'a{margin:0 + 5px}',
            '.a\\ b { content : "a  ;  b" ; font-family : "A B" , serif }': '.a\\ b{content:"a  ;  b";font-family:"A B",serif}',
            '/*! licencia */\na{b:c}': '/*! licencia */\na{b:c}',
            'a { background : url("x y.png") }': 'a{background:url("x y.png")}',
            'a { b : c !important ; }': 'a{b:c !important}',
            'a :hover { b : c }': 'a :hover{b:c}',
            'a{b:c;}\n\n\nd{e:f;}': 'a{b:c}d{e:f}',
            '@import url( "x.css" ) screen ;': '@import url("x.css") screen;',
            '@media screen { a:hover > b { c : d } e :f { g : h } }': '@media screen{a:hover>b{c:d}e :f{g:h}}',
            'a { grid-template-areas : "a b" "c d" ; }': 'a{grid-template-areas:"a b" "c d"}',
        }
        res = node("console.log(JSON.stringify(e.map(t => M.css(t).salida)))", list(casos))
        for (t, esperado), r in zip(casos.items(), res):
            self.assertEqual(r, esperado, repr(t))

    def test_html_exacto(self):
        casos = {
            '<p>Hola   <b>mundo</b>  <i>y</i>  adiós </p>': '<p>Hola <b>mundo</b> <i>y</i> adiós</p>',
            '<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>': '<ul><li>a</li><li>b</li></ul>',
            '<div> <span>a</span> <span>b</span> </div>': '<div><span>a</span> <span>b</span></div>',
            '<a   href = "x"   class="  a   b  "  >t</a >'.replace('</a >', '</a>'): '<a href="x" class="a b">t</a>',
            '<pre>  a\n   b </pre>': '<pre>  a\n   b </pre>',
            '<textarea>  x\n y </textarea>': '<textarea>  x\n y </textarea>',
            '<!-- c --><p>a</p><!--[if IE]><p>ie</p><![endif]-->': '<p>a</p><!--[if IE]><p>ie</p><![endif]-->',
            '<br />texto<br/>': '<br/>texto<br/>',
            '<input disabled value=" a  b " type=text>': '<input disabled value=" a  b " type=text>',
            '<p>a &nbsp; b</p>': '<p>a &nbsp; b</p>',
            '<p>a  b</p>': '<p>a  b</p>',
            '<script type="application/ld+json">\n{ "a" : 1 }\n</script>': '<script type="application/ld+json">\n{ "a" : 1 }\n</script>',
            '<script>\n var a = 1;\n // x\n</script>': '<script>var a=1;</script>',
            '<style>\n a { b : c }\n</style>': '<style>a{b:c}</style>',
            '<p>1 < 2 y 3 > 2</p>': '<p>1 < 2 y 3 > 2</p>',
            '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n</head>\n<body>\n<h1>T</h1>\n</body>\n</html>\n': '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head><body><h1>T</h1></body></html>',
            '<button>a</button> <button>b</button>': '<button>a</button> <button>b</button>',
            '<td> <a>x</a> </td>': '<td><a>x</a></td>',
            '<pre>a</pre>\n<textarea> t </textarea>': '<pre>a</pre><textarea> t </textarea>',
            '<p>texto <!-- coment --> más</p>': '<p>texto más</p>',
        }
        res = node("console.log(JSON.stringify(e.map(t => M.html(t).salida)))", list(casos))
        for (t, esperado), r in zip(casos.items(), res):
            self.assertEqual(r, esperado, repr(t))

    def test_html_sin_quitar_espacios_de_bloque_ni_incrustado(self):
        r = node("console.log(JSON.stringify([M.html('<div> <p>a</p> </div>', { bloques: false }).salida, M.html('<script> var a = 1; </script><style> a { b : c } </style>', { incrustado: false }).salida]))")
        self.assertEqual(r, ['<div> <p>a</p> </div>', '<script> var a = 1; </script><style> a { b : c } </style>'])

    def test_idempotente_sobre_el_sitio(self):
        archivos = [str(p) for p in list(RAIZ.rglob('*.html')) + list(RAIZ.rglob('*.css')) if 'dist' not in p.parts and 'vista-previa' not in p.parts and 'node_modules' not in p.parts]
        self.assertGreater(len(archivos), 100)
        js = r"""
const fs = require('fs'); const res = [];
for (const f of e) {
  const src = fs.readFileSync(f, 'utf8'), tipo = f.endsWith('.css') ? 'css' : 'html', a = M[tipo](src), b = M[tipo](a.salida);
  res.push({ f, idem: a.salida === b.salida, av: a.avisos.length, ant: src.length, des: a.salida.length });
}
console.log(JSON.stringify(res));
"""
        res = node(js, archivos, timeout=600)
        self.assertEqual([r['f'] for r in res if not r['idem']], [])
        self.assertEqual([r['f'] for r in res if r['av']], [])

if __name__ == '__main__':
    unittest.main()
