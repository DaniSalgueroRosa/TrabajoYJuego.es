"""Las fórmulas de herramientas/datos/lib/negocio.js (préstamos, TAE, precios, amortización de equipos, jubilación, alquiler o compra, comisiones, Amazon y Etsy)
contrastadas con un cálculo independiente en Python: simulaciones mes a mes en lugar de fórmulas cerradas, y casos que se pueden comprobar a mano."""
import json, math, subprocess, unittest
from pathlib import Path

LIB = Path(__file__).resolve().parent.parent / 'herramientas' / 'datos' / 'lib' / 'negocio.js'


def js(funcion, casos):
    """Ejecuta N.<funcion> para cada caso (lista de argumentos) en una sola llamada a Node y devuelve los resultados."""
    codigo = f"const N = require({json.dumps(str(LIB))}); const casos = JSON.parse(process.argv[1]); console.log(JSON.stringify(casos.map(a => N[{json.dumps(funcion)}](...a))));"
    r = subprocess.run(['node', '-e', codigo, json.dumps(casos)], capture_output=True, text=True, timeout=120)
    if r.returncode: raise AssertionError(r.stderr[-1500:])
    return json.loads(r.stdout)


def saldo_tras_pagar(P, tin, n, pago):
    """Simulación independiente: se paga «pago» cada mes durante n meses y se mira lo que queda."""
    s, r = P, tin / 1200
    for _ in range(n): s = s * (1 + r) - pago
    return s


class Prestamos(unittest.TestCase):
    CASOS = [(150000, 3, 300), (20000, 7.5, 60), (1000, 0, 12), (500000, 4.25, 240), (8000, 12.9, 36), (75000, 0.5, 120)]

    def test_cuota_amortiza_justo(self):
        for (P, tin, n), c in zip(self.CASOS, js('cuota', [list(x) for x in self.CASOS])):
            with self.subTest(P=P, tin=tin, n=n):
                self.assertAlmostEqual(saldo_tras_pagar(P, tin, n, c), 0, delta=1e-6 * P)
        self.assertAlmostEqual(js('cuota', [[150000, 3, 300]])[0], 711.3, delta=0.05)
        self.assertEqual(js('cuota', [[1200, 0, 12]])[0], 100)

    def test_principal_maximo_es_la_inversa(self):
        for (P, tin, n), c in zip(self.CASOS, js('cuota', [list(x) for x in self.CASOS])):
            p = js('principalMaximo', [[c, tin, n]])[0]
            self.assertAlmostEqual(p, P, delta=1e-6 * P)

    def test_cuadro(self):
        for (P, tin, n), cu in zip(self.CASOS, js('cuadro', [[*x, 0] for x in self.CASOS])):
            with self.subTest(P=P, tin=tin, n=n):
                f = cu['filas']; self.assertEqual(len(f), n)
                self.assertAlmostEqual(sum(x['capital'] for x in f), P, delta=1e-6 * P)
                self.assertAlmostEqual(cu['intereses'], sum(x['interes'] for x in f), delta=1e-6)
                self.assertAlmostEqual(cu['total'], P + cu['intereses'], delta=1e-6 * P)
                self.assertEqual(f[-1]['saldo'], 0)
                self.assertTrue(all(abs(f[k]['saldo'] - (f[k - 1]['saldo'] if k else P) + f[k]['capital']) < 1e-6 * P for k in range(n)))
        # primer mes: intereses = saldo × tipo / 12
        cu = js('cuadro', [[150000, 3, 300, 0]])[0]; self.assertAlmostEqual(cu['filas'][0]['interes'], 375, places=9)

    def test_carencia(self):
        P, tin, n, g = 100000, 6, 120, 12
        cu = js('cuadro', [[P, tin, n, g]])[0]; f = cu['filas']
        for k in range(g): self.assertAlmostEqual(f[k]['pago'], P * tin / 1200, places=9); self.assertEqual(f[k]['capital'], 0)
        self.assertAlmostEqual(cu['cuotaCarencia'], 500, places=9)
        self.assertAlmostEqual(saldo_tras_pagar(P, tin, g, 500), P, delta=1e-6)               # tras la carencia se debe lo mismo
        self.assertAlmostEqual(saldo_tras_pagar(P, tin, n - g, cu['cuota']), 0, delta=1e-5)
        self.assertGreater(cu['intereses'], js('cuadro', [[P, tin, n, 0]])[0]['intereses'])

    def test_tae(self):
        # sin comisiones, la TAE es (1 + TIN/12)^12 − 1
        for tin in (0.0, 3.0, 7.5, 12.9):
            r = js('prestamo', [[{'importe': 20000, 'tin': tin, 'meses': 48}]])[0]
            self.assertAlmostEqual(r['tae'], ((1 + tin / 1200) ** 12 - 1) * 100, delta=1e-6)
        # con comisión y seguro: el valor actual de los flujos al tipo de la TAE es cero
        o = {'importe': 15000, 'tin': 6, 'meses': 36, 'apertura': 1.5, 'gastos': 40, 'seguro': 9.5}
        r = js('prestamo', [[o]])[0]; i = (1 + r['tae'] / 100) ** (1 / 12) - 1
        van = o['importe'] - r['apertura'] + sum(-(f['pago'] + o['seguro']) / (1 + i) ** f['mes'] for f in r['cuadro']['filas'])
        self.assertAlmostEqual(van, 0, delta=1e-6)
        self.assertAlmostEqual(r['apertura'], 15000 * 0.015 + 40, places=9)
        self.assertAlmostEqual(r['coste'], r['cuadro']['intereses'] + r['apertura'] + 9.5 * 36, places=6)
        self.assertGreater(r['tae'], 6.17)
        # más comisión, más TAE
        mas = js('prestamo', [[{**o, 'apertura': 3}]])[0]; self.assertGreater(mas['tae'], r['tae'])
        # si las comisiones se comen todo lo recibido no hay TAE
        self.assertIsNone(js('prestamo', [[{**o, 'apertura': 100}]])[0]['tae'])


