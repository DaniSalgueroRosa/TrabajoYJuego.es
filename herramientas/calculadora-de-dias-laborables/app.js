(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var NACIONALES = [[1, 1], [1, 6], [5, 1], [8, 15], [10, 12], [11, 1], [12, 6], [12, 8], [12, 25]];
    function pascua(y) {
      var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
      var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
      return new Date(Date.UTC(y, Math.floor(n / 31) - 1, (n % 31) + 1, 12));
    }
    function parsear(texto) {                                                         // → { fechas: [Date], malas: [string] }
      var fechas = [], malas = [];
      texto.split(/[\n,;]+/).map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (t) {
        var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t) || (function (x) { return x && [x[0], x[3], x[2], x[1]]; })(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(t));
        var d = m ? TH.fechaUTC(m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2)) : null;
        if (d) fechas.push(d); else malas.push(t);
      });
      return { fechas: fechas, malas: malas };
    }
    TH.calculadora(raiz, {
      campos: [
        { id: 'inicio', tipo: 'fecha', etiqueta: 'Desde (incluido)', valor: 'hoy' },
        { id: 'fin', tipo: 'fecha', etiqueta: 'Hasta (incluido)' },
        { id: 'finde', tipo: 'select', etiqueta: 'Días de descanso semanal', valor: 'sd', opciones: [['sd', 'Sábado y domingo'], ['d', 'Solo domingo'], ['no', 'Ninguno (se trabaja todos los días)']] },
        { id: 'nacional', tipo: 'check', etiqueta: 'Descontar los festivos nacionales de España y el Viernes Santo', valor: false },
        { id: 'extras', tipo: 'area', etiqueta: 'Otros días libres (festivos de tu comunidad o local, puentes…)', ph: '2026-12-24\n31/12/2026', filas: 3, ancho: 'completo' }
      ],
      ejemplo: { inicio: '2026-01-01', fin: '2026-01-31', finde: 'sd', nacional: true },
      vacio: 'Elige las dos fechas para contar los días laborables.',
      calcular: function (v) {
        if (!v.inicio || !v.fin) return { vacio: true };
        var a = TH.fechaUTC(v.inicio), b = TH.fechaUTC(v.fin), avisos = [];
        if (!a || !b) return { error: 'Escribe fechas válidas.' };
        if (a > b) { var t = a; a = b; b = t; avisos.push('La fecha de inicio es posterior a la de fin, así que se han intercambiado.'); }
        if (TH.dias(a, b) > 36500) return { error: 'El periodo no puede superar los 100 años.' };
        var ex = parsear(v.extras);
        if (ex.malas.length) return { error: 'No reconozco esta fecha de «Otros días libres»: «' + ex.malas[0] + '». Usa el formato 24/12/2026 o 2026-12-24, una por línea.' };
        var fest = {}, y;
        ex.fechas.forEach(function (d) { fest[TH.iso(d)] = 1; });
        if (v.nacional) for (y = a.getUTCFullYear(); y <= b.getUTCFullYear(); y++) {
          NACIONALES.forEach(function (n) { fest[y + '-' + ('0' + n[0]).slice(-2) + '-' + ('0' + n[1]).slice(-2)] = 1; });
          fest[TH.iso(TH.sumarDias(pascua(y), -2))] = 1;
        }
        var tot = 0, lab = 0, fin = 0, fes = 0, d;
        for (d = a; d <= b; d = TH.sumarDias(d, 1)) {
          tot++;
          var w = d.getUTCDay();
          if (v.finde === 'sd' ? (w === 0 || w === 6) : v.finde === 'd' ? w === 0 : false) fin++; else if (fest[TH.iso(d)]) fes++; else lab++;
        }
        return { filas: [TH.fila('laborables', 'Días laborables', lab, 'n0'), TH.fila('total', 'Días naturales (con el primero y el último)', tot, 'n0'), TH.fila('finde', 'Días de descanso semanal', fin, 'n0'), TH.fila('festivos', 'Festivos entre semana descontados', fes, 'n0'),
            TH.fila('semanas', 'Equivale a semanas laborables de 5 días', lab / 5, 'n1')], avisos: avisos,
          notas: ['Los festivos nacionales de fecha fija son 1 y 6 de enero, 1 de mayo, 15 de agosto, 12 de octubre, 1 de noviembre, 6 y 8 de diciembre y 25 de diciembre, más el Viernes Santo. Cada comunidad autónoma puede sustituir algunos, trasladarlos al lunes o añadir los suyos: añade los de tu comunidad o localidad en «Otros días libres» y comprueba el calendario laboral oficial.'] };
      }
    });
  });
})();
