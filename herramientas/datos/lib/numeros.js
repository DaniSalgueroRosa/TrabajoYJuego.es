/* Números en español: a letras (hasta 30 cifras), de y a números romanos y letra de control del DNI y el NIE. Sin dependencias; se prueba en Node contra una
   implementación independiente en Python (pruebas/test_numeros_lib.py). Se carga con TH.script('lib/numeros.js') y queda en TH.numeros.
   N.parsear(texto)                       → { negativo, entera: '1234', decimal: '56' } leyendo «1.234,56», «1234.56», «1 234,56»… o null
   N.entero(cifras, { genero: 'm'|'f', forma: 'uno'|'un' })  → «ciento veintiuno», «ciento veintiún» (forma 'un' = delante de un nombre masculino)
   N.decimales(cifras, 'numero'|'digitos', { genero, forma }) → «cero cinco» (como número) o «cero cinco» cifra a cifra
   N.numero(texto, { genero: 'm'|'f', forma: 'uno'|'un', decimales: 'numero'|'digitos' })  → frase completa («menos tres coma catorce»)
   N.moneda(texto, { moneda: 'euro'|'dolar'|'peso', ceroCentimos })  → «mil euros con cincuenta céntimos»
   N.aRomano(n) · N.deRomano(texto, { estricto })
   N.letraDni(texto) → { tipo: 'DNI'|'NIE', numero, letra, completo } · N.revisarDni(texto) → { ok, motivo, esperada } */