class Precios(unittest.TestCase):
    def test_margen_sobre_ventas(self):
        r = js('precioIdeal', [[{'coste': 12, 'extra': 3, 'fijo': 0.25, 'comision': 3, 'objetivo': 40, 'base': 'ventas'}]])[0]
        self.assertAlmostEqual(r['precio'], 15.25 / 0.57, places=9)
        self.assertAlmostEqual(r['margen'], 40, places=9)
        self.assertAlmostEqual(r['beneficio'], r['precio'] - 15.25 - r['precio'] * 0.03, places=9)

    def test_recargo_sobre_coste(self):
        r = js('precioIdeal', [[{'coste': 10, 'extra': 0, 'fijo': 0, 'comision': 0, 'objetivo': 50, 'base': 'coste'}]])[0]
        self.assertAlmostEqual(r['precio'], 15, places=9); self.assertAlmostEqual(r['recargo'], 50, places=9); self.assertAlmostEqual(r['margen'], 100 / 3, places=9)
        r = js('precioIdeal', [[{'coste': 20, 'extra': 5, 'fijo': 0.3, 'comision': 2.9, 'objetivo': 30, 'base': 'coste'}]])[0]
        self.assertAlmostEqual(r['recargo'], 30, places=9)

    def test_imposible(self):
        self.assertIsNone(js('precioIdeal', [[{'coste': 10, 'comision': 40, 'objetivo': 60, 'base': 'ventas'}]])[0])
        self.assertIsNone(js('precioIdeal', [[{'coste': 10, 'comision': 100, 'objetivo': 10, 'base': 'coste'}]])[0])

    def test_comisiones(self):
        self.assertAlmostEqual(js('comision', [[100, 2.9, 0.35]])[0], 3.25, places=9)
        for neto, pct, fijo in ((50, 2.9, 0.35), (19.99, 1.5, 0.25), (1000, 3.15, 0.25)):
            b = js('brutoParaNeto', [[neto, pct, fijo]])[0]; self.assertAlmostEqual(b - js('comision', [[b, pct, fijo]])[0], neto, places=9)


