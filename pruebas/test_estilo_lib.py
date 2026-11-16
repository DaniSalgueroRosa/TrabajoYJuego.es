"""herramientas/datos/lib/estilo.js frente a una implementación independiente en Python (frases, palabras, resumen y las seis señales del analizador, sobre cientos de textos
generados al azar) y frente a casos escritos a mano (abreviaturas, editor de estilo, avisos). Las listas de datos (palabras vacías, fórmulas, conectores) se leen de la librería."""
import json, math, random, re, shutil, subprocess, tempfile, unittest
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIB = RAIZ / 'herramientas' / 'datos' / 'lib' / 'estilo.js'
LET = '0-9A-Za-zÀ-ÖØ-öø-ÿ'

def node(js, entrada=None):
    pre = f"const E = require({json.dumps(str(LIB))}); "
    if entrada is not None:
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f: json.dump(entrada, f)
        pre += f"const IN = JSON.parse(require('fs').readFileSync({json.dumps(f.name)}, 'utf8')); "
    r = subprocess.run(['node', '-e', pre + js], capture_output=True, text=True, timeout=300)
    if r.returncode: raise AssertionError(r.stderr[-2000:])
    return json.loads(r.stdout)

DATOS = None
def datos():
    global DATOS
    if DATOS is None: DATOS = node("console.log(JSON.stringify({ stop: E.STOP, abrev: E.ABREVIATURAS, formulas: E.FORMULAS, conectores: E.CONECTORES }))")
    return DATOS

# ------------------------------------------------------------------ implementación de referencia
def palabras(t): return re.findall(f'[{LET}]+', t.lower())