(function (global) {
  'use strict';
  var N = {};
  var UNI = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  var DEC = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  var CEN = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  var GRANDES = ['', 'mil', 'millón', 'billón', 'trillón', 'cuatrillón', 'quintillón'];
  var PLURAL = ['', 'mil', 'millones', 'billones', 'trillones', 'cuatrillones', 'quintillones'];
  N.MAX_CIFRAS = 30;

  /* ---- Lectura de un número escrito a la española o a la inglesa ---- */
  N.parsear = function (texto) {
    var s = String(texto == null ? '' : texto).replace(/[\s  ]/g, '').replace(/[−–]/g, '-');
    var neg = false;
    if (s.charAt(0) === '-' || s.charAt(0) === '+') { neg = s.charAt(0) === '-'; s = s.slice(1); }
    if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
    var c = s.lastIndexOf(','), p = s.lastIndexOf('.'), dec = '', ent;
    var nc = (s.match(/,/g) || []).length, np = (s.match(/\./g) || []).length;
    if (c >= 0 && p >= 0) {
      var sepDec = c > p ? ',' : '.', sepMil = c > p ? '.' : ',';
      if ((sepDec === ',' ? nc : np) > 1) return null;
      var k = s.lastIndexOf(sepDec); ent = s.slice(0, k).split(sepMil).join(''); dec = s.slice(k + 1);
      if (s.slice(0, k).split(sepMil).some(function (g, i) { return i > 0 ? g.length !== 3 : false; })) return null;
    } else if (c >= 0) {
      if (nc > 1) { ent = s.split(',').join(''); } else { ent = s.slice(0, c); dec = s.slice(c + 1); }
    } else if (p >= 0) {
      if (np > 1) ent = s.split('.').join('');
      else if (/^[1-9]\d{0,2}$/.test(s.slice(0, p)) && s.length - p - 1 === 3) ent = s.split('.').join('');
      else { ent = s.slice(0, p); dec = s.slice(p + 1); }
    } else ent = s;
    if (ent === '') ent = '0';
    if (!/^\d+$/.test(ent) || (dec !== '' && !/^\d+$/.test(dec))) return null;
    ent = ent.replace(/^0+(?=\d)/, '');
    return { negativo: neg && !(/^0+$/.test(ent) && /^0*$/.test(dec)), entera: ent, decimal: dec };
  };

  /* ---- Letras ---- */
  function bajo100(n, uno) {                                     // 1 a 99; uno: «uno», «un» o «una»
    if (n < 30) {
      if (n === 1) return uno;
      if (n === 21) return uno === 'uno' ? 'veintiuno' : uno === 'un' ? 'veintiún' : 'veintiuna';
      return UNI[n];
    }
    var d = Math.floor(n / 10), u = n % 10;
    return DEC[d] + (u ? ' y ' + (u === 1 ? uno : UNI[u]) : '');
  }
  function centenas(n, uno, fem) {                               // 1 a 999
    if (n === 100) return 'cien';
    var c = Math.floor(n / 100), r = n % 100, w = CEN[c];
    if (fem && c >= 2) w = w.slice(0, -2) + 'as';
    return w + (w && r ? ' ' : '') + (r ? bajo100(r, uno) : '');
  }
  function grupo(g, unoFinal, fem, unoMil) {                     // 1 a 999999
    var hi = Math.floor(g / 1000), lo = g % 1000, w = '';
    if (hi) w = hi === 1 ? 'mil' : centenas(hi, unoMil, fem) + ' mil';
    if (lo) w += (w ? ' ' : '') + centenas(lo, unoFinal, fem);
    return w;
  }
  /* cifras: cadena de dígitos sin signo ni decimales. Los grupos de seis cifras se llaman millón, billón, trillón… (10^6, 10^12, 10^18…) y los de tres, mil. */
  N.entero = function (cifras, op) {
    op = op || {};
    cifras = String(cifras).replace(/^0+(?=\d)/, '');
    if (!/^\d+$/.test(cifras)) throw new Error('Solo se admiten cifras.');
    if (cifras.length > N.MAX_CIFRAS) throw new Error('El número es demasiado grande: se admiten hasta ' + N.MAX_CIFRAS + ' cifras.');
    if (/^0+$/.test(cifras)) return 'cero';
    var fem = op.genero === 'f', final = fem ? 'una' : op.forma === 'un' ? 'un' : 'uno', unoMil = fem ? 'una' : 'un';
    var grupos = [], i = cifras.length, k, partes = [];
    while (i > 0) { grupos.push(parseInt(cifras.slice(Math.max(0, i - 6), i), 10)); i -= 6; }
    for (k = grupos.length - 1; k >= 0; k--) {
      var g = grupos[k];
      if (!g) continue;
      if (k === 0) partes.push(grupo(g, final, fem, unoMil));
      else partes.push(g === 1 ? 'un ' + GRANDES[k + 1] : grupo(g, 'un', false, 'un') + ' ' + PLURAL[k + 1]);
    }
    return partes.join(' ');
  };
  N.terminaEnMillon = function (cifras) {                        // ¿acaba en un grupo de seis ceros y es de un millón o más? (para «un millón de euros»)
    cifras = String(cifras).replace(/^0+(?=\d)/, '');
    return cifras.length > 6 && /^0{6}$/.test(cifras.slice(-6));
  };
  N.decimales = function (cifras, modo, op) {
    op = op || {};
    if (!/^\d+$/.test(cifras)) throw new Error('Solo se admiten cifras.');
    if (modo === 'digitos') return cifras.split('').map(function (d) { return UNI[+d]; }).join(' ');
    var ceros = cifras.match(/^0*/)[0].length, resto = cifras.slice(ceros), w = [], i;
    for (i = 0; i < ceros; i++) w.push('cero');
    if (resto) w.push(N.entero(resto, { genero: op.genero, forma: op.forma }));
    return w.join(' ');
  };
  N.numero = function (texto, op) {
    op = op || {};
    var p = N.parsear(texto);
    if (!p) throw new Error('No entiendo «' + texto + '» como un número.');
    var dec = p.decimal !== '';
    /* Con decimales, el género y el apócope («veintiún metros») van en lo último que se dice, que es la parte decimal */
    var w = N.entero(p.entera, { genero: op.genero, forma: dec ? 'uno' : op.forma });
    if (dec) w += ' coma ' + N.decimales(p.decimal, op.decimales === 'digitos' ? 'digitos' : 'numero', { genero: op.genero, forma: op.forma });
    return (p.negativo ? 'menos ' : '') + w;
  };
  var MONEDAS = {
    euro: { s: 'euro', p: 'euros', cs: 'céntimo', cp: 'céntimos' },
    dolar: { s: 'dólar', p: 'dólares', cs: 'centavo', cp: 'centavos' },
    peso: { s: 'peso', p: 'pesos', cs: 'centavo', cp: 'centavos' }
  };
  N.MONEDAS = MONEDAS;
  N.moneda = function (texto, op) {
    op = op || {};
    var m = MONEDAS[op.moneda || 'euro'], p = N.parsear(texto);
    if (!m) throw new Error('Moneda no admitida.');
    if (!p) throw new Error('No entiendo «' + texto + '» como un importe.');
    if (p.decimal.length > 2 && !/^0+$/.test(p.decimal.slice(2))) throw new Error('Un importe admite como mucho dos decimales (los céntimos).');
    var cent = p.decimal === '' ? 0 : parseInt((p.decimal + '0').slice(0, 2), 10), ent = p.entera, unidad = ent === '1' ? m.s : m.p;
    var w = N.entero(ent, { forma: 'un' }) + (N.terminaEnMillon(ent) ? ' de' : '') + ' ' + unidad;
    if (cent) w += ' con ' + N.entero(String(cent), { forma: 'un' }) + ' ' + (cent === 1 ? m.cs : m.cp);
    else if (op.ceroCentimos) w += ' con cero ' + m.cp;
    return (p.negativo ? 'menos ' : '') + w;
  };

  /* ---- Romanos ---- */
  var ROMANOS = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  var RE_ROMANO = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  N.aRomano = function (n) {
    if (!(n >= 1 && n <= 3999) || n !== Math.floor(n)) throw new Error('Los números romanos van del 1 al 3999.');
    var s = '', i;
    for (i = 0; i < ROMANOS.length; i++) while (n >= ROMANOS[i][0]) { s += ROMANOS[i][1]; n -= ROMANOS[i][0]; }
    return s;
  };
  N.deRomano = function (texto, op) {
    var t = String(texto).trim().toUpperCase();
    if (!t) throw new Error('No hay ningún número romano.');
    if (!/^[IVXLCDM]+$/.test(t)) throw new Error('«' + texto.trim() + '» tiene letras que no son romanas (solo I, V, X, L, C, D y M).');
    if (RE_ROMANO.test(t)) { var tot = 0, i, v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; for (i = 0; i < t.length; i++) { var a = v[t.charAt(i)], b = i + 1 < t.length ? v[t.charAt(i + 1)] : 0; tot += a < b ? -a : a; } return tot; }
    if (op && op.estricto === false) {
      if (/(IIII|VV|XXXX|LL|CCCC|DD)/.test(t) && !/(IIIII|VVV|XXXXX|LLL|CCCCC|DDD)/.test(t)) { var s2 = 0, vv = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }, j; for (j = 0; j < t.length; j++) { var x = vv[t.charAt(j)], y = j + 1 < t.length ? vv[t.charAt(j + 1)] : 0; s2 += x < y ? -x : x; } if (s2 >= 1 && s2 <= 3999) return s2; }
    }
    throw new Error('«' + t + '» no es un número romano bien formado. Por ejemplo, 4 se escribe IV y 1994 se escribe MCMXCIV.');
  };

  /* ---- Letra del DNI y del NIE ---- */
  var LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
  N.LETRAS_DNI = LETRAS_DNI;
  N.letraDni = function (texto) {
    var t = String(texto).toUpperCase().replace(/[\s.\-]/g, '');
    var m = /^([XYZ])(\d{1,7})$/.exec(t), tipo, num, base;
    if (m) { tipo = 'NIE'; num = m[1] + ('0000000' + m[2]).slice(-7); base = String('XYZ'.indexOf(m[1])) + ('0000000' + m[2]).slice(-7); }
    else if ((m = /^(\d{1,8})$/.exec(t))) { tipo = 'DNI'; num = ('00000000' + m[1]).slice(-8); base = num; }
    else return null;
    var letra = LETRAS_DNI.charAt(parseInt(base, 10) % 23);
    return { tipo: tipo, numero: num, letra: letra, completo: num + letra };
  };
  N.revisarDni = function (texto) {
    var t = String(texto).toUpperCase().replace(/[\s.\-]/g, '');
    var m = /^(.*\d)([A-Z])$/.exec(t);
    if (!m) { var r = N.letraDni(t); return r ? { ok: null, tipo: r.tipo, numero: r.numero, esperada: r.letra, completo: r.completo } : { ok: null, error: true }; }
    var r2 = N.letraDni(m[1]);
    if (!r2) return { ok: null, error: true };
    return { ok: r2.letra === m[2], tipo: r2.tipo, numero: r2.numero, esperada: r2.letra, escrita: m[2], completo: r2.completo };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
  else { global.TH = global.TH || {}; global.TH.numeros = N; }
})(typeof window !== 'undefined' ? window : globalThis);
