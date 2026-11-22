/* UNA ENTRE UN MILLÓN (versión «carretera de noche»)
   7 preguntas «nombra un…», 25 s cada una. Cada pregunta vale hasta 100 puntos: los 100 son para la respuesta más rara que conoce el juego en esa
   pregunta y el resto se reparte por rareza (100 × ln n / ln n_máx, con «1 de cada n»). El coche avanza por una carretera dibujada en un lienzo de
   320 × 150 píxeles hasta el arco de meta (700 puntos).
   SEGUNDA OPORTUNIDAD: si tu respuesta no está en la lista, puedes probar otra distinta; si lo haces, te llevas como mínimo 10 puntos seguros (y más si la
   nueva es rara). Banco de preguntas local en preguntas.json; sin IA externa y sin guardar nada. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('uem');
  if (!raiz) return;

  var PREGUNTAS_POR_PARTIDA = 7, SEGUNDOS = 25, SEGUNDOS_OTRA = 15, BONO_OTRA = 10, META = PREGUNTAS_POR_PARTIDA * 100;
  var banco = null, vistas = {}, sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ' }), temporizador = null, rodilloId = null;
  var estado = null, escena = null, figura = null, lectura = null, delta = null, deltaId = null;

  /* n = «1 de cada n»; techo = la n más alta de esa pregunta (la respuesta más rara vale 100) */
  function techoDe(p) { return p.respuestas.reduce(function (a, b) { return b.n > a ? b.n : a; }, 2); }
  function puntosDe(n, techo) { return n <= 1 ? 0 : Math.min(100, Math.round(100 * Math.log(n) / Math.log(techo))); }
  function fraccion(n) { return '1 de cada ' + U.miles(n); }

  /* Busca la respuesta del jugador en la lista de la pregunta: primero exacta y, si no, la más parecida con tolerancia a erratas. */
  function buscar(texto, respuestas) {
    var t = U.clave(texto), mejor = null, mejorD = 99;
    if (!t) return null;
    respuestas.forEach(function (r) {
      r.t.forEach(function (alias) {
        var c = U.clave(alias), d;
        if (t === c) d = 0;
        else {
          var tol = c.length >= 10 ? 2 : (c.length >= 5 ? 1 : 0);
          d = (tol && Math.abs(t.length - c.length) <= tol) ? U.distancia(t, c) : 99;
          if (d > tol) d = 99;
        }
        if (d < mejorD || (d === mejorD && mejor && r.n > mejor.n)) { mejor = r; mejorD = d; }
      });
    });
    return mejor;
  }

  function elegirPreguntas() {
    var libres = banco.preguntas.filter(function (p) { return !vistas[p.id]; });
    if (libres.length < PREGUNTAS_POR_PARTIDA) { vistas = {}; libres = banco.preguntas; }
    var elegidas = U.muestra(libres, PREGUNTAS_POR_PARTIDA);
    elegidas.forEach(function (p) { vistas[p.id] = true; });
    return elegidas;
  }

  /* =====================================================================================================================================
     LA ESCENA: carretera en pseudo-3D dibujada en un lienzo de 320 × 150 píxeles (se amplía sin suavizar). Cielo con bandas y tramado, sol con
     cortes, montañas con paralaje, farolas, balizas, un arco de meta a cuadros y el coche de espaldas. Solo dibuja: no guarda nada.
     ===================================================================================================================================== */
  var W = 320, H = 150, HZ = 60, K = 20;                  // K = unidades de distancia por punto
  var C = { tinta: '#14201C', noche: '#1E2E29', linea: '#3A5249', pizarra: '#2F6B5C', tiza: '#EAF2EE', suave: '#AFC4BB', sandia: '#FF5A7D', limon: '#E6F14A', hondo: '#0B1512' };
  var CIELO = ['#0B1512', '#0F1E19', '#16302A', '#1E4036', '#2F6B5C', '#8E4C62', '#FF5A7D'];

  function crearEscena() {
    var lienzo = h('canvas', { class: 'uem-lienzo', width: String(W), height: String(H), 'aria-hidden': 'true' });
    var ctx = lienzo.getContext('2d');
    var reducido = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var st = { pos: 0, prog: 0, objetivo: 0, vel: 0, giro: 0, t: 0, pasar: 0, fiesta: [], previo: 0, vivo: true, calado: 0 };
    var estrellas = [], i;
    for (i = 0; i < 36; i++) estrellas.push([U.azar(W), U.azar(HZ - 16), U.azar(3)]);

    function R(color, x, y, w, hh) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(hh))); }
    function curva() {
      var c = Math.sin(st.pos / 2600) * 0.9 + Math.sin(st.pos / 1100 + 1.3) * 0.5;
      return c * Math.min(1, Math.max(0, (META - st.prog) / 70));            // la recta final se endereza para pasar bajo el arco
    }

    function cielo() {
      var n = CIELO.length, bh = HZ / n, k, x;
      for (k = 0; k < n; k++) R(CIELO[k], 0, k * bh, W, bh + 1);
      for (k = 0; k < n - 1; k++) {                                          // tramado entre bandas
        var yb = Math.round((k + 1) * bh);
        for (x = 0; x < W; x += 2) { R(CIELO[k + 1], x + (k & 1), yb - 1, 1, 1); if ((x & 3) === 0) R(CIELO[k + 1], x + 1 - (k & 1), yb - 3, 1, 1); }
      }
      estrellas.forEach(function (e) { if (e[2] === 0 && Math.floor(st.t * 2 + e[0]) % 3 === 0) return; R(C.tiza, e[0], e[1], 1, 1); });
    }
    function sol(cur) {
      var cx = W / 2 - cur * 36 - (st.giro * 0.2) % 8, cy = HZ - 3, r = 21, dy, y, hw, corte;
      for (dy = -r; dy <= r; dy++) {
        y = cy + dy; if (y >= HZ) break;
        corte = dy > -4 && ((y + Math.floor(st.t * 5)) % 6) < Math.floor((dy + 4) / 7);
        if (corte) continue;
        hw = Math.floor(Math.sqrt(r * r - dy * dy));
        R(dy < -6 ? C.limon : (dy < 6 ? '#FFB86B' : C.sandia), cx - hw, y, hw * 2, 1);
      }
    }
    function montes(color, amp, f, off, base) {
      var x, hh;
      for (x = 0; x < W; x += 2) {
        hh = amp * (0.55 + 0.45 * Math.sin((x + off) * f)) + amp * 0.4 * Math.sin((x + off) * f * 2.7 + 1.1);
        hh = Math.max(2, Math.floor(hh)); R(color, x, base - hh, 2, hh);
      }
    }
    function carretera(cur) {
      var y, t, z, banda, cx, hw, rw, dw;
      for (y = HZ; y < H; y++) {
        t = (y - HZ + 0.5) / (H - HZ); z = 90 / (t + 0.02);
        banda = Math.floor((z + st.pos) / 150) & 1;
        cx = W / 2 + cur * (1 - t) * (1 - t) * 110; hw = 6 + t * 130;
        R(banda ? '#12221C' : '#0E1B16', 0, y, W, 1);                         // hierba
        rw = Math.max(1, hw * 0.09);
        R(banda ? C.sandia : C.tiza, cx - hw - rw, y, rw, 1); R(banda ? C.sandia : C.tiza, cx + hw, y, rw, 1);    // pianos
        R(banda ? '#0C1411' : '#111E19', cx - hw, y, hw * 2, 1);              // asfalto
        if (!banda) { dw = Math.max(1, hw * 0.022); R(C.limon, cx - dw, y, dw * 2, 1); R(C.suave, cx - hw * 0.5 - dw, y, dw, 1); R(C.suave, cx + hw * 0.5, y, dw, 1); }
      }
      R(C.sandia, 0, HZ, W, 1);                                                // brillo del horizonte
    }
    function proyectar(zrel, cur) {
      var t = 90 / zrel - 0.02;
      return { t: t, y: HZ + t * (H - HZ), cx: W / 2 + cur * (1 - t) * (1 - t) * 110, hw: 6 + t * 130, s: 0.25 + t * 1.55 };
    }
    function objetos(cur) {
      var S = 420, n, zrel, p, lado, x, a, b;
      for (n = Math.floor((st.pos + 2200) / S); n >= Math.ceil((st.pos + 89) / S); n--) {
        zrel = n * S - st.pos; if (zrel < 89 || zrel > 2200) continue;
        p = proyectar(zrel, cur);
        for (lado = -1; lado <= 1; lado += 2) {
          if (n % 2 === 0) {                                                     // farola con su luz
            x = p.cx + lado * (p.hw * 1.3 + 3 * p.s); a = Math.max(2, 34 * p.s);
            R(C.linea, x - p.s, p.y - a, Math.max(1, 2 * p.s), a);
            R(C.limon, x - 4 * p.s + (lado > 0 ? -3 * p.s : 3 * p.s), p.y - a - 1, 8 * p.s, Math.max(1, 2.4 * p.s));
            ctx.globalAlpha = 0.18; R(C.limon, x - 7 * p.s + (lado > 0 ? -3 * p.s : 3 * p.s), p.y - a, 14 * p.s, a * 0.9); ctx.globalAlpha = 1;
          } else {                                                               // baliza rojiblanca
            x = p.cx + lado * (p.hw * 1.2 + 2 * p.s); a = Math.max(2, 9 * p.s);
            R(C.tiza, x - p.s, p.y - a, Math.max(1, 2.2 * p.s), a); R(C.sandia, x - p.s, p.y - a, Math.max(1, 2.2 * p.s), a * 0.4);
          }
        }
      }
      b = (META - st.prog) * K + 120 - st.pasar;                                 // arco de meta
      if (b >= 89 && b <= 2200) {
        p = proyectar(b, cur); a = 44 * p.s; var ancho = p.hw * 1.28, celda = Math.max(2, 3 * p.s), cx0 = p.cx - ancho, k2, f2;
        R(C.tiza, cx0 - 3 * p.s, p.y - a, 5 * p.s, a); R(C.tiza, p.cx + ancho - 2 * p.s, p.y - a, 5 * p.s, a);
        for (f2 = 0; f2 < 3; f2++) for (k2 = 0; k2 * celda < ancho * 2; k2++) R(((k2 + f2) & 1) ? C.tinta : C.tiza, cx0 + k2 * celda, p.y - a - (3 - f2) * celda, celda, celda);
      }
    }
    function coche(cur) {
      var s = 2, x0 = Math.round(W / 2 - 24 - cur * 7) + (st.calado > 0 ? (Math.floor(st.t * 30) % 2 ? 1 : -1) : 0), y0 = H - 36 + ((st.vel < 300 && Math.floor(st.t * (st.calado > 0 ? 24 : 10)) % 2) ? 1 : 0);
      function P(c, x, y, w, hh) { R(c, x0 + x * s, y0 + y * s, w * s, hh * s); }
      R('rgba(0,0,0,0.45)', x0 - 2, y0 + 25, 52, 3);
      P(C.tinta, 0, 9, 4, 4); P(C.tinta, 20, 9, 4, 4); P(C.linea, 1, 10, 2, 2); P(C.linea, 21, 10, 2, 2);                 // ruedas
      P('#B5BF1C', 1, 5, 22, 5); P(C.limon, 1, 5, 22, 3);                                                                // carrocería
      P(C.limon, 5, 1, 14, 5); P('#B5BF1C', 5, 1, 14, 1);                                                               // cabina
      P(C.tinta, 6, 2, 12, 3); P(C.suave, 7, 2, 3, 1); P(C.tinta, 11, 1, 2, 1);                                         // luneta
      P(C.tiza, 2, 0, 20, 1);                                                                                           // alerón
      var luz = st.vel > 600 ? '#FF9DB0' : C.sandia;
      if (st.vel > 1000) { var llama = Math.floor(st.t * 30) % 2; P(C.sandia, 3, 12, 3, 2 + llama); P(C.limon, 3, 12, 3, 1 + llama); P(C.sandia, 18, 12, 3, 2 + (1 - llama)); P(C.limon, 18, 12, 3, 1 + (1 - llama)); }      // turbo
      P(luz, 2, 6, 5, 2); P(luz, 17, 6, 5, 2); P(C.tinta, 2, 8, 5, 1); P(C.tinta, 17, 8, 5, 1);                         // pilotos
      P(C.tiza, 9, 8, 6, 2); P(C.sandia, 10, 9, 4, 1);                                                                   // matrícula
      if (st.calado > 0) {                                                                                              // respuesta de 0 puntos: el coche se cala y echa humo
        var u = 1.4 - st.calado, k;
        for (k = 0; k < 4; k++) { ctx.globalAlpha = Math.max(0, 0.65 - u * 0.4 - k * 0.06); R(C.suave, x0 + 10 + k * 9 + Math.sin(st.t * 8 + k) * 3, y0 - 4 - u * 26 - k * 7, 6 + k * 2, 5 + k); }
        ctx.globalAlpha = 1;
      }
    }
    function rayas() {
      if (st.vel < 1000) return;
      var n = Math.min(8, Math.round(st.vel / 300)), k, y;
      ctx.globalAlpha = 0.55;
      for (k = 0; k < n; k++) { y = HZ + 8 + U.azar(H - HZ - 30); R(C.suave, U.azar(W / 4), y, 6 + U.azar(18), 1); R(C.suave, W - U.azar(W / 4) - 24, y, 6 + U.azar(18), 1); }
      ctx.globalAlpha = 1;
    }
    function confeti(dt) {
      var k, q;
      for (k = st.fiesta.length - 1; k >= 0; k--) {
        q = st.fiesta[k]; q.vy += 120 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.y > H) { st.fiesta.splice(k, 1); continue; }
        R(q.c, q.x, q.y, 2, 2);
      }
    }
    function dibujar(dt) {
      var cur = curva();
      cielo(); sol(cur);
      montes(C.noche, 22, 0.021, st.giro * 0.35, HZ); montes(C.pizarra, 13, 0.034, st.giro, HZ);
      carretera(cur); objetos(cur); coche(cur); rayas(); confeti(dt || 0.016);
    }
    function paso(ts) {
      if (!st.vivo) return;
      var dt = st.previo ? Math.min(0.05, (ts - st.previo) / 1000) : 0.016;
      st.previo = ts; st.t += dt;
      if (lienzo.isConnected) {
        var resto = st.objetivo - st.prog, impulso = resto > 0.01 ? Math.min(90, resto * 1.6 + 8) : 0, cur0 = curva();
        st.prog = Math.min(st.objetivo, st.prog + impulso * dt);
        // Parado mientras piensas; al responder, el decorado avanza exactamente lo que avanza el coche (puntos × K) y la velocidad depende de lo que hayas ganado
        st.vel = impulso * K; st.pos += st.vel * dt; if (st.calado > 0) st.calado = Math.max(0, st.calado - dt); st.giro += cur0 * st.vel * dt * 0.004;
        if (st.prog >= META - 0.01 && st.pasar < 40) { st.pasar = Math.min(40, st.pasar + 28 * dt); if (st.pasar >= 40 && !st.celebrada) { st.celebrada = true; lanzarConfeti(); } }
        dibujar(dt);
      }
      window.requestAnimationFrame(paso);
    }
    function lanzarConfeti() {
      if (reducido) return;
      var cols = [C.limon, C.sandia, C.tiza], k;
      for (k = 0; k < 70; k++) st.fiesta.push({ x: W / 2 + U.azar(60) - 30, y: HZ - 10 - U.azar(30), vx: U.azar(120) - 60, vy: -60 - U.azar(90), c: cols[U.azar(3)] });
    }
    dibujar(0.016);
    if (!reducido) window.requestAnimationFrame(paso);
    return {
      lienzo: lienzo,
      avanzar: function (total, pts) {
        st.objetivo = Math.min(META, total);
        st.calado = (pts === 0 && !reducido) ? 1.4 : 0;
        if (reducido) { st.prog = st.objetivo; st.pos += 400; if (st.prog >= META) st.pasar = 40; dibujar(0.016); }
      },
      reiniciar: function () { st.prog = st.objetivo = 0; st.calado = 0; st.pasar = 0; st.celebrada = false; st.fiesta = []; if (reducido) dibujar(0.016); },
      parar: function () { st.vivo = false; }
    };
  }

  /* La figura (lienzo + marcador) es la misma en todas las pantallas: el coche conserva su sitio de una pregunta a la siguiente. */
  function montarFigura() {
    escena = crearEscena();
    lectura = h('span', { class: 'uem-lectura', texto: '0' });
    delta = h('span', { class: 'uem-delta' });
    figura = h('figure', { class: 'uem-escena', role: 'progressbar', 'aria-label': 'Recorrido hasta la meta de ' + META + ' puntos', 'aria-valuemin': '0', 'aria-valuemax': String(META), 'aria-valuenow': '0', 'aria-valuetext': '0 de ' + META + ' puntos (0 %)' },
      escena.lienzo,
      h('p', { class: 'uem-marcador', 'aria-hidden': 'true' }, h('span', { texto: 'Puntos ' }), lectura, h('span', { class: 'uem-meta', texto: ' / ' + META }), delta));
  }
  function ponerRecorrido(total, pts) {
    var pct = Math.round(total * 100 / META);
    escena.avanzar(total, pts); lectura.textContent = U.miles(total);
    clearTimeout(deltaId); delta.textContent = typeof pts === 'number' ? ' +' + pts : '';
    delta.className = 'uem-delta' + (typeof pts === 'number' ? (pts === 0 ? ' uem-delta--cero' : (pts >= 80 ? ' uem-delta--alto' : '')) : '');
    if (typeof pts === 'number') deltaId = setTimeout(function () { delta.textContent = ''; }, 3200);
    figura.setAttribute('aria-valuenow', String(total));
    figura.setAttribute('aria-valuetext', U.miles(total) + ' de ' + U.miles(META) + ' puntos (' + pct + ' %)');
    figura.classList.toggle('uem-escena--meta', total >= META);
  }

  /* ---- Rodillo de dígitos (cuentakilómetros): gira y se va parando de izquierda a derecha */
  function rodillo(nodo, texto) {
    var celdas = Array.from(texto).map(function (ch) { return h('span', { class: ch === '.' ? 'uem-punto-miles' : 'uem-digito', texto: ch }); });
    TYJ.vaciar(nodo); celdas.forEach(function (c) { nodo.appendChild(c); });
    if (rodilloId) { clearInterval(rodilloId); rodilloId = null; }
    var vivas = celdas.filter(function (c) { return c.className === 'uem-digito'; }), finales = vivas.map(function (c) { return c.textContent; });
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var paso = 0;
    rodilloId = setInterval(function () {
      paso++;
      vivas.forEach(function (c, i) { c.textContent = paso < 5 + i * 3 ? String(U.azar(10)) : finales[i]; });
      if (paso > 5 + vivas.length * 3) { clearInterval(rodilloId); rodilloId = null; }
    }, 55);
  }

  /* ---- Escala de rareza: eje logarítmico de «1 de cada 10» a «1 de cada millón»; un punto por respuesta conocida y tu respuesta marcada */
  function escalaDeRareza(p, tuya) {
    var tope = 6, marcas = [[1, '1 de 10'], [3, '1 de 1.000'], [5, '1 de 100.000'], [6, '1 de 1 millón']];
    function pos(n) { return Math.max(1.5, Math.min(98.5, Math.log10(Math.max(2, n)) / tope * 100)); }
    var eje = h('div', { class: 'uem-eje', 'aria-hidden': 'true' });
    p.respuestas.forEach(function (r) { eje.appendChild(h('span', { class: 'uem-nota', style: '--x:' + pos(r.n).toFixed(2) + '%' })); });
    if (tuya) eje.appendChild(h('span', { class: 'uem-tuya', style: '--x:' + pos(tuya.n).toFixed(2) + '%' }, h('b', { texto: 'Tú' })));
    var regla = h('div', { class: 'uem-regla', 'aria-hidden': 'true' }, marcas.map(function (m) { return h('span', { style: '--x:' + (m[0] / tope * 100).toFixed(2) + '%', texto: m[1] }); }));
    return h('div', { class: 'uem-escala' }, h('p', { class: 'uem-escala-titulo', texto: 'Dónde cae tu respuesta (cada punto es una respuesta de la lista)' }), eje, regla);
  }

  /* ---- Pantallas */
  function limpiar() { clearTimeout(deltaId); if (temporizador) temporizador.parar(); if (rodilloId) { clearInterval(rodilloId); rodilloId = null; } }

  function inicio() {
    limpiar(); TYJ.vaciar(raiz);
    raiz.appendChild(h('h2', { texto: 'Una entre un millón' }));
    raiz.appendChild(h('p', { class: 'texto', texto: 'Una carretera de noche, siete preguntas y 25 segundos para cada una. Nombra algo que casi nadie diría y tu coche acelerará hasta el arco de meta: cada pregunta vale hasta 100 puntos. Si tu respuesta no está en mi lista, te dejo probar otra con 10 puntos seguros.' }));
    raiz.appendChild(figura);
    raiz.appendChild(h('div', { class: 'fila' }, h('button', { class: 'boton-retro', type: 'button', onclick: empezar, id: 'uem-empezar' }, 'Empezar')));
    var s = h('div'); raiz.appendChild(s); sesion.montar(s);
  }

  function empezar() {
    limpiar(); escena.reiniciar(); ponerRecorrido(0);
    estado = { preguntas: elegirPreguntas(), i: 0, total: 0, detalle: [], ruta: TYJ.etapas(PREGUNTAS_POR_PARTIDA, []) };
    pregunta();
  }

  function pregunta() {
    var p = estado.preguntas[estado.i], respondida = false;
    limpiar(); TYJ.vaciar(raiz);
    var hud = TYJ.hud([['n', 'Pregunta', (estado.i + 1) + ' / ' + PREGUNTAS_POR_PARTIDA], ['pts', 'Puntos', U.miles(estado.total)]]);
    var barra = TYJ.barraDeTiempo();
    var segundos = h('span', { class: 'uem-segundos', 'aria-hidden': 'true', texto: String(SEGUNDOS) });
    var entrada = h('input', { id: 'uem-respuesta', type: 'text', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', maxlength: '60', placeholder: 'Escribe tu respuesta' });
    var enviar = h('button', { class: 'boton-retro', type: 'submit' }, 'Responder');
    var paso = h('button', { class: 'boton-retro boton-retro--sec', type: 'button' }, 'Paso');
    var form = h('form', { class: 'uem-form', novalidate: true },
      h('div', { class: 'fila' }, h('div', { class: 'campo-retro' }, h('label', { for: 'uem-respuesta', texto: 'Tu respuesta' }), entrada), h('div', { class: 'fila' }, enviar, paso)));
    var zona = h('div', { role: 'status', 'aria-live': 'polite' });
    raiz.appendChild(hud.nodo);
    raiz.appendChild(figura);
    raiz.appendChild(estado.ruta.nodo);
    raiz.appendChild(h('div', { class: 'uem-valla' }, h('h2', { class: 'uem-pregunta', tabindex: '-1', texto: p.pregunta })));
    raiz.appendChild(h('div', { class: 'uem-cuenta' }, barra.nodo, segundos));
    raiz.appendChild(form);
    raiz.appendChild(zona);
    entrada.focus();

    temporizador = new TYJ.Temporizador({
      segundos: SEGUNDOS,
      alTick: function (r) { barra.poner(r / SEGUNDOS); segundos.textContent = String(Math.ceil(r)); segundos.classList.toggle('uem-segundos--alerta', r <= 7); },
      alFin: function () { cerrar(null, true); }
    });
    temporizador.iniciar();

    /* Cierra la pregunta con su resultado definitivo. «info»: texto, r (entrada de la lista o null), pts, tiempo, reintento, primero */
    function registrar(info) {
      estado.total += info.pts;
      estado.detalle.push({ pregunta: p.pregunta, texto: info.texto, r: info.r, pts: info.pts, tiempo: !!info.tiempo, reintento: !!info.reintento, primero: info.primero || '' });
      estado.ruta.marcar(estado.i, info.pts > 0);
      hud.poner('pts', U.miles(estado.total));
      ponerRecorrido(estado.total, info.pts);
      entrada.disabled = enviar.disabled = paso.disabled = true;
      mostrarResultado(zona, p, info);
    }

    function cerrar(texto, tiempoAgotado) {
      if (respondida) return; respondida = true;
      temporizador.parar();
      entrada.disabled = enviar.disabled = paso.disabled = true;
      var r = texto ? buscar(texto, p.respuestas) : null;
      if (texto && !r) { segundaOportunidad(texto); return; }
      registrar({ texto: texto, r: r, pts: r ? puntosDe(r.n, techoDe(p)) : 0, tiempo: tiempoAgotado });
    }

    /* La respuesta no está en la lista: se puede probar otra distinta (15 s) y, si se hace, hay 10 puntos seguros. */
    function segundaOportunidad(primero) {
      var campo = h('input', { id: 'uem-otra', type: 'text', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', maxlength: '60', placeholder: 'Otra respuesta distinta' });
      var probar = h('button', { class: 'boton-retro', type: 'submit', id: 'uem-probar' }, 'Probar otra (+' + BONO_OTRA + ' seguros)');
      var dejar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', id: 'uem-dejar' }, 'Dejarlo en 0');
      var seg2 = h('span', { class: 'uem-segundos', 'aria-hidden': 'true', texto: String(SEGUNDOS_OTRA) });
      var aviso = h('p', { class: 'texto-suave', role: 'alert' });
      var form2 = h('form', { class: 'uem-form', novalidate: true },
        h('div', { class: 'fila' }, h('div', { class: 'campo-retro' }, h('label', { for: 'uem-otra', texto: 'Otra respuesta' }), campo), h('div', { class: 'fila' }, probar, dejar)), aviso);
      var caja = h('div', { class: 'uem-resultado uem-resultado--otra' },
        h('p', { class: 'uem-puntos', texto: '«' + primero + '» no está en mi lista' }),
        h('p', { texto: 'Pero tienes una segunda oportunidad: si pruebas con otra respuesta distinta te llevas 10 puntos seguros, y más si es rara. Te quedan:' }), seg2, form2);
      TYJ.vaciar(zona).appendChild(caja);
      TYJ.anunciar('«' + primero + '» no está en la lista. Puedes probar otra respuesta y te llevas 10 puntos seguros.');
      campo.focus();
      temporizador = new TYJ.Temporizador({
        segundos: SEGUNDOS_OTRA,
        alTick: function (r) { seg2.textContent = String(Math.ceil(r)); seg2.classList.toggle('uem-segundos--alerta', r <= 5); },
        alFin: function () { dejarlo(); }
      });
      temporizador.iniciar();
      var hecho = false;
      function dejarlo() { if (hecho) return; hecho = true; temporizador.parar(); registrar({ texto: primero, r: null, pts: 0 }); }
      form2.addEventListener('submit', function (e) {
        e.preventDefault(); if (hecho) return;
        var t = campo.value.trim();
        if (!t) { campo.focus(); return; }
        if (U.clave(t) === U.clave(primero)) { aviso.textContent = 'Escribe una respuesta distinta de la anterior.'; campo.focus(); return; }
        hecho = true; temporizador.parar();
        var r2 = buscar(t, p.respuestas), real = r2 ? puntosDe(r2.n, techoDe(p)) : 0;
        registrar({ texto: t, r: r2, pts: Math.max(BONO_OTRA, real), reintento: true, primero: primero });
      });
      dejar.addEventListener('click', dejarlo);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); var t = entrada.value.trim(); if (!t) { entrada.focus(); return; } cerrar(t, false); });
    paso.addEventListener('click', function () { cerrar(null, false); });
  }

  function mostrarResultado(zona, p, info) {
    var ultima = estado.i === PREGUNTAS_POR_PARTIDA - 1, r = info.r, pts = info.pts, texto = info.texto;
    var rara = p.respuestas.reduce(function (a, b) { return b.n > a.n ? b : a; }), comun = p.respuestas.reduce(function (a, b) { return b.n < a.n ? b : a; });
    var titulo, detalle;
    if (info.reintento) {
      if (r) { titulo = '«' + texto + '»: ' + fraccion(r.n); detalle = '+' + pts + ' puntos' + (pts === BONO_OTRA && puntosDe(r.n, techoDe(p)) < BONO_OTRA ? ' (los 10 de la segunda oportunidad)' : ' · segunda oportunidad'); }
      else { titulo = '«' + texto + '» tampoco está en mi lista, pero te llevas los 10 puntos por probar otra'; detalle = '+' + pts + ' puntos · segunda oportunidad'; }
    } else if (r) { titulo = '«' + texto + '»: ' + fraccion(r.n); detalle = '+' + pts + ' puntos de 100'; }
    else if (texto) { titulo = '«' + texto + '» no está en mi lista'; detalle = '0 puntos'; }
    else { titulo = info.tiempo ? 'Se acabó el tiempo' : 'Has pasado'; detalle = '0 puntos'; }
    var siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: function () { if (ultima) final(); else { estado.i++; pregunta(); } } }, ultima ? 'Ver resultado' : 'Siguiente');
    var cuenta = h('p', { class: 'uem-cuentakm', 'aria-hidden': 'true' });
    var caja = h('div', { class: 'uem-resultado' + (r || info.reintento ? ' uem-resultado--ok' : '') },
      h('p', { class: 'uem-puntos', texto: detalle }),
      r ? h('div', { class: 'uem-odometro' }, h('span', { class: 'uem-etiqueta-odo', 'aria-hidden': 'true', texto: '1 de cada' }), cuenta) : null,
      h('p', { texto: titulo + (r ? ' (frecuencia estimada)' : '') + '.' }),
      escalaDeRareza(p, r),
      h('p', { class: 'texto-suave', texto: 'La más habitual: ' + comun.t[0] + ' (' + fraccion(comun.n) + '). La más rara que conozco: ' + rara.t[0] + ' (' + fraccion(rara.n) + ', 100 puntos).' }),
      h('div', { class: 'fila' }, siguiente));
    TYJ.vaciar(zona).appendChild(caja);
    if (r) rodillo(cuenta, U.miles(r.n));
    TYJ.anunciar(titulo + '. ' + detalle + '.');
    siguiente.focus();
  }

  function final() {
    limpiar();
    var total = estado.total, nivel = U.nivel(total, banco.niveles);
    var lista = h('ul', { class: 'uem-niveles', 'aria-label': 'Niveles' }, banco.niveles.map(function (n) {
      return h('li', n[1] === nivel ? { 'aria-current': 'true' } : {}, h('span', { texto: n[1] }), h('span', { texto: U.miles(n[0]) + '+' }));
    }));
    var tabla = h('table', { class: 'uem-tabla' }, h('thead', {}, h('tr', {}, h('th', { scope: 'col', texto: 'Pregunta' }), h('th', { scope: 'col', texto: 'Tu respuesta' }), h('th', { scope: 'col', texto: 'Puntos (de 100)' }))),
      h('tbody', {}, estado.detalle.map(function (d) {
        var resp = d.texto ? d.texto + (d.r ? ' · ' + fraccion(d.r.n) : ' · fuera de lista') + (d.reintento ? ' · 2.ª oportunidad (antes: «' + d.primero + '»)' : '') : (d.tiempo ? 'Sin tiempo' : 'Paso');
        return h('tr', {}, h('td', { texto: d.pregunta.replace('Nombra ', '') }), h('td', { texto: resp }), h('td', { texto: String(d.pts) }));
      })));
    sesion.registrar(total);
    var contenedor = h('div');
    TYJ.vaciar(raiz).appendChild(contenedor);
    var pct = Math.round(total * 100 / META);
    TYJ.final(contenedor, { titulo: total >= META ? '¡Meta perfecta!' : 'Nivel: ' + nivel, puntos: total, nivel: null,
      detalles: ['Has recorrido el ' + pct + ' % de la carretera (' + U.miles(total) + ' de ' + U.miles(META) + ' puntos)'], textoRepetir: 'Jugar otra vez', alRepetir: empezar,
      compartir: 'Una entre un millón · ' + U.miles(total) + ' de ' + U.miles(META) + ' puntos (' + pct + ' % de la carretera) · Nivel ' + nivel });
    contenedor.insertBefore(figura, contenedor.firstChild);
    contenedor.lastChild.appendChild(lista);
    contenedor.lastChild.appendChild(tabla);
    var s = h('div'); raiz.appendChild(s); sesion.montar(s);
  }

  function arrancar() {
    TYJ.datos('una-entre-un-millon/preguntas.json').then(function (json) { banco = json; if (!figura) montarFigura(); inicio(); })
      .catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