def frases(t):
    d = datos(); abrev = set(d['abrev']); out = []
    t = t.replace('\r\n', '\n').replace('\r', '\n')
    for linea in t.split('\n'):
        ini = 0
        for m in re.finditer(r'([.!?…]+)(["\'”’»)\]]*)', linea):
            i, fin = m.start(), m.end()
            if fin < len(linea) and not linea[fin].isspace(): continue
            k = fin
            while k < len(linea) and linea[k] in ' \t ': k += 1
            parte = k >= len(linea) or re.match(r'[A-ZÀ-ÖØ-Þ0-9¿¡«“"—–\-]', linea[k]) is not None
            if parte and m.group(1) == '.':
                previa = re.search(r'([A-Za-zÀ-ÿº]+)$', linea[max(0, i - 12):i])
                if previa:
                    w = previa.group(1); ant = linea[i - len(w) - 1] if i - len(w) - 1 >= 0 else ''
                    if w.lower() in abrev or (len(w) == 1 and w in 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ' and not re.match(f'[{LET}]', ant or ' ')): parte = False
            if parte:
                s = linea[ini:fin].strip()
                if s: out.append(s)
                ini = fin
        s = linea[ini:].strip()
        if s: out.append(s)
    return out

def contenido(w): return len(w) >= 3 and w not in set(datos()['stop'])

def resumir(t, porcentaje=None, cantidad=None):
    stop = set(datos()['stop']); fr = frases(t); pal = [palabras(f) for f in fr]; tf = Counter()
    for ws in pal:
        for w in ws:
            if len(w) >= 3 and w not in stop: tf[w] += 1
    cand = []
    for i, ws in enumerate(pal):
        if len(ws) < 4: continue
        dist = []
        for w in ws:
            if len(w) >= 3 and w not in stop and w not in dist: dist.append(w)
        suma = 0
        for w in dist: suma += tf[w]
        p = suma / math.sqrt(len(dist)) if dist else 0
        if i == 0 and len(fr) > 3: p *= 1.2
        cand.append((p, i))
    k = int(cantidad) if cantidad else max(1, math.floor(len(fr) * (porcentaje or 30) / 100 + 0.5))
    k = min(k, len(cand))
    elegidas = sorted(i for p, i in sorted(cand, key=lambda x: (-x[0], x[1]))[:k])
    claves = sorted([w for w in tf if tf[w] >= 2], key=lambda w: (-tf[w], w))[:8]
    return {'frases': [fr[i] for i in elegidas], 'indices': elegidas, 'total': len(fr), 'palabrasClave': [{'palabra': w, 'veces': tf[w]} for w in claves]}

def formulas_en(ws):
    res = []
    for f in datos()['formulas']:
        t = f.split(' '); n = sum(1 for i in range(len(ws) - len(t) + 1) if ws[i:i + len(t)] == t)
        if n: res.append({'frase': f, 'veces': n})
    return res

def analizar(t):
    d = datos(); stop = set(d['stop']); ws = palabras(t); pal = [x for x in (palabras(f) for f in frases(t)) if x]; S, N = len(pal), len(ws)
    if N < 100: return {'suficiente': False, 'palabras': N, 'frases': S, 'senales': [], 'activas': 0}
    sen = {}
    largos = [len(x) for x in pal]; media = 0.0
    for l in largos: media += l
    media /= S; v = 0.0
    for l in largos: v += (l - media) * (l - media)
    cv = math.sqrt(v / S) / media
    sen['uniformidad'] = (S >= 8 and cv < 0.40, cv)
    ini = Counter(x[0] for x in pal); top = sorted(ini, key=lambda w: (-ini[w], w))[0]
    sen['arranques'] = (ini[top] >= 4 and ini[top] / S >= 0.25, ini[top] / S)
    fs = formulas_en(ws); nf = sum(f['veces'] for f in fs); dens = nf * 1000 / N
    sen['formulas'] = (nf >= 3 and dens >= 6, dens)
    conect = [c.split(' ') for c in d['conectores']]; nc = 0
    for x in pal:
        for c in sorted(conect, key=lambda c: -len(c)):
            if x[:len(c)] == c:
                if not (c == ['además'] and len(x) > 1 and x[1] in ('de', 'del')): nc += 1
                break
    sen['conectores'] = (nc >= 3 and nc / S >= 0.35, nc / S)
    if N < 150: sen['variedad'] = (False, None)
    else:
        suma = sum(len(set(ws[i:i + 50])) for i in range(N - 49)); m = suma / (50 * (N - 49)); sen['variedad'] = (m < 0.62, m)
    tri = Counter()
    for i in range(N - 2):
        if ws[i] in stop and ws[i + 1] in stop and ws[i + 2] in stop: continue
        tri[' '.join(ws[i:i + 3])] += 1
    reps = sorted([k for k in tri if tri[k] >= 3], key=lambda k: (-tri[k], k))
    sen['trigramas'] = (len(reps) > 0, len(reps))
    return {'suficiente': True, 'palabras': N, 'frases': S, 'senales': sen, 'activas': sum(1 for a, _ in sen.values() if a), 'lista_formulas': sorted(fs, key=lambda f: (-f['veces'], f['frase']))[:6],
            'lista_tri': [{'frase': k, 'veces': tri[k]} for k in reps[:5]]}

# ------------------------------------------------------------------ generador de textos al azar
def texto_azar(rng):
    d = datos(); vocab = ['casa', 'perro', 'ciudad', 'agua', 'tiempo', 'libro', 'camino', 'música', 'ventana', 'trabajo', 'jardín', 'mañana', 'noche', 'cielo', 'montaña', 'río', 'niño', 'señal', 'puente', 'campo', 'verde', 'rápido', 'tranquilo', 'antiguo', 'pequeño', 'lejano', 'azul', 'ñandú', 'canción', 'pingüino']
    vocab += rng.sample(d['stop'], 20)
    modo = rng.choice(['mixto', 'uniforme', 'repetitivo', 'formulas'])
    if modo == 'repetitivo': vocab = rng.sample(vocab, 15)
    partes = []
    for _ in range(rng.randint(8, 30)):
        n = 12 if modo == 'uniforme' and rng.random() < 0.8 else rng.randint(3, 30)
        ws = [rng.choice(vocab) for _ in range(n)]
        if modo == 'repetitivo' and rng.random() < 0.6: ws[:2] = ['el', 'sistema']
        if modo == 'repetitivo' and rng.random() < 0.4: ws[2:5] = ['la', 'tecnología', 'actual']
        if modo == 'formulas' and rng.random() < 0.5: ws[:0] = rng.choice(d['formulas']).split(' ')
        if rng.random() < 0.3: ws[:0] = rng.choice(d['conectores']).split(' ')
        if rng.random() < 0.08: ws.insert(rng.randrange(len(ws)), rng.choice(['Sr.', 'Dra.', 'etc.', 'J.', 'p.', '3.5', 'vs.']))
        s = ' '.join(ws)
        s = s[0].upper() + s[1:] if rng.random() < 0.9 else s
        s += rng.choice(['.', '.', '.', '.', '?', '!', '...', '."', '…', ''])
        partes.append(s)
        partes.append(rng.choice([' ', ' ', ' ', '  ', '\n', '\n\n', ' \t']))
    return ''.join(partes)

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class FrasesTest(unittest.TestCase):
    def test_a_mano(self):
        casos = [('Hola. Adiós.', ['Hola.', 'Adiós.']), ('El Sr. García vive en Madrid. Tiene 3.5 hijos.', ['El Sr. García vive en Madrid.', 'Tiene 3.5 hijos.']),
                 ('¿Y tú? ¡Yo bien! Vale...', ['¿Y tú?', '¡Yo bien!', 'Vale...']), ('Dijo: "Hola." Luego se fue.', ['Dijo: "Hola."', 'Luego se fue.']),
                 ('Una\nDos\n\nTres', ['Una', 'Dos', 'Tres']), ('J. Pérez llegó. etc. Sigue aquí', ['J. Pérez llegó. etc.', 'Sigue aquí']), ('', []), ('   \n  ', []),
                 ('Sin punto final', ['Sin punto final']), ('Mira el pág. 5 del libro. Es bueno.', ['Mira el pág. 5 del libro.', 'Es bueno.']), ('Fin... y sigue. Otra.', ['Fin... y sigue.', 'Otra.']),
                 ('Ve a www.ejemplo.es hoy. Gracias.', ['Ve a www.ejemplo.es hoy.', 'Gracias.']), ('Uno. dos. Tres.', ['Uno. dos.', 'Tres.']), ('Dra. Ruiz habló. Después Vd. escuchó.', ['Dra. Ruiz habló.', 'Después Vd. escuchó.']),
                 ('Línea con CRLF.\r\nOtra línea.', ['Línea con CRLF.', 'Otra línea.']), ('¿Qué? ¿Cómo?', ['¿Qué?', '¿Cómo?']), ('Costó 5 € (iva incl.). Y ya.', ['Costó 5 € (iva incl.).', 'Y ya.'])]
        r = node("console.log(JSON.stringify(IN.map(c => E.frases(c[0]))))", [[c[0]] for c in casos])
        for (t, esp), got in zip(casos, r): self.assertEqual(got, esp, repr(t))

    def test_frente_a_python(self):
        rng = random.Random(11); textos = [texto_azar(rng) for _ in range(300)]
        r = node("console.log(JSON.stringify(IN.map(t => [E.frases(t), E.palabras(t)])))", textos)
        for t, (fr, pal) in zip(textos, r):
            self.assertEqual(fr, frases(t), t); self.assertEqual(pal, palabras(t), t)

    def test_palabras(self):
        self.assertEqual(node("console.log(JSON.stringify(E.palabras('El ÑANDÚ come 3 piñas; ¿qué pingüino? e-mail')))"), ['el', 'ñandú', 'come', '3', 'piñas', 'qué', 'pingüino', 'e', 'mail'])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class ResumenTest(unittest.TestCase):
    def test_frente_a_python(self):
        rng = random.Random(5); textos = [texto_azar(rng) for _ in range(200)]
        ops = [{'porcentaje': 10}, {'porcentaje': 30}, {'porcentaje': 60}, {'cantidad': 3}, {'cantidad': 1}, {'cantidad': 50}]
        entradas = [[t, ops[i % len(ops)]] for i, t in enumerate(textos)]
        r = node("console.log(JSON.stringify(IN.map(c => E.resumir(c[0], c[1]))))", entradas)
        for (t, op), got in zip(entradas, r):
            esp = resumir(t, op.get('porcentaje'), op.get('cantidad'))
            self.assertEqual(got, esp, (t, op))

    def test_a_mano(self):
        t = ('La energía solar crece cada año. Los paneles solares son cada vez más baratos. A mí me gusta el helado de chocolate. La energía solar ya abastece a millones de hogares. '
             'Los paneles solares necesitan poco mantenimiento. Ayer llovió. El helado también está rico en verano.')
        r = node("console.log(JSON.stringify(E.resumir(IN, { cantidad: 2 })))", t)
        self.assertEqual(r['total'], 7); self.assertEqual(len(r['frases']), 2); self.assertEqual(r['indices'], sorted(r['indices']))
        self.assertTrue(all('solar' in f or 'paneles' in f for f in r['frases']), r['frases'])
        self.assertEqual([k['palabra'] for k in r['palabrasClave']], ['energía', 'helado', 'paneles', 'solar', 'solares'])   # todas dos veces: empate por orden alfabético
        self.assertEqual(r['indices'], [0, 3])                                                                              # puntuaciones 3,6 y 3,13 frente a 3,0 de la siguiente
        vacio = node("console.log(JSON.stringify(E.resumir(IN, {})))", '')
        self.assertEqual(vacio, {'frases': [], 'indices': [], 'total': 0, 'palabrasClave': []})
        corto = node("console.log(JSON.stringify(E.resumir(IN, {})))", 'Sí. No. Tal vez.')
        self.assertEqual(corto['frases'], [])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class AnalizadorTest(unittest.TestCase):
    def test_frente_a_python(self):
        rng = random.Random(21); textos = [texto_azar(rng) for _ in range(300)]
        r = node("console.log(JSON.stringify(IN.map(t => { const a = E.analizar(t); return { suficiente: a.suficiente, palabras: a.palabras, frases: a.frases, activas: a.activas, senales: a.senales.map(s => [s.id, s.activa, s.valor, s.lista || null]) }; })))", textos)
        activas_vistas = Counter()
        for t, got in zip(textos, r):
            esp = analizar(t)
            self.assertEqual((got['suficiente'], got['palabras'], got['frases']), (esp['suficiente'], esp['palabras'], esp['frases']), t)
            if not esp['suficiente']: self.assertEqual(got['senales'], []); continue
            self.assertEqual(got['activas'], esp['activas'], t)
            orden = ['uniformidad', 'arranques', 'formulas', 'conectores', 'variedad', 'trigramas']
            self.assertEqual([s[0] for s in got['senales']], orden)
            for sid, activa, valor, lista in got['senales']:
                a, v = esp['senales'][{'formulas': 'formulas'}.get(sid, sid)]
                self.assertEqual(activa, a, (sid, t))
                if v is None: self.assertIsNone(valor)
                else: self.assertAlmostEqual(valor, v, places=9, msg=sid)
                if activa: activas_vistas[sid] += 1
                if sid == 'formulas': self.assertEqual(lista, esp['lista_formulas'])
                if sid == 'trigramas': self.assertEqual(lista, esp['lista_tri'])
        for sid in ['uniformidad', 'arranques', 'formulas', 'conectores', 'variedad', 'trigramas']:
            self.assertGreater(activas_vistas[sid], 3, f'la señal {sid} casi nunca se activa en los textos de prueba: la comparación no sería significativa')

    def construir(self, frases_):
        return ' '.join(frases_)

    def test_texto_corto(self):
        a = node("console.log(JSON.stringify(E.analizar(IN)))", 'Esto es muy corto.')
        self.assertFalse(a['suficiente']); self.assertEqual(a['senales'], []); self.assertEqual(a['lectura'], 'insuficiente'); self.assertIn('al menos 100 palabras', a['resumen']); self.assertIn('no demuestra', a['aviso'])

    def test_solo_uniformidad(self):
        sin = ['alfa', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'omicron']   # palabras con significado inventado, todas distintas
        frases_ = []
        for i in range(10): frases_.append(' '.join(f'{p}{i}x{j}' for j, p in enumerate(sin)).capitalize() + '.')   # 10 frases de 12 palabras únicas
        a = node("console.log(JSON.stringify(E.analizar(IN)))", self.construir(frases_))
        act = {s['id']: s['activa'] for s in a['senales']}
        self.assertEqual(act, {'uniformidad': True, 'arranques': False, 'formulas': False, 'conectores': False, 'variedad': False, 'trigramas': False})
        self.assertEqual((a['activas'], a['lectura']), (1, 'algunas')); self.assertIn('1 de 6 señales', a['resumen'])

    def test_varias_senales(self):
        base = ['el sistema permite gestionar los datos de forma sencilla', 'la plataforma ofrece informes claros para todos los equipos', 'el producto reduce los errores en cada proceso importante',
                'el servicio mejora la comunicación entre los departamentos de la empresa', 'el modelo facilita las decisiones del comité en cada reunión semanal']
        frases_ = []
        for i, b in enumerate(base * 3):
            pre = ['En conclusión', 'Además', 'En resumen'][i % 3]
            frases_.append(f'{pre}, {b}, y cabe destacar que juega un papel fundamental en la era digital.'.replace('y cabe destacar que juega un papel fundamental', 'y cabe destacar que juega un papel'))
        a = node("console.log(JSON.stringify(E.analizar(IN)))", self.construir(frases_))
        act = {s['id']: s['activa'] for s in a['senales']}
        self.assertTrue(act['arranques'], act)                           # «en» abre 10 de las 15 frases (En conclusión, En resumen)
        self.assertTrue(act['conectores'] and act['formulas'] and act['trigramas'], act)
        self.assertGreaterEqual(a['activas'], 3); self.assertEqual(a['lectura'], 'varias')

    def test_ninguna(self):
        t = ('Ayer volví tarde a casa porque el tren se averió cerca de Zaragoza. Esperamos casi una hora bajo la lluvia. Mi hermana, que no soporta el frío, protestó sin parar; yo preferí callar. '
             'Al llegar, mi madre había dejado una sopa caliente en la mesa y una nota con letra apresurada. Cenamos en silencio. Después, ya en la cama, escuché cómo el viento movía las persianas del salón durante horas. '
             'Hoy, en cambio, amaneció despejado, con un cielo tan limpio que daban ganas de salir corriendo al monte con las zapatillas viejas y un bocadillo de tortilla envuelto en papel de aluminio.')
        a = node("console.log(JSON.stringify(E.analizar(IN)))", t)
        self.assertTrue(a['suficiente']); self.assertEqual(a['activas'], 0); self.assertEqual(a['lectura'], 'ninguna')

    def test_ademas_de_no_es_conector(self):
        fr = [f'Además de eso, el caso número {i} tiene su propio matiz y su propia historia particular para contar.' for i in range(8)]
        a = node("console.log(JSON.stringify(E.analizar(IN)))", ' '.join(fr))
        self.assertFalse([s for s in a['senales'] if s['id'] == 'conectores'][0]['activa'])

@unittest.skipUnless(shutil.which('node'), 'hace falta node')
class EditorTest(unittest.TestCase):
    def h(self, texto, nivel='normal', **op):
        return node("console.log(JSON.stringify(E.humanizar(IN[0], Object.assign({ nivel: IN[1] }, IN[2]))))", [texto, nivel, op])

    def test_aperturas_vacias(self):
        casos = [('Cabe destacar que el sistema funciona.', 'El sistema funciona.'), ('En la era digital actual, la gente lee menos.', 'La gente lee menos.'), ('En el mundo de hoy la gente lee menos.', 'La gente lee menos.'),
                 ('Hola. Es importante señalar que llueve.', 'Hola. Llueve.'), ('Primera línea.\nCabe destacar que esto va.\n', 'Primera línea.\nEsto va.\n'), ('Conviene recordar que el plazo acaba hoy.', 'El plazo acaba hoy.'),
                 ('Se sabe que cabe destacar poco.', 'Se sabe que cabe destacar poco.'), ('Vale la pena mencionar que el plazo acaba.', 'El plazo acaba.'),
                 ('Además, es importante destacar que el plazo acaba.', 'Además, el plazo acaba.'), ('Sin embargo, cabe señalar que no llegó.\nPor último, conviene recordar que sí.', 'Sin embargo, no llegó.\nPor último, sí.'),
                 ('Además cabe destacar que sí.', 'Además cabe destacar que sí.')]
        for t, esp in casos: self.assertEqual(self.h(t, 'suave')['texto'], esp, t)
        r = self.h('Cabe destacar que el sistema funciona.', 'suave')
        self.assertEqual(r['cambios'], [{'tipo': 'apertura', 'antes': 'Cabe destacar que', 'despues': ''}])

    def test_sustituciones(self):
        casos = [('Lo hizo con el fin de ayudar y a fin de que todos ganen.', 'Lo hizo para ayudar y para que todos ganen.'), ('A fin de cuentas, nada cambia.', 'A fin de cuentas, nada cambia.'), ('Se hará a fin de mes.', 'Se hará a fin de mes.'),
                 ('Debido a que llueve nos mojamos.', 'Porque llueve nos mojamos.'), ('Se debe a que sí.', 'Se debe a que sí.'), ('La red juega un papel fundamental en la vida.', 'La red es clave en la vida.'),
                 ('Los datos desempeñan un papel crucial en la ciencia.', 'Los datos son clave en la ciencia.'), ('Sin lugar a dudas, gana.', 'Sin duda, gana.'), ('En la actualidad, hoy en día, todo cambia.', 'Hoy, hoy, todo cambia.'),
                 ('Hay que llevar a cabo el plan.', 'Hay que realizar el plan.'), ('A fin de ayudar, vamos.', 'Para ayudar, vamos.'), ('Con la finalidad de aprender, estudia.', 'Para aprender, estudia.'),
                 ('Se hizo condefin de nada.', 'Se hizo condefin de nada.'), ('El papel juega fundamental.', 'El papel juega fundamental.')]
        for t, esp in casos: self.assertEqual(self.h(t, 'suave')['texto'], esp, t)

    def test_niveles_en_sustituciones(self):
        t = 'Con respecto a eso, es por ello que, en caso de que llueva, y a pesar de que nieve, con el objetivo de ir, en relación con ellos, salimos.'
        self.assertEqual(self.h(t, 'suave')['texto'], t); self.assertEqual(self.h(t, 'normal')['texto'], t)
        self.assertEqual(self.h(t, 'intenso')['texto'], 'Sobre eso, por eso, si llueva, y aunque nieve, para ir, sobre ellos, salimos.')

    def test_conectores(self):
        casos = [('Además, a. Además, b. Además, c.', 'normal', 'Además, a. B. C.'), ('Además, uno. Asimismo, dos. Por otro lado, tres. Cuatro. Igualmente, cinco.', 'normal', 'Además, uno. Asimismo, dos. Por otro lado, tres. Cuatro. Igualmente, cinco.'),
                 ('Además, uno. Asimismo, dos. Por otro lado, tres. Cuatro. Igualmente, cinco.', 'intenso', 'Además, uno. Dos. Tres. Cuatro. Igualmente, cinco.'), ('Además, a. Además, b.', 'suave', 'Además, a. Además, b.'),
                 ('Además de eso, vamos. Además, a. Además, b.', 'normal', 'Además de eso, vamos. Además, a. B.'), ('Además a. Además b.', 'normal', 'Además a. Además b.'), ('Sin embargo, a. Sin embargo, b.', 'normal', 'Sin embargo, a. Sin embargo, b.'),
                 ('Por otro lado, a.\nPor otro lado, b.', 'normal', 'Por otro lado, a.\nB.'), ('ADEMÁS, a. ADEMÁS, b.', 'normal', 'ADEMÁS, a. B.'), ('Además, cabe destacar que a. Además, cabe destacar que b.', 'normal', 'Además, cabe destacar que a. Cabe destacar que b.')]
        for t, nivel, esp in casos:
            r = self.h(t, nivel, aperturas=False) if t.startswith('Además, cabe') else self.h(t, nivel)
            self.assertEqual(r['texto'], esp, (t, nivel))
        r = self.h('Además, a. Además, b. Además, c.', 'normal'); self.assertEqual([c['tipo'] for c in r['cambios']], ['conector', 'conector']); self.assertEqual(r['cambios'][0]['antes'], 'Además,')
        self.assertEqual(self.h('Además, a. Además, b.', 'normal', conectores=False)['texto'], 'Además, a. Además, b.')

    def test_conectores_y_aperturas_juntos_es_estable(self):
        t = 'Además, cabe destacar que a. Además, cabe destacar que b. Además, es importante señalar que c.'
        r1 = self.h(t, 'normal'); r2 = self.h(r1['texto'], 'normal')
        self.assertEqual(r1['texto'], 'Además, a. B. C.')
        self.assertEqual(r2['texto'], r1['texto']); self.assertEqual(r2['cambios'], [])

    def test_frases_largas(self):
        def frase(n): return ' '.join(f'palabra{i}' for i in range(n)).capitalize() + '.'
        for n, esperado in ((46, {'suave': 1, 'normal': 1, 'intenso': 1}), (41, {'suave': 0, 'normal': 1, 'intenso': 1}), (31, {'suave': 0, 'normal': 0, 'intenso': 1}), (30, {'suave': 0, 'normal': 0, 'intenso': 0})):
            for nivel, k in esperado.items():
                r = self.h(frase(n) + ' Corta.', nivel); self.assertEqual(len(r['largas']), k, (n, nivel))
                if k: self.assertEqual(r['largas'][0]['palabras'], n)

    def test_restos(self):
        r = self.h('Es fundamental y cabe destacar eso. Hoy en día, no cabe duda.', 'suave')
        self.assertEqual(r['texto'], 'Es fundamental y cabe destacar eso. Hoy, no cabe duda.')
        self.assertEqual(sorted((x['frase'], x['veces']) for x in r['restos']), [('cabe destacar', 1), ('es fundamental', 1), ('no cabe duda', 1)])

    def test_no_toca_lo_demas(self):
        t = 'Mañana iremos al río con el perro.\n\n  Texto   con   espacios raros y ñandúes.\n'
        self.assertEqual(self.h(t, 'intenso')['texto'], t)
        self.assertEqual(self.h('', 'normal')['texto'], ''); self.assertEqual(self.h('', 'normal')['cambios'], [])
        self.assertEqual(self.h('Hola\r\nmundo', 'normal')['texto'], 'Hola\nmundo')

    def test_nivel_desconocido_es_normal(self):
        self.assertEqual(self.h('Además, a. Además, b.', 'loquesea')['texto'], 'Además, a. B.')

    def test_al_azar_no_rompe_el_texto(self):
        rng = random.Random(9); textos = [texto_azar(rng) for _ in range(150)]
        r = node("console.log(JSON.stringify(IN.map(t => ['suave', 'normal', 'intenso'].map(n => { const x = E.humanizar(t, { nivel: n }); return [x.texto, x.cambios.length, E.palabras(t).length, E.palabras(x.texto).length]; }))))", textos)
        for t, por_nivel in zip(textos, r):
            for texto, cambios, antes, despues in por_nivel:
                self.assertLessEqual(despues, antes); self.assertEqual(texto == t.replace('\r\n', '\n'), cambios == 0, (t, texto))

if __name__ == '__main__':
    unittest.main()