class Amortizacion(unittest.TestCase):
    def test_lineal_por_vida(self):
        f = js('amortizar', [[{'valor': 3000, 'residual': 0, 'metodo': 'lineal', 'vida': 4}]])[0]
        self.assertEqual([round(x['cuota'], 6) for x in f], [750] * 4); self.assertEqual(f[-1]['neto'], 0)

    def test_lineal_por_coeficiente(self):
        f = js('amortizar', [[{'valor': 1200, 'residual': 0, 'metodo': 'lineal', 'coef': 25}]])[0]
        self.assertEqual(len(f), 4); self.assertAlmostEqual(f[0]['cuota'], 300, places=9)
        f = js('amortizar', [[{'valor': 1000, 'residual': 0, 'metodo': 'lineal', 'coef': 33}]])[0]       # 33 % no divide 100: el último año es más pequeño
        self.assertEqual(len(f), 4); self.assertAlmostEqual(f[-1]['cuota'], 10, places=9); self.assertAlmostEqual(f[-1]['neto'], 0, places=9)
        f = js('amortizar', [[{'valor': 1000, 'residual': 200, 'metodo': 'lineal', 'vida': 4}]])[0]
        self.assertAlmostEqual(f[0]['cuota'], 200, places=9); self.assertAlmostEqual(f[-1]['neto'], 200, places=9)

    def test_digitos(self):
        f = js('amortizar', [[{'valor': 1000, 'residual': 0, 'metodo': 'digitos', 'vida': 4}]])[0]
        self.assertEqual([round(x['cuota'], 9) for x in f], [400, 300, 200, 100])
        f = js('amortizar', [[{'valor': 5500, 'residual': 500, 'metodo': 'digitos', 'vida': 5}]])[0]
        self.assertAlmostEqual(sum(x['cuota'] for x in f), 5000, places=9); self.assertAlmostEqual(f[0]['cuota'], 5000 * 5 / 15, places=9)

    def test_porcentaje_constante(self):
        f = js('amortizar', [[{'valor': 10000, 'residual': 0, 'metodo': 'constante', 'vida': 3, 'pct': 20}]])[0]
        self.assertEqual([round(x['cuota'], 6) for x in f], [2000, 1600, 1280]); self.assertAlmostEqual(f[-1]['neto'], 5120, places=6)
        f = js('amortizar', [[{'valor': 1000, 'residual': 900, 'metodo': 'constante', 'vida': 4, 'pct': 50}]])[0]
        self.assertAlmostEqual(f[-1]['neto'], 900, places=9)                                           # nunca por debajo del valor residual


def simular_jubilacion(o, aporte):
    """Mes a mes y en euros de hoy: se ahorra hasta la jubilación y se retira después. Devuelve el saldo al llegar a edadFin."""
    inf = o['inflacion'] / 100
    i1 = ((1 + o['rentAntes'] / 100) / (1 + inf)) ** (1 / 12) - 1; i2 = ((1 + o['rentDespues'] / 100) / (1 + inf)) ** (1 / 12) - 1
    s = o['ahorro']
    for _ in range(round((o['edadJub'] - o['edad']) * 12)): s = s * (1 + i1) + aporte
    for _ in range(round((o['edadFin'] - o['edadJub']) * 12)): s = s * (1 + i2) - max(0, o['gasto'] - o['pension'])
    return s


