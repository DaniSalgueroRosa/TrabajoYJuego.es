(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    /* Datos de 2026 (Orden PJC/297/2026 y Ley 35/2006 del IRPF). Hay que revisarlos cada enero. */
    var SS = { cc: 4.70, des: 1.55, desTemp: 1.60, fp: 0.10, mei: 0.15 }, BASE_MAX = 5101.20;
    var ESTATAL = [[12450, 0.095], [20200, 0.12], [35200, 0.15], [60000, 0.185], [300000, 0.225], [Infinity, 0.245]];
    var AUTONOMICA = [[12450, 0.095], [20200, 0.12], [35200, 0.15], [60000, 0.185], [300000, 0.225], [Infinity, 0.225]];
    function escala(base, t) { var c = 0, ant = 0, i; for (i = 0; i < t.length && base > ant; i++) { c += (Math.min(base, t[i][0]) - ant) * t[i][1]; ant = t[i][0]; } return c; }
    function reduccion(r) { return r <= 14852 ? 7302 : r <= 17673.52 ? 7302 - 1.75 * (r - 14852) : r <= 19747.5 ? 2364.34 - 1.14 * (r - 17673.52) : 0; }
    function tipoSS(temp) { return SS.cc + (temp ? SS.desTemp : SS.des) + SS.fp + SS.mei; }
    function calculo(b, o) {
      var ss = Math.min(b / 12, BASE_MAX) * 12 * tipoSS(o.temporal) / 100, rnt = Math.max(0, b - ss - 2000), base = Math.max(0, rnt - reduccion(rnt));
      var irpf = o.irpf != null ? b * o.irpf / 100 : Math.max(0, escala(base, ESTATAL) + escala(base, AUTONOMICA) - escala(o.minimo, ESTATAL) - escala(o.minimo, AUTONOMICA));
      return { ss: ss, irpf: irpf, neto: b - ss - irpf };
    }
    function minimo(v) {
      var m = 5550 + (v.edad !== 'menor' ? 1150 : 0) + (v.edad === '75' ? 1400 : 0), k, tabla = [2400, 2700, 4000, 4500];
      for (k = 1; k <= v.hijos; k++) m += tabla[Math.min(k, 4) - 1];
      return m + 2800 * v.menores;
    }
    TH.calculadora(raiz, {
      campos: [
        { id: 'modo', tipo: 'select', etiqueta: '¿Qué conoces?', valor: 'bruto', ancho: 'completo', opciones: [['bruto', 'Conozco el sueldo bruto anual y quiero el neto'], ['neto', 'Conozco el neto anual que quiero cobrar y quiero el bruto']] },
        { id: 'bruto', etiqueta: 'Sueldo bruto anual', unidad: '€', ph: '30.000', mostrarSi: function (v) { return v.modo === 'bruto'; } },
        { id: 'netoDeseado', etiqueta: 'Sueldo neto anual que quieres', unidad: '€', ph: '23.000', mostrarSi: function (v) { return v.modo === 'neto'; }, ayuda: 'Es el neto de todo el año: el neto de una paga por el número de pagas.' },
        { id: 'pagas', tipo: 'select', etiqueta: 'Número de pagas', valor: '14', opciones: [['12', '12 pagas (extras prorrateadas)'], ['14', '14 pagas (dos extras)']] },
        { id: 'contrato', tipo: 'select', etiqueta: 'Tipo de contrato', valor: 'indef', opciones: [['indef', 'Indefinido'], ['temp', 'De duración determinada']] },
        { id: 'edad', tipo: 'select', etiqueta: 'Tu edad', valor: 'menor', opciones: [['menor', 'Menos de 65 años'], ['65', '65 a 74 años'], ['75', '75 años o más']] },
        { id: 'hijos', etiqueta: 'Hijos a tu cargo', valor: '0', entero: true, ayuda: 'Se supone que los declaras tú solo.' },
        { id: 'menores', etiqueta: 'De ellos, menores de 3 años', valor: '0', entero: true },
        { id: 'irpf', etiqueta: 'IRPF fijo que quieres usar (opcional)', unidad: '%', ph: '15', ayuda: 'Si conoces la retención de tu contrato, escríbela y se usará en lugar de la estimación.' }
      ],
      ejemplo: { modo: 'bruto', bruto: '30000', pagas: '14', contrato: 'indef' },
      calcular: function (v) {
        var o = { temporal: v.contrato === 'temp', irpf: isFinite(v.irpf) ? v.irpf : null }, hijos = isFinite(v.hijos) ? v.hijos : 0, menores = isFinite(v.menores) ? v.menores : 0;
        if (!TH.listos(v, v.modo === 'bruto' ? ['bruto'] : ['netoDeseado'])) return { vacio: true };
        if (hijos < 0 || hijos > 15 || hijos !== Math.floor(hijos) || menores < 0 || menores > hijos || menores !== Math.floor(menores)) return { error: 'Revisa los hijos: deben ser un número entero y los menores de 3 años no pueden ser más que el total.' };
        if (o.irpf !== null && (o.irpf < 0 || o.irpf > 60)) return { error: 'El IRPF fijo debe estar entre 0 y 60 %.' };
        o.minimo = minimo({ edad: v.edad, hijos: hijos, menores: menores });
        var b, r, avisos = [], pagas = +v.pagas;
        if (v.modo === 'bruto') { b = v.bruto; if (b <= 0 || b > 5000000) return { error: 'El sueldo bruto debe ser mayor que 0 y no superar 5.000.000 €.' }; r = calculo(b, o); }
        else {
          if (v.netoDeseado <= 0 || v.netoDeseado > 3000000) return { error: 'El neto debe ser mayor que 0 y no superar 3.000.000 €.' };
          var lo = v.netoDeseado, hi = v.netoDeseado * 4, i;
          for (i = 0; i < 200; i++) { b = (lo + hi) / 2; if (calculo(b, o).neto < v.netoDeseado) lo = b; else hi = b; }
          b = (lo + hi) / 2; r = calculo(b, o);
        }
        if (b / 12 > BASE_MAX) avisos.push('Tu sueldo supera la base máxima de cotización (5.101,20 € al mes): la Seguridad Social solo se calcula sobre ese tope. Por encima de él se aplica además una cuota de solidaridad que esta estimación no incluye.');
        var filas = [];
        if (v.modo === 'neto') filas.push(TH.fila('bruto', 'Sueldo bruto anual necesario', b, 'eur'));
        filas.push(TH.fila('neto', 'Sueldo neto anual', r.neto, 'eur'));
        if (pagas === 12) filas.push(TH.fila('mensual', 'Neto al mes (12 pagas)', r.neto / 12, 'eur'));
        else { filas.push(TH.fila('mensual', 'Neto de cada mes ordinario (12 pagas)', b / 14 - r.ss / 12 - r.irpf / 14, 'eur')); filas.push(TH.fila('extra', 'Neto de cada paga extra (2 pagas)', b / 14 - r.irpf / 14, 'eur')); }
        filas.push(TH.fila('ss', 'Seguridad Social a tu cargo (año)', r.ss, 'eur'), TH.fila('irpf', 'IRPF ' + (o.irpf !== null ? 'con el tipo fijado' : 'estimado') + ' (año)', r.irpf, 'eur'),
          TH.fila('retencion', 'IRPF sobre el bruto', r.irpf / b * 100, 'pct'), TH.fila('ss-tipo', 'Tipo de cotización del trabajador', tipoSS(o.temporal), 'pct'));
        return { filas: filas, avisos: avisos, notas: ['Estimación orientativa con datos de 2026: cotizaciones del trabajador (contingencias comunes 4,70 %, desempleo 1,55 % o 1,60 %, formación profesional 0,10 % y MEI 0,15 %) y una escala de IRPF de referencia (estatal más autonómica general) sin deducciones ni situaciones especiales. Tu comunidad autónoma puede tener otra escala y tu empresa aplica una retención según su propio cálculo. Tu nómina real puede diferir.'] };
      }
    });
  });
})();
