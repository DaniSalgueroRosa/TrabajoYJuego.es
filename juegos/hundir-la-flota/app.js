/* HUNDIR LA FLOTA: tablero de 10×10 y cinco barcos (5, 4, 3, 3 y 2 casillas). Tu flota se coloca al azar (puedes barajarla antes de empezar) y turnáis disparos.
   El ordenador caza en tablero de ajedrez y, cuando toca, sigue la línea del barco. Puntuación: 100 si hundes la flota en el mínimo (17 disparos) y un punto menos por cada disparo extra (mínimo 10);
   si pierdes, 0. Todo en memoria; nada se guarda. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('hf');
  if (!raiz) return;

  var N = 10, LETRAS = 'ABCDEFGHIJ';
  var FLOTA = [['Portaaviones', 5], ['Acorazado', 4], ['Crucero', 3], ['Submarino', 3], ['Destructor', 2]];
  var TOTAL_CASILLAS = 17;
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: true, etiquetaMejor: 'Mejor puntuación: ' });
  var enemigo = null, propio = null, ia = null, t = null, ui = null;

  function nombreCasilla(i) { return LETRAS.charAt(i % N) + (Math.floor(i / N) + 1); }

  /* ---- Tableros: cada tablero tiene N×N casillas con el barco que hay (o -1) y si se ha disparado; los barcos llevan sus casillas */
  function tableroNuevo() {
    var tab = { barco: [], disparada: [], barcos: [] };
    for (var i = 0; i < N * N; i++) { tab.barco.push(-1); tab.disparada.push(false); }
    FLOTA.forEach(function (f, k) {
      var puesto = false;
      while (!puesto) {
        var horizontal = Math.random() < 0.5, largo = f[1];
        var x = U.entre(0, horizontal ? N - largo : N - 1), y = U.entre(0, horizontal ? N - 1 : N - largo), celdas = [], libre = true;
        for (var j = 0; j < largo; j++) {
          var c = (y + (horizontal ? 0 : j)) * N + x + (horizontal ? j : 0);
          if (tab.barco[c] !== -1) { libre = false; break; }
          celdas.push(c);
        }
        if (!libre) continue;
        celdas.forEach(function (c) { tab.barco[c] = k; });
        tab.barcos.push({ nombre: f[0], largo: largo, celdas: celdas, tocadas: 0 });
        puesto = true;
      }
    });
    return tab;
  }
  /* Dispara a una casilla: devuelve { r: 'agua' | 'tocado' | 'hundido', barco } */
  function disparar(tab, i) {
    tab.disparada[i] = true;
    var k = tab.barco[i];
    if (k < 0) return { r: 'agua' };
    var b = tab.barcos[k];
    b.tocadas++;
    return { r: b.tocadas >= b.largo ? 'hundido' : 'tocado', barco: b };
  }
  function quedan(tab) { return tab.barcos.filter(function (b) { return b.tocadas < b.largo; }).length; }

  /* ---- Inteligencia del ordenador */
  function nuevaIA() { return { activas: [] }; }          // casillas tocadas de barcos aún no hundidos
  function vecinos(i) {
    var x = i % N, y = Math.floor(i / N), r = [];
    if (x > 0) r.push(i - 1); if (x < N - 1) r.push(i + 1); if (y > 0) r.push(i - N); if (y < N - 1) r.push(i + N);
    return r;
  }
  function elegirIA() {
    var dis = propio.disparada, cand = [];
    if (ia.activas.length) {
      var lineas = [];
      ia.activas.forEach(function (c) {
        vecinos(c).forEach(function (n) {
          if (dis[n]) return;
          var d = n - c, previa = c - d, mismaFila = Math.floor(n / N) === Math.floor(c / N);
          var alineada = (Math.abs(d) === 1 && mismaFila) || Math.abs(d) === N;
          if (alineada && ia.activas.indexOf(previa) >= 0) lineas.push(n);   // continúa una línea de dos aciertos
          cand.push(n);
        });
      });
      if (lineas.length) return lineas[U.entre(0, lineas.length - 1)];
      if (cand.length) return cand[U.entre(0, cand.length - 1)];
    }
    var cazar = [];
    for (var i = 0; i < N * N; i++) if (!dis[i] && ((i % N) + Math.floor(i / N)) % 2 === 0) cazar.push(i);
    if (!cazar.length) for (var j = 0; j < N * N; j++) if (!dis[j]) cazar.push(j);
    return cazar[U.entre(0, cazar.length - 1)];
  }

  /* ---- Pantalla */
  function celda(i, clase, alAbrir) {
    return h('button', { class: 'hf-celda ' + (clase || ''), type: 'button', 'data-i': String(i), tabindex: i === 0 ? '0' : '-1', onclick: function () { alAbrir(i); },
      onkeydown: function (ev) { flechas(ev, i); } });
  }
  function flechas(ev, i) {
    var d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -N, ArrowDown: N }[ev.key];
    if (!d) return;
    var x = i % N, y = Math.floor(i / N);
    if ((ev.key === 'ArrowLeft' && x === 0) || (ev.key === 'ArrowRight' && x === N - 1)) return;
    ev.preventDefault();
    var j = i + d; if (j < 0 || j >= N * N) return;
    var cont = ev.currentTarget.parentNode, destino = cont.children[j];
    Array.prototype.forEach.call(cont.children, function (c) { c.setAttribute('tabindex', '-1'); });
    destino.setAttribute('tabindex', '0'); destino.focus();
  }
  function rejilla(etiqueta, alAbrir, clase) {
    var nodos = [];
    for (var i = 0; i < N * N; i++) nodos.push(celda(i, '', alAbrir));
    return h('div', { class: 'hf-rejilla ' + (clase || ''), role: 'group', 'aria-label': etiqueta }, nodos);
  }
  function pintarCelda(nodo, tab, i, ocultar) {
    var barco = tab.barco[i] >= 0, dis = tab.disparada[i], txt = '', clase = 'hf-celda', est;
    if (dis && barco) {
      var b = tab.barcos[tab.barco[i]], hundido = b.tocadas >= b.largo;
      clase += hundido ? ' hf-celda--hundido' : ' hf-celda--tocado'; txt = '✕'; est = hundido ? 'hundido (' + b.nombre + ')' : 'tocado';
    } else if (dis) { clase += ' hf-celda--agua'; txt = '•'; est = 'agua'; }
    else if (barco && !ocultar) { clase += ' hf-celda--barco'; est = 'barco'; }
    else est = ocultar ? 'sin disparar' : 'agua';
    nodo.className = clase; nodo.textContent = txt;
    nodo.setAttribute('aria-label', nombreCasilla(i) + ': ' + est);
  }
  function pintarTodo() {
    for (var i = 0; i < N * N; i++) {
      pintarCelda(ui.rejEnemigo.children[i], enemigo, i, true);
      pintarCelda(ui.rejPropia.children[i], propio, i, false);
    }
    ui.hud.poner('disp', t.disparos);
    ui.hud.poner('suyos', quedan(enemigo));
    ui.hud.poner('mios', quedan(propio), quedan(propio) <= 1);
    TYJ.vaciar(ui.flotaEnemiga);
    enemigo.barcos.forEach(function (b) {
      ui.flotaEnemiga.appendChild(h('li', { class: b.tocadas >= b.largo ? 'hf-barco hf-barco--hundido' : 'hf-barco', texto: b.nombre + ' (' + b.largo + ')' + (b.tocadas >= b.largo ? ' · hundido' : '') }));
    });
  }

  function portada() {
    t = { fase: 'colocar', disparos: 0, fin: false };
    propio = tableroNuevo(); enemigo = tableroNuevo(); ia = nuevaIA();
    TYJ.vaciar(raiz);
    raiz.appendChild(h('h2', { texto: 'Hundir la flota' }));
    raiz.appendChild(h('p', { class: 'texto', texto: 'Tienes cinco barcos en un tablero de 10×10. Dispara a las casillas del tablero enemigo hasta hundir su flota antes de que el ordenador hunda la tuya. Esta es tu flota: puedes barajarla hasta que te guste.' }));
    ui = { rejPropia: rejilla('Tu flota', function () {}, 'hf-rejilla--propia') };
    ui.rejPropia.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    raiz.appendChild(ui.rejPropia);
    for (var i = 0; i < N * N; i++) pintarCelda(ui.rejPropia.children[i], propio, i, false);
    var baraja = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: function () { portada(); } }, 'Barajar la flota');
    var empezar = h('button', { class: 'boton-retro', type: 'button', id: 'hf-empezar', onclick: jugar }, '¡A la batalla!');
    raiz.appendChild(h('div', { class: 'fila' }, empezar, baraja));
    var est = h('div'); raiz.appendChild(est); sesion.montar(est);
  }

  function jugar() {
    t.fase = 'juego'; t.turno = 'jugador';
    TYJ.vaciar(raiz); ui = {};
    ui.hud = TYJ.hud([['disp', 'Disparos', '0'], ['suyos', 'Barcos enemigos', String(FLOTA.length)], ['mios', 'Tus barcos', String(FLOTA.length)]]);
    ui.msg = h('p', { class: 'mensaje hf-msg', role: 'status', 'aria-live': 'polite', texto: 'Tu turno: dispara a una casilla del tablero enemigo.' });
    ui.rejEnemigo = rejilla('Aguas enemigas: elige una casilla para disparar', function (i) { alDisparar(i); }, 'hf-rejilla--enemiga');
    ui.rejPropia = rejilla('Tu flota', function () {}, 'hf-rejilla--propia');
    ui.rejPropia.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    ui.flotaEnemiga = h('ul', { class: 'hf-flota', 'aria-label': 'Flota enemiga' });
    ui.final = h('div'); ui.est = h('div');
    raiz.appendChild(ui.hud.nodo);
    raiz.appendChild(ui.msg);
    raiz.appendChild(h('div', { class: 'hf-tableros' },
      h('section', { class: 'hf-tablero' }, h('h3', { class: 'hf-titulo', texto: 'Aguas enemigas' }), ui.rejEnemigo, ui.flotaEnemiga),
      h('section', { class: 'hf-tablero hf-tablero--propio' }, h('h3', { class: 'hf-titulo', texto: 'Tu flota' }), ui.rejPropia)));
    raiz.appendChild(ui.final); raiz.appendChild(ui.est); sesion.montar(ui.est);
    pintarTodo();
    ui.rejEnemigo.children[0].focus();
  }

  function frase(res, quien, casilla) {
    if (res.r === 'agua') return quien + ' dispara a ' + casilla + ': agua.';
    if (res.r === 'tocado') return quien + ' dispara a ' + casilla + ': ¡tocado!';
    return quien + ' dispara a ' + casilla + ': ¡tocado y hundido! (' + res.barco.nombre + ')';
  }

  function alDisparar(i) {
    if (t.fin || t.turno !== 'jugador' || enemigo.disparada[i]) return;
    t.disparos++;
    var res = disparar(enemigo, i);
    ui.msg.textContent = frase(res, 'Tú', nombreCasilla(i));
    pintarTodo();
    TYJ.anunciar(ui.msg.textContent);
    if (quedan(enemigo) === 0) return acabar(true);
    t.turno = 'ia';
    setTimeout(turnoIA, 750);
  }

  function turnoIA() {
    if (t.fin) return;
    var i = elegirIA(), res = disparar(propio, i);
    if (res.r === 'tocado') ia.activas.push(i);
    if (res.r === 'hundido') {
      var sus = res.barco.celdas;
      ia.activas = ia.activas.filter(function (c) { return sus.indexOf(c) < 0; });
    }
    ui.msg.textContent = frase(res, 'El ordenador', nombreCasilla(i)) + ' Tu turno.';
    pintarTodo();
    TYJ.anunciar(ui.msg.textContent);
    if (quedan(propio) === 0) return acabar(false);
    t.turno = 'jugador';
  }

  function acabar(gano) {
    t.fin = true; t.turno = 'fin';
    var puntos = gano ? Math.max(10, 100 - (t.disparos - TOTAL_CASILLAS)) : 0;
    ui.rejEnemigo.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    sesion.registrar(puntos, gano);
    // al perder se enseñan los barcos que quedaban en el tablero enemigo
    if (!gano) for (var i = 0; i < N * N; i++) if (enemigo.barco[i] >= 0 && !enemigo.disparada[i]) { var n = ui.rejEnemigo.children[i]; n.classList.add('hf-celda--barco'); }
    var detalles = [t.disparos + (t.disparos === 1 ? ' disparo' : ' disparos') + ' en total', gano ? 'Te quedaban ' + quedan(propio) + ' barcos' : 'Al ordenador le quedaban ' + quedan(enemigo) + ' barcos'];
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gano ? '¡Flota enemiga hundida!' : 'Tu flota se ha hundido', puntos: puntos, unidad: 'puntos', detalles: detalles,
      compartir: 'Hundir la flota: ' + (gano ? 'gané en ' + t.disparos + ' disparos (' + puntos + ' puntos)' : 'perdí esta vez') + '.', textoRepetir: 'Otra batalla', alRepetir: portada });
  }

  portada();
})();