class Jubilacion(unittest.TestCase):
    BASE = {'edad': 35, 'edadJub': 67, 'edadFin': 90, 'gasto': 2000, 'pension': 1100, 'inflacion': 2.5, 'rentAntes': 6, 'rentDespues': 3, 'ahorro': 10000, 'aporte': None}

    def test_la_aportacion_necesaria_deja_el_saldo_en_cero(self):
        for cambios in ({}, {'ahorro': 0}, {'rentAntes': 2.5, 'rentDespues': 2.5}, {'edad': 55, 'edadJub': 65, 'edadFin': 85}, {'pension': 0, 'gasto': 1500}, {'rentAntes': 0, 'rentDespues': 0, 'inflacion': 0}):
            with self.subTest(cambios=cambios):
                o = {**self.BASE, **cambios}; r = js('jubilacion', [[o]])[0]
                self.assertAlmostEqual(simular_jubilacion(o, r['aporteNecesario']), 0, delta=1e-4 * max(1, r['necesario']))

    def test_con_una_aportacion_dada(self):
        o = {**self.BASE, 'aporte': 300}; r = js('jubilacion', [[o]])[0]
        # el capital proyectado, retirado a la renta posible, deja el saldo en cero
        o2 = {**o, 'gasto': r['rentaPosible'], 'pension': self.BASE['pension']}
        self.assertAlmostEqual(simular_jubilacion(o2, 300), 0, delta=1e-3 * r['capital'])
        self.assertAlmostEqual(r['cobertura'], r['capital'] / r['necesario'] * 100, places=9)
        self.assertGreater(r['capitalNominal'], r['capital'])

    def test_ya_hay_suficiente(self):
        r = js('jubilacion', [[{**self.BASE, 'ahorro': 5_000_000}]])[0]
        self.assertEqual(r['aporteNecesario'], 0)
        r = js('jubilacion', [[{**self.BASE, 'pension': 2500}]])[0]
        self.assertEqual((r['retirada'], r['necesario'], r['aporteNecesario']), (0, 0, 0))

    def test_a_mano(self):
        # sin rentabilidad real: necesario = retirada × meses; aportación = (necesario − ahorro) / meses de ahorro
        o = {**self.BASE, 'rentAntes': 2, 'rentDespues': 2, 'inflacion': 2, 'ahorro': 6000, 'edad': 60, 'edadJub': 65, 'edadFin': 80, 'gasto': 1500, 'pension': 1000}
        r = js('jubilacion', [[o]])[0]
        self.assertAlmostEqual(r['necesario'], 500 * 180, places=6); self.assertAlmostEqual(r['aporteNecesario'], (90000 - 6000) / 60, places=6)


def simular_vivienda(o):
    """Segunda implementación independiente, año a año con bucles anidados en lugar de un solo bucle mensual."""
    entrada = o['precio'] * o['entradaPct'] / 100; deuda = o['precio'] - entrada; r = o['tin'] / 1200; n = round(o['plazo'] * 12)
    cuota = deuda * r / (1 - (1 + r) ** -n) if deuda > 0 and r > 0 else (deuda / n if deuda > 0 else 0)
    inv = (1 + o['rentInversion'] / 100) ** (1 / 12) - 1; cart_a = entrada + o['precio'] * o['gastosCompraPct'] / 100; cart_c = 0.0; salida = []; mes = 0
    for anio in range(round(o['horizonte'])):
        for _ in range(12):
            mes += 1; pago = 0.0
            if mes <= n and deuda > 1e-12:
                interes = deuda * r
                if mes == n: pago = deuda + interes; deuda = 0.0
                else: pago = cuota; deuda -= (cuota - interes)
            cart_a *= 1 + inv; cart_c *= 1 + inv
            d = pago + o['costesAnuales'] / 12 * (1 + o['inflacion'] / 100) ** anio - o['alquiler'] * (1 + o['subidaAlquiler'] / 100) ** anio
            if d > 0: cart_a += d
            else: cart_c += -d
        valor = o['precio'] * (1 + o['revalorizacion'] / 100) ** (anio + 1)
        salida.append((valor * (1 - o['ventaPct'] / 100) - deuda + cart_c, cart_a, deuda))
    return salida


