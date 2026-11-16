/* Análisis y edición de estilo en español: frases, resumen por extracción, señales de texto genérico (que NO son una prueba de autoría) y editor de muletillas.
   Sin dependencias; se prueba en Node contra una implementación independiente en Python (pruebas/test_estilo_lib.py). Se carga con TH.script('lib/estilo.js') y queda en TH.estilo.
   E.palabras(texto)                  → palabras en minúscula (letras y cifras; las tildes y la ñ cuentan como letras)
   E.frases(texto)                    → frases (corta por . ! ? … y por saltos de línea; no corta tras abreviaturas como «Sr.» ni tras iniciales)
   E.resumir(texto, { porcentaje, cantidad }) → { frases, indices, total, palabrasClave }
   E.analizar(texto)                  → { palabras, frases, suficiente, senales[], activas, total, lectura, resumen, aviso }
   E.humanizar(texto, { nivel: 'suave'|'normal'|'intenso', aperturas, sustituciones, conectores }) → { texto, cambios[], largas[], restos[] } */
(function (global) {
  'use strict';
  var E = {};
  var LET = '0-9A-Za-zÀ-ÖØ-öø-ÿ';
  var RE_PAL = new RegExp('[' + LET + ']+', 'g');
  var RE_LETRA = new RegExp('[' + LET + ']');

  E.AVISO = 'Esta herramienta no demuestra quién ha escrito un texto. Un escritor humano puede dar muchas de estas señales (estilo académico, administrativo, traducido o escrito en un idioma que no es el propio) y un texto generado con IA puede no dar ninguna. No uses el resultado para acusar ni para sancionar a nadie.';
  E.MIN_PALABRAS = 100;

  E.STOP = ('a al algo algunas algunos ante antes aquel aquella aquí así aunque cada como cómo con contra cual cuál cuando cuándo de del desde donde dónde durante e el él ella ellas ello ellos en entre era eran eras eres es esa esas ese eso esos esta está '
    + 'estaba estaban estado estamos están estar estas este esto estos estoy fue fueron ha haber había habían han has hasta hay he hemos la las le les lo los más me mi mis mismo mucho muchos muy nada ni no nos nosotros nuestra nuestras nuestro nuestros o os otra otras otro otros '
    + 'para pero poco por porque puede pueden que qué quien quién se sea ser si sí sido sin sobre solo son soy su sus también tan tanto te tiene tienen tengo todas todo todos tu tus un una unas uno unos usted ustedes vez vosotros y ya yo').split(' ');
  var STOP = {};
  E.STOP.forEach(function (w) { STOP[w] = true; });

  E.ABREVIATURAS = ['sr', 'sra', 'srta', 'dr', 'dra', 'ud', 'uds', 'vd', 'vds', 'pág', 'págs', 'núm', 'nº', 'p', 'pp', 'ej', 'vs', 'cap', 'art', 'aprox', 'tel', 'av', 'avda', 'dpto', 'ee', 'uu', 'ed', 'vol', 'fig', 'sta', 'sto', 'lic', 'ing', 'prof'];
  var ABREV = {};
  E.ABREVIATURAS.forEach(function (w) { ABREV[w] = true; });

  E.palabras = function (texto) { return String(texto == null ? '' : texto).toLowerCase().match(RE_PAL) || []; };

  /* ---------------------------------------------------------------- frases */
  var RE_MAYUS = /[A-ZÀ-ÖØ-Þ0-9¿¡«“"—–\-]/;
  E.frases = function (texto) {
    var t = String(texto == null ? '' : texto).replace(/\r\n?/g, '\n'), out = [], ini = 0, i = 0, n = t.length;
    function empujar(fin) { var s = t.slice(ini, fin).trim(); if (s) out.push(s); ini = fin; }
    while (i < n) {
      var c = t.charAt(i);
      if (c === '\n') { empujar(i); ini = i + 1; i++; continue; }
      if (c === '.' || c === '!' || c === '?' || c === '…') {
        var j = i;
        while (j < n && '.!?…'.indexOf(t.charAt(j)) >= 0) j++;
        var largo = j - i;
        while (j < n && '"\'”’»)]'.indexOf(t.charAt(j)) >= 0) j++;
        if (j >= n || /\s/.test(t.charAt(j))) {
          var k = j;
          while (k < n && /[ \t ]/.test(t.charAt(k))) k++;
          var parte = (k >= n || t.charAt(k) === '\n') || RE_MAYUS.test(t.charAt(k));
          if (parte && c === '.' && largo === 1) {
            var previa = /([A-Za-zÀ-ÿº]+)$/.exec(t.slice(Math.max(0, i - 12), i));
            if (previa) {
              var w = previa[1], ant = i - w.length - 1 >= 0 ? t.charAt(i - w.length - 1) : '';
              if (ABREV[w.toLowerCase()] || (w.length === 1 && /[A-ZÁÉÍÓÚÑ]/.test(w) && !RE_LETRA.test(ant))) parte = false;
            }
          }
          if (parte) { empujar(j); i = j; continue; }
        }
        i = j; continue;
      }
      i++;
    }
    empujar(n);
    return out;
  };

  /* ---------------------------------------------------------------- resumen */
  function contenido(w) { return w.length >= 3 && !STOP[w]; }
  E.resumir = function (texto, op) {
    op = op || {};
    var fr = E.frases(texto), pal = fr.map(E.palabras), tf = {}, i, j;
    pal.forEach(function (ws) { ws.forEach(function (w) { if (contenido(w)) tf[w] = (tf[w] || 0) + 1; }); });
    var cand = [];
    for (i = 0; i < fr.length; i++) {
      if (pal[i].length < 4) continue;
      var vistos = {}, suma = 0, n = 0;
      for (j = 0; j < pal[i].length; j++) { var w = pal[i][j]; if (contenido(w) && !vistos[w]) { vistos[w] = true; suma += tf[w]; n++; } }
      var punt = n ? suma / Math.sqrt(n) : 0;
      if (i === 0 && fr.length > 3) punt *= 1.2;
      cand.push({ i: i, p: punt });
    }
    var k = op.cantidad ? Math.floor(op.cantidad) : Math.max(1, Math.floor(fr.length * (op.porcentaje || 30) / 100 + 0.5));
    k = Math.min(k, cand.length);
    var elegidas = cand.slice().sort(function (a, b) { return b.p - a.p || a.i - b.i; }).slice(0, k).map(function (x) { return x.i; }).sort(function (a, b) { return a - b; });
    var claves = Object.keys(tf).filter(function (w) { return tf[w] >= 2; }).sort(function (a, b) { return tf[b] - tf[a] || (a < b ? -1 : a > b ? 1 : 0); }).slice(0, 8);
    return { frases: elegidas.map(function (x) { return fr[x]; }), indices: elegidas, total: fr.length, palabrasClave: claves.map(function (w) { return { palabra: w, veces: tf[w] }; }) };
  };

  /* ---------------------------------------------------------------- señales */
  E.FORMULAS = ['en la era digital', 'en el mundo actual', 'en el mundo de hoy', 'en el panorama actual', 'en la actualidad', 'hoy en día', 'cabe destacar', 'cabe mencionar', 'cabe señalar', 'es importante destacar', 'es importante señalar', 'es importante mencionar',
    'es fundamental', 'es crucial', 'es esencial', 'juega un papel', 'desempeña un papel', 'juegan un papel', 'desempeñan un papel', 'en conclusión', 'en resumen', 'en definitiva', 'en última instancia', 'sin lugar a dudas', 'sin duda alguna', 'no cabe duda',
    'a lo largo de la historia', 'un abanico de', 'una amplia gama de', 'un sinfín de', 'en el ámbito de', 'en el contexto de', 'pone de manifiesto', 'pone de relieve', 'resulta fundamental', 'resulta crucial', 'de suma importancia', 'de vital importancia',
    'sumergirse en', 'un testimonio de', 'el panorama actual', 'cada vez más importante'];
  E.CONECTORES = ['además', 'asimismo', 'por otro lado', 'por otra parte', 'igualmente', 'de igual manera', 'de igual forma', 'del mismo modo', 'por su parte', 'en este sentido', 'así pues', 'de este modo', 'de esta manera', 'por lo tanto', 'por consiguiente', 'por ende',
    'en consecuencia', 'por tanto', 'sin embargo', 'no obstante', 'en primer lugar', 'en segundo lugar', 'en tercer lugar', 'por último', 'finalmente', 'en conclusión', 'en resumen', 'en definitiva', 'en suma', 'ahora bien'];

  function porLargo(lista) { return lista.map(function (f) { return f.split(' '); }).sort(function (a, b) { return b.length - a.length; }); }
  var FORM_T = E.FORMULAS.map(function (f) { return { texto: f, t: f.split(' ') }; });
  var CONEC_T = porLargo(E.CONECTORES);
  function empiezaCon(ws, pos, t) { for (var i = 0; i < t.length; i++) if (ws[pos + i] !== t[i]) return false; return true; }
  function contarFormulas(ws) {
    var res = [], i, j;
    FORM_T.forEach(function (f) {
      var n = 0;
      for (i = 0; i + f.t.length <= ws.length; i++) if (empiezaCon(ws, i, f.t)) n++;
      if (n) res.push({ frase: f.texto, veces: n });
    });
    return res;
  }
  E.contarFormulas = function (texto) { return contarFormulas(E.palabras(texto)); };
  function redondear(x, d) { var p = Math.pow(10, d); return Math.floor(x * p + 0.5) / p; }

  E.analizar = function (texto) {
    var ws = E.palabras(texto), fr = E.frases(texto), pal = fr.map(E.palabras).filter(function (x) { return x.length; }), S = pal.length, N = ws.length;
    var res = { palabras: N, frases: S, suficiente: N >= E.MIN_PALABRAS, senales: [], activas: 0, total: 6, lectura: 'insuficiente', aviso: E.AVISO };
    if (!res.suficiente) { res.resumen = 'Hacen falta al menos ' + E.MIN_PALABRAS + ' palabras para que las señales digan algo. Este texto tiene ' + N + '.'; return res; }
    var i, j;
    /* 1. Uniformidad de la longitud de las frases */
    var largos = pal.map(function (x) { return x.length; }), media = largos.reduce(function (a, b) { return a + b; }, 0) / S;
    var cv = Math.sqrt(largos.reduce(function (a, l) { return a + (l - media) * (l - media); }, 0) / S) / media;
    res.senales.push({ id: 'uniformidad', titulo: 'Longitud de las frases muy uniforme', activa: S >= 8 && cv < 0.40, valor: cv,
      detalle: S < 8 ? 'Hay solo ' + S + ' frases: son pocas para medir cuánto varía su longitud.' : 'La longitud media es de ' + redondear(media, 1) + ' palabras y la variación relativa es de ' + redondear(cv, 2) + ' (por debajo de 0,40 se considera uniforme).' });
    /* 2. Frases que empiezan igual */
    var ini = {};
    pal.forEach(function (x) { ini[x[0]] = (ini[x[0]] || 0) + 1; });
    var top = Object.keys(ini).sort(function (a, b) { return ini[b] - ini[a] || (a < b ? -1 : a > b ? 1 : 0); })[0];
    var aInicio = ini[top] >= 4 && ini[top] / S >= 0.25;
    res.senales.push({ id: 'arranques', titulo: 'Frases que empiezan por la misma palabra', activa: aInicio, valor: ini[top] / S,
      detalle: 'La palabra «' + top + '» abre ' + ini[top] + ' de ' + S + ' frases (' + redondear(100 * ini[top] / S, 0) + ' %). Se marca a partir de 4 frases y un 25 %.' });
    /* 3. Fórmulas típicas */
    var fs = contarFormulas(ws), nf = fs.reduce(function (a, f) { return a + f.veces; }, 0), dens = nf * 1000 / N;
    fs.sort(function (a, b) { return b.veces - a.veces || (a.frase < b.frase ? -1 : 1); });
    res.senales.push({ id: 'formulas', titulo: 'Fórmulas típicas de texto genérico', activa: nf >= 3 && dens >= 6, valor: dens, lista: fs.slice(0, 6),
      detalle: nf ? 'Hay ' + nf + ' fórmulas (' + redondear(dens, 1) + ' por cada 1000 palabras): ' + fs.slice(0, 4).map(function (f) { return '«' + f.frase + '»' + (f.veces > 1 ? ' ×' + f.veces : ''); }).join(', ') + '. Se marca con 3 o más y 6 por cada 1000 palabras.' : 'No aparece ninguna de las fórmulas de la lista.' });
    /* 4. Conectores al abrir frase */
    var nc = 0;
    pal.forEach(function (x) { for (var q = 0; q < CONEC_T.length; q++) if (empiezaCon(x, 0, CONEC_T[q])) { if (!(CONEC_T[q][0] === 'además' && CONEC_T[q].length === 1 && (x[1] === 'de' || x[1] === 'del'))) nc++; break; } });
    res.senales.push({ id: 'conectores', titulo: 'Muchas frases abren con un conector', activa: nc >= 3 && nc / S >= 0.35, valor: nc / S,
      detalle: nc + ' de ' + S + ' frases (' + redondear(100 * nc / S, 0) + ' %) empiezan con un conector como «además» o «en conclusión». Se marca a partir de 3 frases y un 35 %.' });
    /* 5. Variedad de vocabulario (media móvil de tipos y palabras, ventana de 50) */
    if (N < 150) res.senales.push({ id: 'variedad', titulo: 'Vocabulario poco variado', activa: false, valor: null, detalle: 'Hacen falta 150 palabras para medir la variedad del vocabulario; este texto tiene ' + N + '.' });
    else {
      var cuenta = {}, distintas = 0, suma = 0, V = 50;
      for (i = 0; i < N; i++) {
        if (!cuenta[ws[i]]) { cuenta[ws[i]] = 0; distintas++; }
        cuenta[ws[i]]++;
        if (i >= V) { cuenta[ws[i - V]]--; if (!cuenta[ws[i - V]]) distintas--; }
        if (i >= V - 1) suma += distintas;
      }
      var mattr = suma / (V * (N - V + 1));
      res.senales.push({ id: 'variedad', titulo: 'Vocabulario poco variado', activa: mattr < 0.62, valor: mattr,
        detalle: 'En cada tramo de 50 palabras se repite de media el ' + redondear(100 * (1 - mattr), 0) + ' % de las palabras (índice de variedad ' + redondear(mattr, 2) + '; por debajo de 0,62 se marca).' });
    }
    /* 6. Secuencias de tres palabras repetidas */
    var tri = {};
    for (i = 0; i + 2 < N; i++) {
      if (STOP[ws[i]] && STOP[ws[i + 1]] && STOP[ws[i + 2]]) continue;
      var clave = ws[i] + ' ' + ws[i + 1] + ' ' + ws[i + 2];
      tri[clave] = (tri[clave] || 0) + 1;
    }
    var reps = Object.keys(tri).filter(function (k) { return tri[k] >= 3; }).sort(function (a, b) { return tri[b] - tri[a] || (a < b ? -1 : a > b ? 1 : 0); });
    res.senales.push({ id: 'trigramas', titulo: 'Secuencias de tres palabras que se repiten', activa: reps.length > 0, valor: reps.length, lista: reps.slice(0, 5).map(function (k) { return { frase: k, veces: tri[k] }; }),
      detalle: reps.length ? 'Se repiten ' + reps.length + ' secuencias, por ejemplo ' + reps.slice(0, 3).map(function (k) { return '«' + k + '» ×' + tri[k]; }).join(', ') + '. Se marca a partir de 3 repeticiones.' : 'Ninguna secuencia de tres palabras con contenido se repite 3 veces o más.' });
    res.activas = res.senales.filter(function (s) { return s.activa; }).length;
    res.lectura = res.activas === 0 ? 'ninguna' : res.activas <= 2 ? 'algunas' : 'varias';
    res.resumen = res.activas + ' de ' + res.total + ' señales activas. ' + (res.lectura === 'ninguna' ? 'No aparece ninguna de las señales que busca la herramienta, lo que tampoco demuestra nada.'
      : res.lectura === 'algunas' ? 'Aparecen algunas señales, que son habituales también en textos escritos a mano y no permiten concluir nada.' : 'Aparecen varias señales a la vez. Sigue sin ser una prueba: la escritura formal, la traducida o la repetitiva las produce igual.');
    return res;
  };

  /* ---------------------------------------------------------------- editor de estilo */
  var AP = '(?:en la era digital(?: actual)?|en el mundo (?:actual|de hoy)|en el panorama actual|en el contexto actual),?|(?:cabe|es importante|es necesario|es preciso|conviene|vale la pena) (?:destacar|mencionar|señalar|resaltar|subrayar|recordar) que';
  var RE_APERTURA = new RegExp('(?:' + AP.replace(/ /g, '[ \\t]+') + ')[ \\t]+(?=[' + LET + '])', 'iy');
  var DROP = ['además', 'asimismo', 'por otro lado', 'por otra parte', 'igualmente', 'de igual manera', 'de igual forma', 'del mismo modo', 'por su parte', 'en este sentido', 'así pues', 'de este modo', 'de esta manera'];
  var RE_CONEC = new RegExp('(' + porLargo(DROP).map(function (t) { return t.join('[ \\t]+'); }).join('|') + ')(?![' + LET + ']),[ \\t]+(?=[' + LET + '])', 'iy');
  var RE_PREFIJO = new RegExp('(?:' + porLargo(E.CONECTORES).map(function (t) { return t.join('[ \\t]+'); }).join('|') + '),[ \\t]+', 'iy');   // «Además, » delante de la apertura vacía
  var INF = '[a-zñáéíóúü]+(?:ar|er|ir)(?:se)?';
  var SUST = [
    ['suave', 'con el fin de', 'para'], ['suave', 'con la finalidad de', 'para'],
    ['suave', 'a fin de(?=\\s+(?:que(?![' + LET + '])|' + INF + '(?![' + LET + '])))', 'para'],
    ['suave', 'debido a que', 'porque'], ['suave', 'llevar a cabo', 'realizar'], ['suave', 'en la actualidad', 'hoy'], ['suave', 'hoy en día', 'hoy'], ['suave', 'sin lugar a dudas', 'sin duda'],
    ['suave', '(?:juega|desempeña) un papel (?:fundamental|crucial|esencial|vital|clave) en', 'es clave en'], ['suave', '(?:juegan|desempeñan) un papel (?:fundamental|crucial|esencial|vital|clave) en', 'son clave en'],
    ['intenso', 'con el objetivo de', 'para'], ['intenso', 'con respecto a', 'sobre'], ['intenso', 'en relación con', 'sobre'], ['intenso', 'es por (?:ello|esto) que', 'por eso'],
    ['intenso', 'a pesar de que', 'aunque'], ['intenso', 'en caso de que', 'si']
  ].map(function (x) { return { nivel: x[0], re: new RegExp('(^|[^' + LET + '])(' + x[1].replace(/ (?![^(]*\))/g, '\\s+') + ')(?![' + LET + '])', 'gi'), por: x[2] }; });
  var NIVELES = { suave: 0, normal: 1, intenso: 2 };
  var UMBRAL_LARGA = { suave: 45, normal: 40, intenso: 30 };

  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esMayus(c) { return c !== c.toLowerCase(); }
  function inicios(t) {
    var res = [], m, re = /[.!?…]+["'”’»)\]]*[ \t ]+|\n[ \t ]*/g, p = 0;
    while (p < t.length && /\s/.test(t.charAt(p))) p++;
    res.push(p);
    while ((m = re.exec(t)) !== null) res.push(m.index + m[0].length);
    return res;
  }
  function borrar(t, cortes) {                       // cortes ordenados: [{ini, fin}] → quita [ini, fin) y pone en mayúscula la letra siguiente
    for (var i = cortes.length - 1; i >= 0; i--) t = t.slice(0, cortes[i].ini) + (cortes[i].mayus === false ? t.slice(cortes[i].fin) : mayus(t.slice(cortes[i].fin)));
    return t;
  }

  E.humanizar = function (texto, op) {
    op = op || {};
    var nivel = NIVELES[op.nivel] != null ? op.nivel : 'normal', n = NIVELES[nivel], t = String(texto == null ? '' : texto).replace(/\r\n?/g, '\n'), cambios = [];
    var ini, cortes, s, m, i;
    if (op.conectores !== false && n >= 1) {         // 1. conectores repetidos
      var vistos = {}, previa = false;
      cortes = [];
      inicios(t).forEach(function (p) {
        RE_CONEC.lastIndex = p; m = RE_CONEC.exec(t);
        if (m && m.index === p) {
          var c = m[1].toLowerCase().replace(/[ \t]+/g, ' '), quitar = !!vistos[c] || (n === 2 && previa);
          vistos[c] = true; previa = true;
          if (quitar) { cortes.push({ ini: p, fin: p + m[0].length }); cambios.push({ tipo: 'conector', antes: m[0].replace(/[ \t]+$/, ''), despues: '' }); }
        } else previa = false;
      });
      t = borrar(t, cortes);
    }
    if (op.aperturas !== false) {                    // 2. aperturas vacías
      cortes = [];
      inicios(t).forEach(function (p) {
        var q = p, pref = false;
        RE_PREFIJO.lastIndex = p; m = RE_PREFIJO.exec(t);
        if (m && m.index === p) { q = p + m[0].length; pref = true; }
        RE_APERTURA.lastIndex = q; m = RE_APERTURA.exec(t);
        if (m && m.index === q) { cortes.push({ ini: q, fin: q + m[0].length, mayus: !pref }); cambios.push({ tipo: 'apertura', antes: m[0].replace(/[ \t]+$/, ''), despues: '' }); }
      });
      t = borrar(t, cortes);
    }
    if (op.sustituciones !== false) {                // 3. sustituciones seguras
      SUST.forEach(function (r) {
        if (NIVELES[r.nivel] > n) return;
        t = t.replace(r.re, function (todo, antes, frase) {
          var nueva = esMayus(frase.charAt(0)) ? mayus(r.por) : r.por;
          cambios.push({ tipo: 'sustitución', antes: frase.replace(/\s+/g, ' '), despues: nueva });
          return antes + nueva;
        });
      });
    }
    var largas = [];
    E.frases(t).forEach(function (f) { var k = E.palabras(f).length; if (k > UMBRAL_LARGA[nivel]) largas.push({ frase: f, palabras: k }); });
    return { texto: t, cambios: cambios, largas: largas, restos: E.contarFormulas(t), nivel: nivel };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  else { global.TH = global.TH || {}; global.TH.estilo = E; }
})(typeof window !== 'undefined' ? window : globalThis);
