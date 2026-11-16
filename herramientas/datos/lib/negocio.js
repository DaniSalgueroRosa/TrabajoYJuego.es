/* NEGOCIO Y FINANZAS: las fórmulas de las calculadoras de negocio, de dinero personal y de venta online, sin nada de pantalla.
   Todo son funciones puras: reciben números y devuelven números u objetos con números (porcentajes como 21, no 0,21; importes en euros).
   Se carga con TH.script('lib/negocio.js') y cuelga de TH.negocio; en Node (para las pruebas) se obtiene con require().
   Nada se guarda ni se envía a ningún sitio. Las pruebas están en pruebas/test_negocio_lib.py, que lo contrasta con un cálculo independiente. */
(function (global) {
  'use strict';
  var N = {};

  /* Para campos opcionales: un número válido tal cual, y 0 si el campo está vacío o no es un número. */
  N.n0 = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };

  /* ------------------------------------------------------------ Préstamos */

  /* Cuota mensual constante (sistema francés) de un préstamo de P euros a un tipo nominal anual «tin» (%) en n meses. */
  N.cuota = function (P, tin, n) {
    var r = tin / 1200;
    return r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
  };

  /* Importe máximo que se puede pedir para pagar como mucho «cuota» al mes a «tin» % durante n meses. */
  N.principalMaximo = function (cuota, tin, n) {
    var r = tin / 1200;
    return r === 0 ? cuota * n : cuota * (1 - Math.pow(1 + r, -n)) / r;
  };

  /* Cuadro de amortización mensual. carencia = meses iniciales en los que solo se pagan intereses (0 si no hay).
     Devuelve { cuota (la de después de la carencia), cuotaCarencia, filas: [{ mes, pago, interes, capital, saldo }], intereses, total }. */
  N.cuadro = function (P, tin, n, carencia) {
    carencia = carencia || 0;
    var r = tin / 1200, resto = n - carencia, c = N.cuota(P, tin, resto), saldo = P, filas = [], ti = 0, tp = 0, k, i, cap, pago;
    for (k = 1; k <= n; k++) {
      i = saldo * r;
      if (k <= carencia) { cap = 0; pago = i; }
      else { cap = k === n ? saldo : c - i; pago = i + cap; }
      saldo = k === n ? 0 : saldo - cap;
      ti += i; tp += pago;
      filas.push({ mes: k, pago: pago, interes: i, capital: cap, saldo: saldo });
    }
    return { cuota: c, cuotaCarencia: P * r, filas: filas, intereses: ti, total: tp };
  };

  /* TAE (%) a partir de los flujos mensuales: flujos[0] es lo que recibes de verdad (positivo) y el resto son pagos (negativos).
     Se busca por bisección el tipo mensual que anula el valor actual, y se anualiza: (1 + i)^12 − 1. Devuelve NaN si no hay solución. */
  N.tae = function (flujos) {
    function f(i) { var s = 0, k; for (k = 0; k < flujos.length; k++) s += flujos[k] / Math.pow(1 + i, k); return s; }
    var lo = 0, hi = 1, k, m;
    if (!(flujos[0] > 0) || f(lo) > 1e-9 * flujos[0]) return NaN;
    for (k = 0; k < 200; k++) { m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
    return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  };

  /* Un préstamo con comisión de apertura (% del importe), gastos fijos (€) y seguro mensual (€). Devuelve el cuadro más el coste total y la TAE. */
  N.prestamo = function (o) {
    var cu = N.cuadro(o.importe, o.tin, o.meses, o.carencia || 0), seguro = o.seguro || 0, apertura = o.importe * (o.apertura || 0) / 100 + (o.gastos || 0);
    var flujos = [o.importe - apertura], k;
    for (k = 0; k < cu.filas.length; k++) flujos.push(-(cu.filas[k].pago + seguro));
    return { cuadro: cu, apertura: apertura, seguros: seguro * o.meses, coste: cu.intereses + apertura + seguro * o.meses, total: cu.total + apertura + seguro * o.meses, tae: N.tae(flujos) };
  };

  /* ------------------------------------------------------------ Precios y márgenes */

  /* Precio de venta sin IVA que da el margen o el recargo pedido.
     o = { coste (producto), extra (envío, embalaje…), fijo (€ por venta), comision (% del precio), objetivo (%), base: 'ventas' (margen sobre el precio) | 'coste' (recargo sobre coste + extra) }.
     Devuelve null si el margen y la comisión no caben (suman 100 % o más). */
  N.precioIdeal = function (o) {
    var costes = o.coste + (o.extra || 0), com = (o.comision || 0) / 100, p;
    if (o.base === 'coste') {
      if (com >= 1) return null;
      p = (costes + (o.fijo || 0) + costes * o.objetivo / 100) / (1 - com);
    } else {
      var d = 1 - com - o.objetivo / 100;
      if (d <= 0) return null;
      p = (costes + (o.fijo || 0)) / d;
    }
    var comision = p * com, beneficio = p - costes - (o.fijo || 0) - comision;
    return { precio: p, comision: comision, beneficio: beneficio, margen: beneficio / p * 100, recargo: costes > 0 ? beneficio / costes * 100 : NaN };
  };

  /* ------------------------------------------------------------ Amortización de equipos */

  /* Cuadro de amortización de un bien. o = { valor, residual, metodo: 'lineal' | 'digitos' | 'constante', vida (años), coef (% anual, solo lineal con coeficiente), pct (% anual, solo constante) }.
     La base amortizable es valor − residual. Devuelve [{ anio, cuota, acumulada, neto }]. */
  N.amortizar = function (o) {
    var base = o.valor - (o.residual || 0), filas = [], acum = 0, neto = o.valor, k, cuota, n, suma;
    function poner(c) { c = Math.max(0, c); acum += c; neto = o.valor - acum; filas.push({ anio: filas.length + 1, cuota: c, acumulada: acum, neto: neto }); }
    if (o.metodo === 'digitos') {
      n = Math.round(o.vida); suma = n * (n + 1) / 2;
      for (k = 1; k <= n; k++) poner(base * (n - k + 1) / suma);
    } else if (o.metodo === 'constante') {
      n = Math.round(o.vida);
      for (k = 1; k <= n; k++) poner(Math.min(neto * o.pct / 100, neto - (o.residual || 0)));
    } else if (o.coef) {
      var anual = base * o.coef / 100;
      while (acum < base - 1e-9 && filas.length < 1000) poner(Math.min(anual, base - acum));
    } else {
      n = Math.round(o.vida);
      for (k = 1; k <= n; k++) poner(base / n);
    }
    return filas;
  };

  /* ------------------------------------------------------------ Jubilación */

  /* Cuánto hace falta para vivir sin trabajar entre edadJub y edadFin, todo en euros de hoy (se descuenta la inflación).
     o = { edad, edadJub, edadFin, gasto (€/mes), pension (€/mes), inflacion (%), rentAntes (% anual nominal), rentDespues (% anual nominal), ahorro (ya acumulado), aporte (€/mes, o null) }.
     Los pagos y las aportaciones se hacen al final de cada mes. Devuelve el capital necesario, la aportación que lo consigue y, si se da «aporte», lo que se alcanzaría. */
  N.jubilacion = function (o) {
    var inf = o.inflacion / 100, real1 = (1 + o.rentAntes / 100) / (1 + inf) - 1, real2 = (1 + o.rentDespues / 100) / (1 + inf) - 1;
    var i1 = Math.pow(1 + real1, 1 / 12) - 1, i2 = Math.pow(1 + real2, 1 / 12) - 1, n1 = Math.round((o.edadJub - o.edad) * 12), m = Math.round((o.edadFin - o.edadJub) * 12);
    var retirada = Math.max(0, o.gasto - (o.pension || 0));
    function renta(i, k) { return i === 0 ? k : (1 - Math.pow(1 + i, -k)) / i; }          // valor actual de k pagos de 1
    function acum(i, k) { return i === 0 ? k : (Math.pow(1 + i, k) - 1) / i; }              // valor futuro de k aportaciones de 1
    var necesario = retirada * renta(i2, m), delAhorro = (o.ahorro || 0) * Math.pow(1 + i1, n1), factor = acum(i1, n1);
    var falta = Math.max(0, necesario - delAhorro), aporteNecesario = n1 > 0 ? falta / factor : 0;
    var r = { necesario: necesario, retirada: retirada, delAhorro: delAhorro, aporteNecesario: aporteNecesario, anosAhorrando: n1 / 12, anosCobrando: m / 12,
      necesarioNominal: necesario * Math.pow(1 + inf, n1 / 12), realAntes: real1 * 100, realDespues: real2 * 100 };
    if (o.aporte != null && isFinite(o.aporte)) {
      r.capital = delAhorro + o.aporte * factor;
      r.cobertura = necesario > 0 ? r.capital / necesario * 100 : 100;
      r.rentaPosible = r.capital / renta(i2, m) + (o.pension || 0);                          // lo que podrías gastar al mes (euros de hoy) con ese capital y la pensión
      r.capitalNominal = r.capital * Math.pow(1 + inf, n1 / 12);
    }
    return r;
  };

  /* ------------------------------------------------------------ Alquiler o compra */

  /* Compara, año a año, el patrimonio de quien compra y el de quien alquila e invierte lo que se ahorra.
     o = { precio, entradaPct, gastosCompraPct, tin, plazo (años de hipoteca), costesAnuales (IBI, comunidad, seguro, mantenimiento: € al año de hoy), inflacion (%), revalorizacion (% anual),
           ventaPct (costes de vender, % del valor), alquiler (€/mes), subidaAlquiler (% anual), rentInversion (% anual), horizonte (años) }.
     Cada mes, quien desembolsa menos invierte la diferencia. Devuelve { filas: [{ anio, valor, deuda, compra, alquila, diferencia }], cruce (primer año en que comprar supera a alquilar, o null), cuota }. */
  N.alquilerVsCompra = function (o) {
    var entrada = o.precio * o.entradaPct / 100, gastos = o.precio * o.gastosCompraPct / 100, principal = o.precio - entrada, n = Math.round(o.plazo * 12), meses = Math.round(o.horizonte * 12);
    var r = o.tin / 1200, cuota = principal > 0 ? N.cuota(principal, o.tin, n) : 0, deuda = principal, iInv = Math.pow(1 + o.rentInversion / 100, 1 / 12) - 1;
    var carteraAlq = entrada + gastos, carteraCompra = 0, filas = [], cruce = null, m, anio, alquilerMes, propMes, pago, interes, d, valor;
    for (m = 1; m <= meses; m++) {
      anio = Math.floor((m - 1) / 12);
      alquilerMes = o.alquiler * Math.pow(1 + o.subidaAlquiler / 100, anio);
      propMes = o.costesAnuales / 12 * Math.pow(1 + o.inflacion / 100, anio);
      pago = 0;
      if (m <= n && deuda > 0) {
        interes = deuda * r; pago = m === n ? deuda + interes : cuota; deuda = m === n ? 0 : Math.max(0, deuda - (pago - interes));
      }
      carteraAlq *= 1 + iInv; carteraCompra *= 1 + iInv;
      d = pago + propMes - alquilerMes;
      if (d > 0) carteraAlq += d; else carteraCompra -= d;
      if (m % 12 === 0) {
        valor = o.precio * Math.pow(1 + o.revalorizacion / 100, m / 12);
        var compra = valor * (1 - o.ventaPct / 100) - deuda + carteraCompra;
        filas.push({ anio: m / 12, valor: valor, deuda: deuda, compra: compra, alquila: carteraAlq, diferencia: compra - carteraAlq });
        if (cruce === null && compra >= carteraAlq) cruce = m / 12;
      }
    }
    return { filas: filas, cruce: cruce, cuota: cuota, entrada: entrada, gastos: gastos };
  };

  /* ------------------------------------------------------------ Comisiones de cobro (PayPal, Stripe…) */

  /* Comisión de un cobro: porcentaje más tarifa fija. */
  N.comision = function (importe, pct, fijo) { return importe * pct / 100 + (fijo || 0); };
  /* Importe que hay que cobrar para que, descontada la comisión, te queden «neto» euros. */
  N.brutoParaNeto = function (neto, pct, fijo) { return (neto + (fijo || 0)) / (1 - pct / 100); };

  /* ------------------------------------------------------------ Venta en Amazon */

  /* Beneficio de una venta en Amazon. Amazon calcula su tarifa por referencia sobre el precio total con IVA.
     o = { precio (con IVA), iva (%), coste (producto), refPct (%), refMin (€), logistica (€ por unidad: gestión de Amazon o envío propio), entrada (€ por unidad: envío al almacén o al taller),
           plan: 'individual' | 'profesional', unidadesMes, publicidad (€ por unidad), devolucionesPct (%), costeDevolucion (€ por devolución), otros (€ por unidad) }. */
  N.amazon = function (o) {
    var neto = o.precio / (1 + o.iva / 100), tarifa = Math.max(o.precio * o.refPct / 100, o.refMin || 0);
    var cuotaPlan = o.plan === 'profesional' ? (o.unidadesMes > 0 ? 39 / o.unidadesMes : 0) : 0.99;
    var devol = (o.devolucionesPct || 0) / 100 * (o.costeDevolucion || 0);
    var fijos = o.coste + (o.logistica || 0) + (o.entrada || 0) + cuotaPlan + devol + (o.otros || 0);
    var antesPub = neto - tarifa - fijos, beneficio = antesPub - (o.publicidad || 0);
    var invertido = o.coste + (o.entrada || 0), pMin, p1;
    p1 = fijos / (1 / (1 + o.iva / 100) - o.refPct / 100);
    pMin = p1 > 0 && p1 * o.refPct / 100 >= (o.refMin || 0) ? p1 : (fijos + (o.refMin || 0)) * (1 + o.iva / 100);
    if (1 / (1 + o.iva / 100) - o.refPct / 100 <= 0) pMin = NaN;
    return { neto: neto, tarifa: tarifa, cuotaPlan: cuotaPlan, devoluciones: devol, antesPublicidad: antesPub, beneficio: beneficio, margen: beneficio / neto * 100,
      roi: invertido > 0 ? beneficio / invertido * 100 : NaN, acosEquilibrio: antesPub / o.precio * 100, acosEquilibrioSinIva: antesPub / neto * 100, precioMinimo: pMin };
  };

  /* ------------------------------------------------------------ Venta en Etsy */

  /* Beneficio de un pedido en Etsy desde España.
     o = { total (lo que paga el comprador por artículo + envío, con IVA si lo lleva), iva (% incluido en el total), coste, envioReal, embalaje, publicacion (€ por venta), transPct, procPct, procFijo, regPct,
           offsite (0, 12 o 15 %), publicidad (€ por pedido en anuncios de Etsy), otros }.
     La tarifa por transacción y la de Offsite Ads se calculan sobre el total sin impuestos; el procesamiento de pagos y la regulatoria, sobre el total pagado. */
  N.etsy = function (o) {
    var base = o.total / (1 + (o.iva || 0) / 100), trans = base * o.transPct / 100, proc = o.total * o.procPct / 100 + o.procFijo, reg = o.total * o.regPct / 100;
    var off = base * (o.offsite || 0) / 100, tarifas = trans + proc + reg + (o.publicacion || 0) + off + (o.publicidad || 0);
    var costes = o.coste + (o.envioReal || 0) + (o.embalaje || 0) + (o.otros || 0), beneficio = base - tarifas - costes, k = (1 / (1 + (o.iva || 0) / 100)) * (1 - o.transPct / 100 - (o.offsite || 0) / 100) - o.procPct / 100 - o.regPct / 100;
    var fijos = o.procFijo + (o.publicacion || 0) + (o.publicidad || 0) + costes;
    return { base: base, transaccion: trans, procesamiento: proc, regulatoria: reg, offsite: off, publicacion: o.publicacion || 0, publicidad: o.publicidad || 0, tarifas: tarifas, costes: costes,
      beneficio: beneficio, margen: beneficio / base * 100, pctTarifas: tarifas / base * 100, totalMinimo: k > 0 ? fijos / k : NaN };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
  else { global.TH = global.TH || {}; global.TH.negocio = N; }
})(typeof window !== 'undefined' ? window : globalThis);