class AlquilerVsCompra(unittest.TestCase):
    BASE = {'precio': 250000, 'entradaPct': 20, 'gastosCompraPct': 10, 'tin': 3, 'plazo': 30, 'costesAnuales': 2400, 'inflacion': 2, 'revalorizacion': 2, 'ventaPct': 4,
            'alquiler': 950, 'subidaAlquiler': 2, 'rentInversion': 4, 'horizonte': 25}

    def test_contra_la_simulacion_independiente(self):
        for cambios in ({}, {'tin': 0, 'rentInversion': 0}, {'plazo': 15, 'horizonte': 20}, {'entradaPct': 100}, {'alquiler': 2500}, {'revalorizacion': -1, 'subidaAlquiler': 4}, {'horizonte': 3}):
            with self.subTest(cambios=cambios):
                o = {**self.BASE, **cambios}; r = js('alquilerVsCompra', [[o]])[0]; ref = simular_vivienda(o)
                self.assertEqual(len(r['filas']), len(ref))
                for f, (compra, alquila, deuda) in zip(r['filas'], ref):
                    self.assertAlmostEqual(f['compra'], compra, delta=1e-6 * max(1, abs(compra))); self.assertAlmostEqual(f['alquila'], alquila, delta=1e-6 * max(1, abs(alquila)))
                    self.assertAlmostEqual(f['deuda'], deuda, delta=1e-6 * max(1, o['precio']))
                    self.assertAlmostEqual(f['diferencia'], f['compra'] - f['alquila'], places=6)

    def test_caso_a_mano(self):
        # todo a cero salvo la hipoteca: se paga 96.000 € en 10 años (800 €/mes) frente a 1.000 € de alquiler
        o = {'precio': 120000, 'entradaPct': 20, 'gastosCompraPct': 0, 'tin': 0, 'plazo': 10, 'costesAnuales': 0, 'inflacion': 0, 'revalorizacion': 0, 'ventaPct': 0,
             'alquiler': 1000, 'subidaAlquiler': 0, 'rentInversion': 0, 'horizonte': 10}
        r = js('alquilerVsCompra', [[o]])[0]; f = r['filas'][-1]
        self.assertAlmostEqual(r['cuota'], 800, places=9)
        self.assertAlmostEqual(f['deuda'], 0, places=6); self.assertAlmostEqual(f['compra'], 120000 + 200 * 120, places=6); self.assertAlmostEqual(f['alquila'], 24000, places=6)
        self.assertEqual(r['cruce'], 1)

    def test_cruce(self):
        r = js('alquilerVsCompra', [[{**self.BASE, 'alquiler': 400, 'horizonte': 10}]])[0]
        self.assertIsNone(r['cruce']); self.assertLess(r['filas'][-1]['diferencia'], 0)
        r = js('alquilerVsCompra', [[{**self.BASE, 'horizonte': 30}]])[0]
        if r['cruce'] is not None:
            f = {x['anio']: x for x in r['filas']}; self.assertGreaterEqual(f[r['cruce']]['diferencia'], 0)
            if r['cruce'] > 1: self.assertLess(f[r['cruce'] - 1]['diferencia'], 0)


