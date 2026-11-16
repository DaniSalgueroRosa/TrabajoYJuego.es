/* Diagramas de flujo a partir de texto. Se carga con TH.script('lib/diagrama.js') y queda en TH.diagrama:
   TH.diagrama.analizar(texto)            → { nodos:[{ id, texto, forma }], aristas:[{ de, a, etiqueta, linea }], avisos:[], errores:[] }
       Una conexión por línea: «Inicio -> Leer datos -> ¿Son válidos? -> Guardar | Sí». Lo que va tras la barra | es la etiqueta de la última flecha.
       Formas: se deducen del texto (Inicio/Fin = terminador, «¿…?» = decisión, el resto = proceso) o se fijan con (terminador) {decisión} /entrada o salida/ [proceso].
       Las líneas que empiezan por # son comentarios. Una línea sin flecha declara un paso suelto.
   TH.diagrama.disponer(grafo, { medir })  → { ancho, alto, nodos:[{ id, texto, forma, lineas, x, y, w, h, capa }], aristas:[{ de, a, etiqueta, atras, puntos:[{x,y}], etiquetaPos }], capas, cruces }
       Disposición por capas de arriba abajo (Sugiyama): ciclos invertidos, capas por camino más largo, orden por baricentro, coordenadas por regresión isotónica y rutas ortogonales.
       medir(texto) debe devolver el ancho en píxeles (por defecto, una estimación por número de letras).
   TH.diagrama.svg(disposicion, { titulo }) → texto SVG autónomo (sin recursos externos)
   Se verifica en pruebas/test_diagrama_lib.py. */
