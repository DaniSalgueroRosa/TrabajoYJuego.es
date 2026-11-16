/* Cálculos de calendario para el generador de calendarios y el planificador semanal. Sin dependencias.
   Fechas con mes de 0 a 11 como en JavaScript. Se carga con TH.script('lib/calendario.js') y queda en TH.cal (también se puede usar con require en Node).
   CAL.mes(anio, mes, lunes) → { anio, mes, nombre, dias, semanas: [{ iso, dias: [día | null × 7] }] }   (lunes = true: la semana empieza en lunes y se informa del número ISO)
   CAL.festivos(anio) → { 'AAAA-MM-DD': 'nombre' } con los festivos nacionales de España de fecha fija y el Viernes Santo.
   CAL.semanaISO(anio, mes, dia) → { anio, semana }.  CAL.pascua(anio) → [mes, día].
   CAL.limpiar(fuente, texto) y CAL.partir(fuente, texto, tamano, ancho) preparan texto para dibujarlo con pdf-lib. */
(function (global) {
  'use strict';
  var CAL = {};
  CAL.MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  CAL.DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  CAL.INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  function utc(a, m, d) { return new Date(Date.UTC(a, m, d, 12)); }
  function p2(n) { return ('0' + n).slice(-2); }
  CAL.iso = function (a, m, d) { var f = utc(a, m, d); return f.getUTCFullYear() + '-' + p2(f.getUTCMonth() + 1) + '-' + p2(f.getUTCDate()); };
  CAL.diasMes = function (a, m) { return new Date(Date.UTC(a, m + 1, 0)).getUTCDate(); };
  CAL.diaSemana = function (a, m, d) { return (utc(a, m, d).getUTCDay() + 6) % 7; };               // 0 = lunes … 6 = domingo
  CAL.semanaISO = function (a, m, d) {
    var f = utc(a, m, d), lun = (f.getUTCDay() + 6) % 7, jue = new Date(f.getTime() + (3 - lun) * 86400000), y = jue.getUTCFullYear();
    return { anio: y, semana: Math.floor(Math.round((jue - Date.UTC(y, 0, 1, 12)) / 86400000) / 7) + 1 };
  };
  CAL.semanasDelAnio = function (a) { return CAL.semanaISO(a, 11, 28).semana; };
  CAL.pascua = function (y) {                                                                     // algoritmo gregoriano anónimo (Meeus/Jones/Butcher)
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return [Math.floor(n / 31) - 1, (n % 31) + 1];
  };
  CAL.festivos = function (a) {
    var f = {}, p = CAL.pascua(a);
    [[0, 1, 'Año Nuevo'], [0, 6, 'Epifanía del Señor'], [4, 1, 'Fiesta del Trabajo'], [7, 15, 'Asunción de la Virgen'], [9, 12, 'Fiesta Nacional de España'], [10, 1, 'Todos los Santos'], [11, 6, 'Día de la Constitución'], [11, 8, 'Inmaculada Concepción'], [11, 25, 'Navidad']]
      .forEach(function (x) { f[CAL.iso(a, x[0], x[1])] = x[2]; });
    f[CAL.iso(a, p[0], p[1] - 2)] = 'Viernes Santo';
    return f;
  };
  CAL.mes = function (a, m, lunes) {
    var n = CAL.diasMes(a, m), off = lunes ? CAL.diaSemana(a, m, 1) : utc(a, m, 1).getUTCDay(), filas = Math.ceil((off + n) / 7), semanas = [], r, c;
    for (r = 0; r < filas; r++) {
      var dias = [];
      for (c = 0; c < 7; c++) { var d = r * 7 + c - off + 1; dias.push(d >= 1 && d <= n ? d : null); }
      semanas.push({ iso: lunes ? CAL.semanaISO(a, m, r * 7 - off + 1).semana : null, dias: dias });
    }
    return { anio: a, mes: m, nombre: CAL.MESES[m], dias: n, semanas: semanas };
  };
  CAL.capitalizar = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };

  /* ---- Texto para pdf-lib: las fuentes estándar solo escriben caracteres de Windows-1252 */
  CAL.limpiar = function (fuente, texto) {
    var ok = {}, perdidos = 0, salida = '';
    fuente.getCharacterSet().forEach(function (c) { ok[c] = true; });
    Array.from(String(texto).replace(/[\r\n\t]+/g, ' ')).forEach(function (ch) {
      var cp = ch.codePointAt(0);
      if (cp < 32) return;
      if (ok[cp]) salida += ch; else { salida += '?'; perdidos++; }
    });
    return { texto: salida, perdidos: perdidos };
  };
  CAL.partir = function (fuente, texto, tam, ancho) {
    var lineas = [], actual = '';
    function cabe(t) { return fuente.widthOfTextAtSize(t, tam) <= ancho; }
    String(texto).split(/\s+/).filter(Boolean).forEach(function (p) {
      var prueba = actual ? actual + ' ' + p : p;
      if (cabe(prueba)) { actual = prueba; return; }
      if (actual) { lineas.push(actual); actual = ''; }
      while (!cabe(p) && p.length > 1) {                                                        // palabra más ancha que la columna: se parte
        var k = p.length - 1;
        while (k > 1 && !cabe(p.slice(0, k))) k--;
        lineas.push(p.slice(0, k)); p = p.slice(k);
      }
      actual = p;
    });
    if (actual) lineas.push(actual);
    return lineas;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CAL;
  else { global.TH = global.TH || {}; global.TH.cal = CAL; }
})(typeof window !== 'undefined' ? window : globalThis);