class Amazon(unittest.TestCase):
    BASE = {'precio': 29.99, 'iva': 21, 'coste': 8, 'refPct': 15, 'refMin': 0.3, 'logistica': 5.5, 'entrada': 0.6, 'plan': 'individual', 'unidadesMes': 0, 'publicidad': 2, 'devolucionesPct': 3, 'costeDevolucion': 4, 'otros': 0}

    def test_a_mano(self):
        r = js('amazon', [[self.BASE]])[0]; neto = 29.99 / 1.21
        self.assertAlmostEqual(r['neto'], neto, places=9); self.assertAlmostEqual(r['tarifa'], 29.99 * 0.15, places=9)
        esperado = neto - 29.99 * 0.15 - (8 + 5.5 + 0.6 + 0.99 + 0.03 * 4) - 2
        self.assertAlmostEqual(r['beneficio'], esperado, places=9); self.assertAlmostEqual(r['margen'], esperado / neto * 100, places=9)
        self.assertAlmostEqual(r['roi'], esperado / 8.6 * 100, places=9)
        self.assertAlmostEqual(r['acosEquilibrio'], (esperado + 2) / 29.99 * 100, places=9)

    def test_plan_profesional_reparte_la_cuota(self):
        a = js('amazon', [[{**self.BASE, 'plan': 'profesional', 'unidadesMes': 100}]])[0]; b = js('amazon', [[self.BASE]])[0]
        self.assertAlmostEqual(a['cuotaPlan'], 0.39, places=9); self.assertAlmostEqual(b['cuotaPlan'], 0.99, places=9)

    def test_tarifa_minima(self):
        r = js('amazon', [[{**self.BASE, 'precio': 1.5, 'refPct': 15}]])[0]; self.assertEqual(r['tarifa'], 0.3)       # 15 % de 1,50 € son 0,225: se cobra el mínimo
        r = js('amazon', [[{**self.BASE, 'precio': 1.5, 'refMin': 0}]])[0]; self.assertAlmostEqual(r['tarifa'], 0.225, places=9)

    def test_precio_minimo_da_beneficio_cero(self):
        for cambios in ({}, {'precio': 1.5}, {'refPct': 8, 'iva': 10}, {'plan': 'profesional', 'unidadesMes': 30}, {'coste': 40, 'logistica': 9}, {'refMin': 0}):
            with self.subTest(cambios=cambios):
                o = {**self.BASE, 'publicidad': 0, **cambios}; p = js('amazon', [[o]])[0]['precioMinimo']
                self.assertAlmostEqual(js('amazon', [[{**o, 'precio': p}]])[0]['beneficio'], 0, places=7)
        self.assertIsNone(js('amazon', [[{**self.BASE, 'refPct': 90}]])[0]['precioMinimo'])                              # con IVA y comisión no se llega nunca


class Etsy(unittest.TestCase):
    BASE = {'total': 30, 'iva': 0, 'coste': 9, 'envioReal': 3, 'embalaje': 0.5, 'publicacion': 0.2, 'transPct': 6.5, 'procPct': 4, 'procFijo': 0.3, 'regPct': 0.88, 'offsite': 0, 'publicidad': 0, 'otros': 0}

    def test_pedido_de_30_euros(self):
        r = js('etsy', [[self.BASE]])[0]
        self.assertAlmostEqual(r['transaccion'], 1.95, places=9); self.assertAlmostEqual(r['procesamiento'], 1.5, places=9); self.assertAlmostEqual(r['regulatoria'], 0.264, places=9)
        self.assertAlmostEqual(r['tarifas'], 1.95 + 1.5 + 0.264 + 0.2, places=9)
        self.assertAlmostEqual(r['beneficio'], 30 - r['tarifas'] - 12.5, places=9)

    def test_con_iva_y_publicidad_externa(self):
        o = {**self.BASE, 'total': 36.3, 'iva': 21, 'offsite': 15}; r = js('etsy', [[o]])[0]
        self.assertAlmostEqual(r['base'], 30, places=9); self.assertAlmostEqual(r['transaccion'], 1.95, places=9); self.assertAlmostEqual(r['offsite'], 4.5, places=9)
        self.assertAlmostEqual(r['procesamiento'], 36.3 * 0.04 + 0.3, places=9)                                          # el procesamiento se calcula sobre lo que paga el comprador

    def test_total_minimo_da_beneficio_cero(self):
        for cambios in ({}, {'iva': 21}, {'offsite': 12}, {'publicidad': 1.2, 'coste': 20}):
            with self.subTest(cambios=cambios):
                o = {**self.BASE, **cambios}; t = js('etsy', [[o]])[0]['totalMinimo']
                self.assertAlmostEqual(js('etsy', [[{**o, 'total': t}]])[0]['beneficio'], 0, places=7)


if __name__ == '__main__':
    unittest.main()