(function (global) {
  'use strict';
  var MAX_NODOS = 150, MAX_ARISTAS = 300, MAX_TEXTO = 120, GAP_X = 40, GAP_DUMMY = 16, GAP_Y = 76, MARGEN = 28, LINEA = 18;
  var COLORES = {
    proceso: { fondo: '#E4EDE8', trazo: '#1D3A34', texto: '#14201C' },
    decision: { fondo: '#F4F8C0', trazo: '#1D3A34', texto: '#14201C' },
    terminador: { fondo: '#1D3A34', trazo: '#1D3A34', texto: '#FFFFFF' },
    entrada: { fondo: '#CFE3FA', trazo: '#1D3A34', texto: '#14201C' }
  };

  function norm(t) { return String(t).replace(/\s+/g, ' ').trim(); }
  function inferir(t) {
    if (/^(inicio|fin|start|end|comienzo|final|comienza|termina)$/i.test(t)) return 'terminador';
    if (/^¿/.test(t) || /\?$/.test(t)) return 'decision';
    return 'proceso';
  }
  function leerNodo(bruto) {
    var t = norm(bruto), m;
    if ((m = /^\((.*)\)$/.exec(t))) return { texto: norm(m[1]), forma: 'terminador' };
    if ((m = /^\{(.*)\}$/.exec(t))) return { texto: norm(m[1]), forma: 'decision' };
    if ((m = /^\/(.*)\/$/.exec(t))) return { texto: norm(m[1]), forma: 'entrada' };
    if ((m = /^\[(.*)\]$/.exec(t))) return { texto: norm(m[1]), forma: 'proceso' };
    return { texto: t, forma: null };
  }

  function analizar(texto) {
    var nodos = [], mapa = {}, aristas = [], avisos = [], errores = [], vistas = {};
    function nodo(n, linea) {
      var k = n.texto.toLowerCase();
      if (!mapa.hasOwnProperty(k)) {
        var tx = n.texto;
        if (tx.length > MAX_TEXTO) { tx = tx.slice(0, MAX_TEXTO - 1) + '…'; avisos.push('Línea ' + linea + ': el texto de un paso se ha recortado a ' + MAX_TEXTO + ' caracteres.'); }
        mapa[k] = nodos.length; nodos.push({ id: nodos.length, texto: tx, forma: n.forma || inferir(n.texto), fijo: !!n.forma });
      } else if (n.forma && !nodos[mapa[k]].fijo) { nodos[mapa[k]].forma = n.forma; nodos[mapa[k]].fijo = true; }
      return mapa[k];
    }
    String(texto).replace(/\r\n?/g, '\n').split('\n').forEach(function (cruda, i) {
      var linea = i + 1, l = cruda.trim();
      if (!l || l.charAt(0) === '#') return;
      l = l.replace(/→/g, '->').replace(/-{2,}>/g, '->');
      var etiqueta = '';
      if (l.indexOf('->') >= 0 && l.lastIndexOf('|') > l.lastIndexOf('->')) { etiqueta = norm(l.slice(l.lastIndexOf('|') + 1)); l = l.slice(0, l.lastIndexOf('|')); }
      var partes = l.split('->'), ids = [], mal = false;
      partes.forEach(function (p, k) {
        var n = leerNodo(p);
        if (!n.texto) { if (partes.length > 1) { errores.push('Línea ' + linea + ': falta el texto ' + (k === 0 ? 'antes' : 'después') + ' de la flecha ->.'); mal = true; } return; }
        ids.push(n);
      });
      if (mal) return;
      var idx = ids.map(function (n) { return nodo(n, linea); });
      for (var k = 0; k + 1 < idx.length; k++) {
        var de = idx[k], a = idx[k + 1], et = k + 2 === idx.length ? etiqueta : '';
        if (de === a) { avisos.push('Línea ' + linea + ': «' + nodos[de].texto + '» apunta a sí mismo y esa flecha no se dibuja.'); continue; }
        var clave = de + '>' + a;
        if (vistas[clave]) { avisos.push('Línea ' + linea + ': la conexión de «' + nodos[de].texto + '» a «' + nodos[a].texto + '» ya estaba y no se repite.'); continue; }
        vistas[clave] = true; aristas.push({ de: de, a: a, etiqueta: et.length > 40 ? et.slice(0, 39) + '…' : et, linea: linea });
      }
    });
    if (nodos.length > MAX_NODOS) errores.push('Hay ' + nodos.length + ' pasos y el máximo es ' + MAX_NODOS + '. Divide el diagrama en varios.');
    if (aristas.length > MAX_ARISTAS) errores.push('Hay ' + aristas.length + ' conexiones y el máximo es ' + MAX_ARISTAS + '. Divide el diagrama en varios.');
    return { nodos: nodos, aristas: aristas, avisos: avisos, errores: errores };
  }

  function envolver(texto, medir, max) {
    var palabras = texto.split(' '), lineas = [], actual = '';
    palabras.forEach(function (p) {
      while (p.length > 8 && medir(p) > max) {
        var k = p.length - 1;
        while (k > 4 && medir(p.slice(0, k)) > max) k--;
        if (actual) { lineas.push(actual); actual = ''; }
        lineas.push(p.slice(0, k)); p = p.slice(k);
      }
      var t = actual ? actual + ' ' + p : p;
      if (actual && medir(t) > max) { lineas.push(actual); actual = p; } else actual = t;
    });
    if (actual) lineas.push(actual);
    return lineas;
  }
  function tamano(forma, lineas, medir) {
    var tw = 0, th = lineas.length * LINEA;
    lineas.forEach(function (l) { var m = medir(l); if (m > tw) tw = m; });
    if (forma === 'decision') return { w: Math.max(140, Math.ceil(2 * tw + 24)), h: Math.max(70, 2 * th + 24) };
    if (forma === 'terminador') return { w: Math.max(96, Math.ceil(tw + 44)), h: Math.max(42, th + 20) };
    if (forma === 'entrada') return { w: Math.max(110, Math.ceil(tw + 64)), h: Math.max(46, th + 24) };
    return { w: Math.max(96, Math.ceil(tw + 32)), h: Math.max(46, th + 24) };
  }

  function disponer(g, op) {
    op = op || {};
    var medir = op.medir || function (t) { return t.length * 7.6; }, N = g.nodos.length, i, j, e, l;
    var V = [];                                                       // nodos virtuales: reales (0..N-1) y de relleno (para las flechas que atraviesan capas)
    g.nodos.forEach(function (n) {
      var lineas = envolver(n.texto, medir, n.forma === 'decision' ? 150 : 190), t = tamano(n.forma, lineas, medir);
      V.push({ real: true, id: n.id, texto: n.texto, forma: n.forma, lineas: lineas, w: t.w, h: t.h });
    });
    if (!N) return { ancho: 0, alto: 0, nodos: [], aristas: [], capas: 0, cruces: 0 };
    var A = g.aristas, salen = [], entran = [];
    for (i = 0; i < N; i++) { salen.push([]); entran.push([]); }
    A.forEach(function (a, k) { salen[a.de].push(k); entran[a.a].push(k); });

    // 1) ciclos: las flechas que vuelven a un paso en curso se invierten solo para calcular las capas
    var color = [], atras = [];
    for (i = 0; i < N; i++) color.push(0);
    function dfs(u) {
      color[u] = 1;
      salen[u].forEach(function (k) { var v = A[k].a; if (color[v] === 1) atras[k] = true; else if (color[v] === 0) dfs(v); });
      color[u] = 2;
    }
    for (i = 0; i < N; i++) if (!entran[i].length && !color[i]) dfs(i);
    for (i = 0; i < N; i++) if (!color[i]) dfs(i);
    var dag = A.map(function (a, k) { return atras[k] ? { u: a.a, v: a.de, k: k } : { u: a.de, v: a.a, k: k }; });

    // 2) capas: camino más largo desde las fuentes
    var capaDe = [], grado = [], sig = [], cola = [];
    for (i = 0; i < N; i++) { capaDe.push(0); grado.push(0); sig.push([]); }
    dag.forEach(function (d) { grado[d.v]++; sig[d.u].push(d.v); });
    for (i = 0; i < N; i++) if (!grado[i]) cola.push(i);
    for (i = 0; i < cola.length; i++) sig[cola[i]].forEach(function (v) { if (capaDe[v] < capaDe[cola[i]] + 1) capaDe[v] = capaDe[cola[i]] + 1; if (--grado[v] === 0) cola.push(v); });
    var nCapas = 0;
    for (i = 0; i < N; i++) { V[i].capa = capaDe[i]; if (capaDe[i] + 1 > nCapas) nCapas = capaDe[i] + 1; }

    // 3) nodos de relleno en las capas intermedias
    var cadenas = [], arriba = [], abajo = [];
    for (i = 0; i < N; i++) { arriba.push([]); abajo.push([]); }
    dag.forEach(function (d) {
      var cad = [d.u], prev = d.u, c;
      for (c = V[d.u].capa + 1; c < V[d.v].capa; c++) {
        var idx = V.length; V.push({ real: false, w: 0, h: 0, capa: c }); arriba.push([]); abajo.push([]);
        abajo[prev].push(idx); arriba[idx].push(prev); cad.push(idx); prev = idx;
      }
      abajo[prev].push(d.v); arriba[d.v].push(prev); cad.push(d.v);
      cadenas[d.k] = cad;
    });

    // 4) orden dentro de cada capa: recorrido en profundidad y barridos por baricentro
    var capas = [], pre = [], orden = 0, vis = [];
    for (i = 0; i < nCapas; i++) capas.push([]);
    function recorrer(u) { vis[u] = true; pre[u] = orden++; sig[u].forEach(function (v) { if (!vis[v]) recorrer(v); }); }
    for (i = 0; i < N; i++) if (!vis[i] && !dag.some(function (d) { return d.v === i; })) recorrer(i);
    for (i = 0; i < N; i++) if (!vis[i]) recorrer(i);
    V.forEach(function (n, k) { n.pre = k < N ? pre[k] : 1e6 + k; });
    V.forEach(function (n, k) { capas[n.capa].push(k); });
    capas.forEach(function (c) { c.sort(function (a, b) { return V[a].pre - V[b].pre; }); });
    function numerar() { capas.forEach(function (c) { c.forEach(function (v, p) { V[v].pos = p; }); }); }
    function cruces() {
      var total = 0, c, a, b, pares;
      for (c = 0; c + 1 < capas.length; c++) {
        pares = [];
        capas[c].forEach(function (u) { abajo[u].forEach(function (v) { pares.push([V[u].pos, V[v].pos]); }); });
        for (a = 0; a < pares.length; a++) for (b = a + 1; b < pares.length; b++) if ((pares[a][0] - pares[b][0]) * (pares[a][1] - pares[b][1]) < 0) total++;
      }
      return total;
    }
    function barrido(c, vecinos) {
      var bar = {};
      capas[c].forEach(function (v) { var vs = vecinos[v]; bar[v] = vs.length ? vs.reduce(function (s, u) { return s + V[u].pos; }, 0) / vs.length : V[v].pos; });
      capas[c].sort(function (a, b) { return bar[a] - bar[b] || V[a].pos - V[b].pos; });
      capas[c].forEach(function (v, p) { V[v].pos = p; });
    }
    numerar();
    var mejor = capas.map(function (c) { return c.slice(); }), mejorCruces = cruces(), it;
    for (it = 0; it < 16 && mejorCruces > 0; it++) {
      for (l = 1; l < nCapas; l++) barrido(l, arriba);
      for (l = nCapas - 2; l >= 0; l--) barrido(l, abajo);
      var cr = cruces();
      if (cr < mejorCruces) { mejorCruces = cr; mejor = capas.map(function (c) { return c.slice(); }); }
    }
    capas = mejor; numerar();

    // 5) coordenadas horizontales: cada nodo busca el promedio de sus vecinos sin pisar a los demás (regresión isotónica)
    function sep(a, b) { return (V[a].w + V[b].w) / 2 + (V[a].real && V[b].real ? GAP_X : GAP_DUMMY); }
    capas.forEach(function (c) { var x = 0; c.forEach(function (v, p) { if (p) x += sep(c[p - 1], v); V[v].x = x; }); });
    function ajustar(c, deseos) {
      var off = [], k, y = [], bloques = [];
      c.forEach(function (v, p) { off.push(p ? off[p - 1] + sep(c[p - 1], v) : 0); });
      c.forEach(function (v, p) {
        bloques.push({ suma: deseos[p] - off[p], n: 1, desde: p });
        while (bloques.length > 1 && bloques[bloques.length - 2].suma / bloques[bloques.length - 2].n > bloques[bloques.length - 1].suma / bloques[bloques.length - 1].n) {
          var b2 = bloques.pop(), b1 = bloques[bloques.length - 1]; b1.suma += b2.suma; b1.n += b2.n;
        }
      });
      bloques.forEach(function (b) { for (k = 0; k < b.n; k++) y[b.desde + k] = b.suma / b.n; });
      c.forEach(function (v, p) { V[v].x = y[p] + off[p]; });
    }
    for (it = 0; it < 24; it++) {
      var orde = it % 2 ? capas.map(function (_, k) { return nCapas - 1 - k; }) : capas.map(function (_, k) { return k; });
      orde.forEach(function (cl) {
        var c = capas[cl];
        ajustar(c, c.map(function (v) { var vs = arriba[v].concat(abajo[v]); return vs.length ? vs.reduce(function (s, u) { return s + V[u].x; }, 0) / vs.length : V[v].x; }));
      });
    }

    // 6) coordenadas verticales
    var alto = [], tope = [], canal = [], y = MARGEN;
    capas.forEach(function (c, cl) { alto.push(Math.max(0, Math.max.apply(null, c.map(function (v) { return V[v].h; })))); });
    for (l = 0; l < nCapas; l++) { tope.push(y); canal.push(y + alto[l] + GAP_Y / 2); y += alto[l] + GAP_Y; }
    V.forEach(function (n) { n.y = tope[n.capa] + alto[n.capa] / 2; });
    var yFin = tope[nCapas - 1] + alto[nCapas - 1] + MARGEN;

    // 7) puntos de enganche: las flechas reparten su sitio en el borde superior o inferior del paso
    var salida = {}, porNodo = {};                                       // porNodo[v] = { arr: [{k, otroX}], aba: [...] }
    dag.forEach(function (d) {
      var cad = cadenas[d.k];
      (porNodo[d.u] = porNodo[d.u] || { arr: [], aba: [] }).aba.push({ k: d.k, otro: cad[1] });
      (porNodo[d.v] = porNodo[d.v] || { arr: [], aba: [] }).arr.push({ k: d.k, otro: cad[cad.length - 2] });
    });
    var puerto = {};                                                     // puerto['k:u'|'k:v'] = {x,y}
    [false, true].forEach(function (soloUna) {                        // primero las flechas que comparten lado; después las únicas, que se alinean con el otro extremo
      Object.keys(porNodo).forEach(function (id) {
        var n = V[id];
        [['aba', 1], ['arr', -1]].forEach(function (lado) {
          var lista = porNodo[id][lado[0]].sort(function (a, b) { return V[a.otro].x - V[b.otro].x || a.k - b.k; }), cant = lista.length, S = n.w * 0.7;
          if ((cant === 1) !== soloUna) return;
          lista.forEach(function (p, q) {
            var dx;
            if (cant === 1) {
              var o = V[p.otro], ladoOtro = lado[0] === 'aba' ? 'arr' : 'aba', objetivo = o.x, lim = (n.forma === 'decision' ? 0.2 : 0.35) * n.w, pu = puerto[p.k + ':' + p.otro + ':' + ladoOtro];
              if (o.real && porNodo[p.otro][ladoOtro].length === 1) objetivo = (n.x + o.x) / 2;
              else if (pu) objetivo = pu.x;
              dx = Math.max(-lim, Math.min(lim, objetivo - n.x));
            } else dx = Math.max(-S / 2, Math.min(S / 2, (q - (cant - 1) / 2) * Math.min(S / (cant - 1), 56)));
            var dy = n.forma === 'decision' ? (n.h / 2) * (1 - Math.abs(dx) / (n.w / 2)) : n.h / 2;
            puerto[p.k + ':' + id + ':' + lado[0]] = { x: n.x + dx, y: n.y + lado[1] * dy, dx: dx };
          });
        });
      });
    });

    // 8) rutas ortogonales (con los saltos horizontales repartidos dentro de cada canal entre capas)
    var saltos = {}, rutas = [];
    dag.forEach(function (d) {
      var cad = cadenas[d.k], pts = [];
      cad.forEach(function (v, q) {
        if (q === 0) { var p = puerto[d.k + ':' + v + ':aba']; pts.push({ x: p.x, y: p.y, capa: V[v].capa }); }
        else if (q === cad.length - 1) { var p2 = puerto[d.k + ':' + v + ':arr']; pts.push({ x: p2.x, y: p2.y, capa: V[v].capa }); }
        else pts.push({ x: V[v].x, y: V[v].y, capa: V[v].capa });
      });
      var tramos = [];
      for (j = 0; j + 1 < pts.length; j++) {
        var t = { a: pts[j], b: pts[j + 1], canal: pts[j].capa };
        if (Math.abs(t.a.x - t.b.x) > 1e-6) (saltos[t.canal] = saltos[t.canal] || []).push(t);
        tramos.push(t);
      }
      rutas[d.k] = { pts: pts, tramos: tramos, d: d };
    });
    Object.keys(saltos).forEach(function (c) {
      var lista = saltos[c].sort(function (a, b) { return (a.a.x + a.b.x) - (b.a.x + b.b.x); }), m = lista.length;
      lista.forEach(function (t, q) { t.ym = canal[c] + Math.max(-(GAP_Y / 2 - 14), Math.min(GAP_Y / 2 - 14, (q - (m - 1) / 2) * 7)); });
    });
    var aristas = A.map(function (a, k) {
      var r = rutas[k], poli = [];
      r.tramos.forEach(function (t, q) {
        if (q === 0) poli.push({ x: t.a.x, y: t.a.y });
        if (t.ym !== undefined) { poli.push({ x: t.a.x, y: t.ym }); poli.push({ x: t.b.x, y: t.ym }); }
        poli.push({ x: t.b.x, y: t.b.y });
      });
      var limpio = poli.filter(function (p, q) { return !q || Math.abs(p.x - poli[q - 1].x) > 1e-6 || Math.abs(p.y - poli[q - 1].y) > 1e-6; });
      if (atras[k]) limpio.reverse();
      var ini = limpio[0], dir = atras[k] ? -1 : 1, nodoIni = V[a.de], dx = ini.x - nodoIni.x;
      return { de: a.de, a: a.a, etiqueta: a.etiqueta, atras: !!atras[k], puntos: limpio, etiquetaPos: { x: ini.x + (dx < 0 ? -7 : 7), y: atras[k] ? ini.y - 8 : ini.y + 17, ancla: dx < 0 ? 'end' : 'start' } };
    });

    // 9) cuadro final y desplazamiento para que todo quede dentro con margen
    var minX = Infinity, maxX = -Infinity;
    function ext(x) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    V.forEach(function (n) { if (n.real) { ext(n.x - n.w / 2); ext(n.x + n.w / 2); } });
    aristas.forEach(function (a) {
      a.puntos.forEach(function (p) { ext(p.x); });
      if (a.etiqueta) { var an = a.etiqueta.length * 7.4 + 8; ext(a.etiquetaPos.ancla === 'end' ? a.etiquetaPos.x - an : a.etiquetaPos.x + an); }
    });
    var desp = MARGEN - minX;
    var nodos = [];
    for (i = 0; i < N; i++) { var n = V[i]; nodos.push({ id: n.id, texto: n.texto, forma: n.forma, lineas: n.lineas, x: n.x + desp, y: n.y, w: n.w, h: n.h, capa: n.capa }); }
    aristas.forEach(function (a) { a.puntos.forEach(function (p) { p.x += desp; }); a.etiquetaPos.x += desp; });
    return { ancho: Math.ceil(maxX - minX + 2 * MARGEN), alto: Math.ceil(yFin), nodos: nodos, aristas: aristas, capas: nCapas, cruces: mejorCruces };
  }

  function esc(t) { return String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r1(n) { return String(Math.round(n * 10) / 10); }
  function svg(d, op) {
    op = op || {};
    var s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + d.ancho + ' ' + d.alto + '" width="' + d.ancho + '" height="' + d.alto + '" role="img" font-family="Arial, Helvetica, sans-serif" font-size="14">'];
    s.push('<title>' + esc(op.titulo || 'Diagrama de flujo') + '</title>');
    s.push('<desc>Diagrama de flujo con ' + d.nodos.length + ' pasos y ' + d.aristas.length + ' conexiones.</desc>');
    s.push('<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#1D3A34"/></marker></defs>');
    s.push('<rect width="' + d.ancho + '" height="' + d.alto + '" fill="#FFFFFF"/>');
    d.aristas.forEach(function (a) {
      s.push('<path class="dg-flecha" d="M' + a.puntos.map(function (p) { return r1(p.x) + ' ' + r1(p.y); }).join(' L') + '" fill="none" stroke="#1D3A34" stroke-width="1.6" stroke-linejoin="round" marker-end="url(#flecha)"/>');
    });
    d.nodos.forEach(function (n) {
      var c = COLORES[n.forma] || COLORES.proceso, x = n.x - n.w / 2, y = n.y - n.h / 2, f;
      if (n.forma === 'decision') f = '<polygon points="' + r1(n.x) + ',' + r1(y) + ' ' + r1(n.x + n.w / 2) + ',' + r1(n.y) + ' ' + r1(n.x) + ',' + r1(y + n.h) + ' ' + r1(x) + ',' + r1(n.y) + '"';
      else if (n.forma === 'entrada') f = '<polygon points="' + r1(x + 16) + ',' + r1(y) + ' ' + r1(x + n.w) + ',' + r1(y) + ' ' + r1(x + n.w - 16) + ',' + r1(y + n.h) + ' ' + r1(x) + ',' + r1(y + n.h) + '"';
      else f = '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(n.w) + '" height="' + r1(n.h) + '" rx="' + (n.forma === 'terminador' ? r1(n.h / 2) : 4) + '"';
      s.push('<g class="dg-paso dg-' + n.forma + '">' + f + ' fill="' + c.fondo + '" stroke="' + c.trazo + '" stroke-width="1.6" stroke-linejoin="round"/>');
      var y0 = n.y - (n.lineas.length - 1) * LINEA / 2 + 5;
      s.push('<text text-anchor="middle" fill="' + c.texto + '"' + (n.forma === 'terminador' ? ' font-weight="700"' : '') + '>' + n.lineas.map(function (l, q) { return '<tspan x="' + r1(n.x) + '" y="' + r1(y0 + q * LINEA) + '">' + esc(l) + '</tspan>'; }).join('') + '</text></g>');
    });
    d.aristas.forEach(function (a) {
      if (!a.etiqueta) return;
      s.push('<text class="dg-etiqueta" x="' + r1(a.etiquetaPos.x) + '" y="' + r1(a.etiquetaPos.y) + '" text-anchor="' + a.etiquetaPos.ancla + '" font-size="13" font-weight="700" fill="#14201C" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">' + esc(a.etiqueta) + '</text>');
    });
    s.push('</svg>');
    return s.join('\n');
  }

  var API = { analizar: analizar, disponer: disponer, svg: svg, envolver: envolver, MAX_NODOS: MAX_NODOS, MAX_ARISTAS: MAX_ARISTAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else { global.TH = global.TH || {}; global.TH.diagrama = API; }
})(typeof window !== 'undefined' ? window : globalThis);
