/* GRÁFICAS DE LOS TESTS (TT.graf): barras, ejes opuestos, radar, triángulo, brújula, medidor, espectro, plano, línea y semanas de vida.
   Se dibujan con SVG o <canvas> en el navegador, sin librerías y sin pedir nada a la red. Los colores salen del «tema» del test
   (--t-fondo, --t-texto, --t-acento) y cada gráfica lleva un texto alternativo con sus cifras. Nada se guarda. */
(function (global) {
  'use strict';
  var TT = global.TT = global.TT || {};
  var doc = global.document;
  if (!doc) return;
  var NS = 'http://www.w3.org/2000/svg';
  var G = TT.graf = {};

  function s(tag, atr, hijos) {
    var e = doc.createElementNS(NS, tag);
    Object.keys(atr || {}).forEach(function (k) { if (atr[k] != null) e.setAttribute(k, atr[k]); });
    (hijos || []).forEach(function (h) { e.appendChild(h); });
    return e;
  }
  function t(x, y, texto, ancla, clase) { var e = s('text', { x: x, y: y, 'text-anchor': ancla || 'middle', 'class': 'tg-t' + (clase ? ' ' + clase : '') }); e.textContent = texto; return e; }
  function lienzo(w, h, alt, clase) { return s('svg', { viewBox: '0 0 ' + w + ' ' + h, 'class': 'tg-svg ' + (clase || ''), role: 'img', 'aria-label': alt, focusable: 'false' }); }
  function pct(v) { return Math.max(0, Math.min(100, v)); }
  G.pct = pct;

  /* Barras horizontales. items = [{ nombre, valor, color, nota }], o = { max, unidad, decimales, destacar, descripcion } */
  G.barras = function (items, o) {
    o = o || {};
    var max = o.max || 100, ul = TT.h('ul', { 'class': 'tg-barras', 'aria-label': o.descripcion || 'Gráfico de barras' });
    items.forEach(function (it, i) {
      var v = Math.max(0, it.valor), ancho = Math.min(100, v / max * 100);
      var pista = TT.h('span', { 'class': 'tg-pista', 'aria-hidden': 'true' }, TT.h('i', { style: 'width:' + ancho + '%' + (it.color ? ';background:' + it.color : '') }));
      var li = TT.h('li', { 'class': 'tg-barra' + (o.destacar === i ? ' tg-top' : '') },
        TT.h('span', { 'class': 'tg-nombre' }, it.nombre, it.nota ? TT.h('small', { texto: it.nota }) : null),
        pista, TT.h('span', { 'class': 'tg-valor', texto: TT.fmt(v, o.decimales || 0) + (o.unidad == null ? ' %' : o.unidad) }));
      ul.appendChild(li);
    });
    return ul;
  };

  /* Ejes opuestos: pares = [{ izq, der, v }] con v de 0 a 100 = porcentaje del polo izquierdo (50 = equilibrio). */
  G.ejes = function (pares, o) {
    var caja = TT.h('div', { 'class': 'tg-ejes', role: 'group', 'aria-label': (o && o.descripcion) || 'Ejes opuestos' });
    pares.forEach(function (p) {
      var izq = pct(p.v), lado = izq >= 50, medida = Math.abs(izq - 50);
      var barra = TT.h('span', { 'class': 'tg-pista tg-pista--eje', 'aria-hidden': 'true' },
        TT.h('i', { style: 'left:' + (lado ? 50 - medida : 50) + '%;width:' + medida + '%' }), TT.h('b', { style: 'left:50%' }));
      caja.appendChild(TT.h('div', { 'class': 'tg-eje' },
        TT.h('span', { 'class': 'tg-polo' + (lado ? ' tg-gana' : ''), texto: p.izq }), barra,
        TT.h('span', { 'class': 'tg-polo tg-polo--der' + (lado ? '' : ' tg-gana'), texto: p.der }),
        TT.h('span', { 'class': 'tg-eje-v', texto: TT.fmt(lado ? izq : 100 - izq, 0) + ' % ' + (lado ? p.izq : p.der) })));
    });
    return caja;
  };


  /* Balanza: barras que salen del centro, a la derecha si suman y a la izquierda si restan. items = [{ nombre, valor }], o = { max, unidad, decimales } */
  G.balanza = function (items, o) {
    o = o || {};
    var max = o.max || Math.max.apply(null, items.map(function (i) { return Math.abs(i.valor); }).concat([1])), ul = TT.h('ul', { 'class': 'tg-barras tg-balanza', 'aria-label': o.descripcion || 'Qué suma y qué resta' });
    items.forEach(function (it) {
      var mitad = Math.min(50, Math.abs(it.valor) / max * 50), pos = it.valor >= 0;
      var pista = TT.h('span', { 'class': 'tg-pista tg-pista--eje', 'aria-hidden': 'true' }, TT.h('i', { 'class': pos ? '' : 'tg-resta', style: 'left:' + (pos ? 50 : 50 - mitad) + '%;width:' + mitad + '%' }), TT.h('b', { style: 'left:50%' }));
      ul.appendChild(TT.h('li', { 'class': 'tg-barra' }, TT.h('span', { 'class': 'tg-nombre' }, it.nombre, it.nota ? TT.h('small', { texto: it.nota }) : null), pista,
        TT.h('span', { 'class': 'tg-valor', texto: (it.valor > 0 ? '+' : it.valor < 0 ? '−' : '') + TT.fmt(Math.abs(it.valor), o.decimales == null ? 0 : o.decimales) + (o.unidad || '') })));
    });
    return ul;
  };

  /* Radar: ejes = [{ nombre, valor (0-100) }] (3 o más) */
  G.radar = function (ejes, o) {
    var W = 380, H = 330, cx = W / 2, cy = 165, R = 105, n = ejes.length;
    var alt = (o && o.descripcion || 'Gráfico de radar') + ': ' + ejes.map(function (e) { return e.nombre + ' ' + TT.fmt(pct(e.valor), 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-radar');
    function punto(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    [0.25, 0.5, 0.75, 1].forEach(function (f) { svg.appendChild(s('polygon', { 'class': 'tg-malla', points: ejes.map(function (e, i) { return punto(i, R * f).join(','); }).join(' ') })); });
    ejes.forEach(function (e, i) { var p = punto(i, R); svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx, y1: cy, x2: p[0], y2: p[1] })); });
    svg.appendChild(s('polygon', { 'class': 'tg-area', points: ejes.map(function (e, i) { return punto(i, R * pct(e.valor) / 100).join(','); }).join(' ') }));
    ejes.forEach(function (e, i) {
      var p = punto(i, R * pct(e.valor) / 100), l = punto(i, R + 16), ancla = Math.abs(l[0] - cx) < 8 ? 'middle' : (l[0] > cx ? 'start' : 'end');
      svg.appendChild(s('circle', { 'class': 'tg-punto', cx: p[0], cy: p[1], r: 4 }));
      svg.appendChild(t(l[0], l[1] + 4, e.nombre, ancla));
    });
    return svg;
  };

  /* Triángulo de tres polos: nombres = [arriba, abajo-izquierda, abajo-derecha], valores = tres números (se reparten en proporción) */
  G.triangulo = function (nombres, valores, o) {
    var W = 380, H = 330, A = [190, 52], B = [58, 272], C = [322, 272], suma = valores[0] + valores[1] + valores[2] || 1;
    var f = valores.map(function (v) { return v / suma; });
    var px = A[0] * f[0] + B[0] * f[1] + C[0] * f[2], py = A[1] * f[0] + B[1] * f[1] + C[1] * f[2];
    var alt = (o && o.descripcion || 'Triángulo de tres polos') + ': ' + nombres.map(function (n, i) { return n + ' ' + TT.fmt(f[i] * 100, 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-triangulo');
    svg.appendChild(s('polygon', { 'class': 'tg-malla tg-relleno', points: [A, B, C].map(function (p) { return p.join(','); }).join(' ') }));
    [[A, B, C], [B, C, A], [C, A, B]].forEach(function (v) {
      var m = [(v[1][0] + v[2][0]) / 2, (v[1][1] + v[2][1]) / 2];
      svg.appendChild(s('line', { 'class': 'tg-malla', x1: v[0][0], y1: v[0][1], x2: m[0], y2: m[1] }));
    });
    svg.appendChild(s('circle', { 'class': 'tg-punto tg-punto--grande', cx: px, cy: py, r: 8 }));
    svg.appendChild(t(A[0], A[1] - 16, nombres[0] + ' ' + TT.fmt(f[0] * 100, 0) + ' %'));
    svg.appendChild(t(B[0] + 6, B[1] + 26, nombres[1] + ' ' + TT.fmt(f[1] * 100, 0) + ' %', 'start'));
    svg.appendChild(t(C[0] - 6, C[1] + 26, nombres[2] + ' ' + TT.fmt(f[2] * 100, 0) + ' %', 'end'));
    return svg;
  };

  /* Brújula: nombres = { n, e, s, o } y valores = { n, e, s, o } de 0 a 100. La aguja apunta hacia donde pesan más tus respuestas. */
  G.brujula = function (nombres, valores, o) {
    var W = 380, H = 340, cx = 190, cy = 170, R = 112, dirs = { n: [0, -1], e: [1, 0], s: [0, 1], o: [-1, 0] };
    var alt = (o && o.descripcion || 'Brújula') + ': ' + ['n', 'e', 's', 'o'].map(function (k) { return nombres[k] + ' ' + TT.fmt(pct(valores[k]), 0) + ' %'; }).join(', ');
    var svg = lienzo(W, H, alt, 'tg-brujula');
    [0.33, 0.66, 1].forEach(function (f) { svg.appendChild(s('circle', { 'class': 'tg-malla', cx: cx, cy: cy, r: R * f })); });
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx - R, y1: cy, x2: cx + R, y2: cy }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: cx, y1: cy - R, x2: cx, y2: cy + R }));
    var pts = ['n', 'e', 's', 'o'].map(function (k) { var r = R * pct(valores[k]) / 100; return (cx + dirs[k][0] * r) + ',' + (cy + dirs[k][1] * r); });
    svg.appendChild(s('polygon', { 'class': 'tg-area', points: pts.join(' ') }));
    var vx = valores.e - valores.o, vy = valores.n - valores.s, m = Math.hypot(vx, vy);
    if (m > 4) {
      var largo = Math.min(R, R * m / 100 * 1.6 + 30), ux = vx / m, uy = -vy / m, bx = -uy, by = ux;
      var punta = [cx + ux * largo, cy + uy * largo];
      svg.appendChild(s('polygon', { 'class': 'tg-aguja', points: [punta, [cx + bx * 9, cy + by * 9], [cx - ux * 16, cy - uy * 16], [cx - bx * 9, cy - by * 9]].map(function (p) { return p.join(','); }).join(' ') }));
    }
    svg.appendChild(s('circle', { 'class': 'tg-punto', cx: cx, cy: cy, r: 5 }));
    svg.appendChild(t(cx, cy - R - 12, nombres.n)); svg.appendChild(t(cx, cy + R + 24, nombres.s));
    svg.appendChild(t(cx + R + 10, cy + 4, nombres.e, 'start')); svg.appendChild(t(cx - R - 10, cy + 4, nombres.o, 'end'));
    return svg;
  };

  /* Medidor de media luna: valor de 0 a 100; o = { izq, der, texto } */
  G.medidor = function (valor, o) {
    o = o || {};
    var W = 380, H = 230, cx = 190, cy = 190, R = 140, v = pct(valor), a = Math.PI * (1 - v / 100);
    var svg = lienzo(W, H, (o.descripcion || 'Medidor') + ': ' + TT.fmt(v, 0) + ' de 100', 'tg-medidor');
    function arco(a0, a1, clase) {
      var x0 = cx + R * Math.cos(a0), y0 = cy - R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy - R * Math.sin(a1);
      return s('path', { 'class': clase, d: 'M' + x0 + ',' + y0 + ' A' + R + ',' + R + ' 0 0 1 ' + x1 + ',' + y1 });
    }
    svg.appendChild(arco(Math.PI, 0, 'tg-arco'));
    if (v > 0.5) svg.appendChild(arco(Math.PI, a, 'tg-arco tg-arco--v'));
    svg.appendChild(s('line', { 'class': 'tg-aguja-l', x1: cx, y1: cy, x2: cx + (R - 14) * Math.cos(a), y2: cy - (R - 14) * Math.sin(a) }));
    svg.appendChild(s('circle', { 'class': 'tg-punto', cx: cx, cy: cy, r: 7 }));
    svg.appendChild(t(cx - R, cy + 26, o.izq || '0', 'middle')); svg.appendChild(t(cx + R, cy + 26, o.der || '100', 'middle'));
    if (o.texto) svg.appendChild(t(cx, cy - 36, o.texto, 'middle', 'tg-t--grande'));
    return svg;
  };

  /* Espectro: una escala con un marcador. valor de 0 a 100; o = { izq, der, marcas[] } */
  G.espectro = function (valor, o) {
    o = o || {};
    var v = pct(valor), marcas = o.marcas || [];
    var pista = TT.h('div', { 'class': 'tg-espectro-pista', 'aria-hidden': 'true' }, TT.h('b', { style: 'left:' + v + '%' }));
    var caja = TT.h('div', { 'class': 'tg-espectro', role: 'img', 'aria-label': (o.descripcion || 'Espectro') + ': ' + TT.fmt(v, 0) + ' de 100 entre «' + (o.izq || '0') + '» y «' + (o.der || '100') + '»' }, pista,
      TT.h('div', { 'class': 'tg-espectro-pie' }, TT.h('span', { texto: o.izq || '0' }), TT.h('span', { texto: o.der || '100' })));
    if (marcas.length) {
      var fila = TT.h('div', { 'class': 'tg-espectro-marcas', 'aria-hidden': 'true' });
      marcas.forEach(function (m) { fila.appendChild(TT.h('span', { 'class': m[0] <= 8 ? 'tg-m-ini' : (m[0] >= 92 ? 'tg-m-fin' : null), style: 'left:' + m[0] + '%', texto: m[1] })); });
      caja.insertBefore(fila, caja.firstChild);
    }
    return caja;
  };

  /* Plano de dos ejes: x e y de 0 a 100; o = { ejeX, ejeY, esquinas: [arribaIzq, arribaDer, abajoIzq, abajoDer] } */
  G.plano = function (x, y, o) {
    o = o || {};
    var W = 380, H = 340, L = 56, T = 24, w = 300, h = 250, px = L + w * pct(x) / 100, py = T + h * (1 - pct(y) / 100);
    var svg = lienzo(W, H, (o.descripcion || 'Plano de dos ejes') + ': ' + (o.ejeX || 'horizontal') + ' ' + TT.fmt(pct(x), 0) + ' %, ' + (o.ejeY || 'vertical') + ' ' + TT.fmt(pct(y), 0) + ' %', 'tg-plano');
    svg.appendChild(s('rect', { 'class': 'tg-malla tg-relleno', x: L, y: T, width: w, height: h }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: L + w / 2, y1: T, x2: L + w / 2, y2: T + h }));
    svg.appendChild(s('line', { 'class': 'tg-malla', x1: L, y1: T + h / 2, x2: L + w, y2: T + h / 2 }));
    if (o.esquinas) {
      svg.appendChild(t(L + 8, T + 18, o.esquinas[0], 'start', 'tg-t--suave')); svg.appendChild(t(L + w - 8, T + 18, o.esquinas[1], 'end', 'tg-t--suave'));
      svg.appendChild(t(L + 8, T + h - 10, o.esquinas[2], 'start', 'tg-t--suave')); svg.appendChild(t(L + w - 8, T + h - 10, o.esquinas[3], 'end', 'tg-t--suave'));
    }
    svg.appendChild(s('circle', { 'class': 'tg-punto tg-punto--grande', cx: px, cy: py, r: 9 }));
    svg.appendChild(t(L + w / 2, H - 6, (o.ejeX || '') + ' →', 'middle'));
    var vert = t(14, T + h / 2, (o.ejeY || '') + ' →', 'middle'); vert.setAttribute('transform', 'rotate(-90 14 ' + (T + h / 2) + ')'); svg.appendChild(vert);
    return svg;
  };

  /* Línea: puntos = [[x, y], …]; o = { xTitulo, yTitulo, yMax, formatoY } */
  G.linea = function (puntos, o) {
    o = o || {};
    var W = 420, H = 240, L = 46, T = 14, w = 356, h = 170, xs = puntos.map(function (p) { return p[0]; }), ys = puntos.map(function (p) { return p[1]; });
    var xMax = Math.max.apply(null, xs.concat([1])), yMax = o.yMax || Math.max.apply(null, ys.concat([1])) * 1.1, fy = o.formatoY || function (v) { return TT.fmt(v, 0); };
    var svg = lienzo(W, H, (o.descripcion || 'Gráfica de línea'), 'tg-linea');
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var yy = T + h * (1 - f);
      svg.appendChild(s('line', { 'class': 'tg-malla', x1: L, y1: yy, x2: L + w, y2: yy }));
      svg.appendChild(t(L - 6, yy + 4, fy(yMax * f), 'end', 'tg-t--suave'));
    });
    if (puntos.length > 1) {
      var xy = puntos.map(function (p) { return [L + w * p[0] / xMax, T + h * (1 - Math.min(p[1], yMax) / yMax)]; });
      svg.appendChild(s('polygon', { 'class': 'tg-area', points: [[xy[0][0], T + h]].concat(xy, [[xy[xy.length - 1][0], T + h]]).map(function (p) { return p.join(','); }).join(' ') }));
      svg.appendChild(s('polyline', { 'class': 'tg-trazo', points: xy.map(function (p) { return p.join(','); }).join(' ') }));
    }
    svg.appendChild(t(L, H - 18, '0', 'start', 'tg-t--suave')); svg.appendChild(t(L + w, H - 18, TT.fmt(xMax, 0) + ' ' + (o.xUnidad || 's'), 'end', 'tg-t--suave'));
    if (o.yTitulo) svg.appendChild(t(L, H - 2, o.yTitulo, 'start', 'tg-t--suave'));
    return svg;
  };

  /* Semanas de una vida: una casilla por semana, 52 por fila. vividas y total en semanas; extra (opcional) = semanas «de más» o «de menos» sobre la media. */
  G.semanas = function (vividas, previstas, total, o) {
    var col = 52, filas = Math.ceil(total / col), c = 7, g = 2, W = col * (c + g), H = filas * (c + g);
    var cv = TT.h('canvas', { 'class': 'tg-semanas', width: W, height: H, role: 'img', 'aria-label': (o && o.descripcion || 'Semanas de una vida') + ': ' + TT.fmt(vividas / 52, 0) + ' años vividos y ' + TT.fmt(Math.max(0, previstas - vividas) / 52, 0) + ' por delante (de juego)' });
    var ctx = cv.getContext && cv.getContext('2d');
    if (!ctx) return cv;
    var estilo = global.getComputedStyle(doc.body), acento = estilo.getPropertyValue('--t-acento').trim() || '#e66', texto = estilo.getPropertyValue('--t-texto').trim() || '#888';
    for (var k = 0; k < total; k++) {
      var x = (k % col) * (c + g), y = Math.floor(k / col) * (c + g);
      if (k < vividas) { ctx.globalAlpha = 1; ctx.fillStyle = texto; ctx.fillRect(x, y, c, c); }
      else if (k < previstas) { ctx.globalAlpha = 1; ctx.fillStyle = acento; ctx.fillRect(x, y, c, c); }
      else { ctx.globalAlpha = 0.35; ctx.fillStyle = texto; ctx.fillRect(x + 2, y + 2, c - 4, c - 4); }
    }
    ctx.globalAlpha = 1;
    return cv;
  };

  /* Leyenda de colores para cualquier gráfica: items = [[etiqueta, color]] */
  G.leyenda = function (items) {
    var ul = TT.h('ul', { 'class': 'tg-leyenda' });
    items.forEach(function (it) { ul.appendChild(TT.h('li', {}, TT.h('i', { style: 'background:' + it[1], 'aria-hidden': 'true' }), it[0])); });
    return ul;
  };
})(window);
