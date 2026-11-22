/* GLOBO DE CIFRAS: cinco preguntas con respuesta numérica exacta. Cada fallo da la pista «más alto» o «más bajo» y estrecha el margen.
   Un globo dibujado en SVG se hincha con el tiempo, se pone nervioso cuando queda poco y revienta al acabarse. El reloj solo corre
   mientras hay una pregunta abierta. Todo en memoria. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('gc');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg';
  var TOTAL = 5;
  var NIVELES = { facil: { nombre: 'Tranquilo (2 min)', seg: 120 }, medio: { nombre: 'Normal (1 min 30 s)', seg: 90 }, dificil: { nombre: 'Rápido (1 min)', seg: 60 } };
  var RANGOS = [[0, 'Sin aire'], [150, 'Soplador'], [300, 'Hinchador'], [420, 'Pulmón de acero'], [520, 'Maestro del globo']];
  var calma = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var sesion = TYJ.Sesion(null, { racha: false });
  var preguntas = null, nivel = 'medio', t = null, ui = null, reloj = null;

  function parar() { if (reloj) reloj.parar(); }

  /* ---- Dibujo SVG del globo (lienzo de 200 × 270; el hilo cuelga hasta un peso en el suelo) */
  function sv(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) el.setAttribute(k, String(attrs[k])); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }
  function estrella(cx, cy, r1, r2, puntas) {
    var pts = [];
    for (var i = 0; i < puntas * 2; i++) {
      var r = i % 2 ? r2 : r1, a = Math.PI * i / puntas - Math.PI / 2;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  function dibujarGlobo() {
    var cuerpo = sv('g', { class: 'gc-b' },
      sv('path', { class: 'gc-b-cuerpo', d: 'M100 12C150 12 184 52 184 104C184 160 140 206 100 214C60 206 16 160 16 104C16 52 50 12 100 12Z' }),
      sv('path', { class: 'gc-b-sombra', d: 'M184 104C184 160 140 206 100 214C134 194 164 152 164 104C164 68 150 38 128 22C162 38 184 66 184 104Z' }),
      sv('rect', { class: 'gc-b-brillo', x: 36, y: 56, width: 10, height: 38 }),
      sv('rect', { class: 'gc-b-brillo', x: 46, y: 42, width: 22, height: 10 }),
      sv('rect', { class: 'gc-b-brillo', x: 46, y: 56, width: 10, height: 10 }),
      sv('path', { class: 'gc-b-nudo', d: 'M91 213H109L114 227H86Z' }),
      sv('path', { class: 'gc-b-hilo', d: 'M100 227L95 238L105 248L100 258' }),
      sv('rect', { class: 'gc-b-peso', x: 88, y: 258, width: 24, height: 12 }),
      sv('rect', { class: 'gc-ojo', x: 68, y: 52, width: 10, height: 16 }),
      sv('rect', { class: 'gc-ojo', x: 122, y: 52, width: 10, height: 16 }),
      sv('path', { class: 'gc-boca gc-boca--calma', d: 'M82 190Q100 200 118 190' }),
      sv('path', { class: 'gc-boca gc-boca--tenso', d: 'M82 194L90 188L98 194L106 188L114 194' }),
      sv('path', { class: 'gc-boca gc-boca--feliz', d: 'M80 186Q100 208 120 186Z' }),
      sv('path', { class: 'gc-gota', d: 'M150 50L157 62A7 7 0 1 1 143 62Z' }),
      sv('g', { class: 'gc-chispas' },
        sv('path', { d: 'M20 40H36M28 32V48' }), sv('path', { d: 'M168 20H182M175 13V27' }), sv('path', { d: 'M176 130H190M183 123V137' })));
    var estallido = sv('g', { class: 'gc-estallido' },
      sv('polygon', { class: 'gc-e-ext', points: estrella(100, 112, 100, 62, 11) }),
      sv('polygon', { class: 'gc-e-int', points: estrella(100, 112, 70, 44, 9) }));
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2 + 0.3, lado = 8 + (i % 3) * 3, r = sv('rect', { class: 'gc-trozo gc-trozo--' + (i % 2 ? 'a' : 'b'), x: 100 - lado / 2, y: 112 - lado / 2, width: lado, height: lado });
      r.style.setProperty('--dx', (Math.cos(a) * (95 + (i % 4) * 14)).toFixed(0) + 'px');
      r.style.setProperty('--dy', (Math.sin(a) * (95 + (i % 4) * 14) + 20).toFixed(0) + 'px');
      r.style.setProperty('--rot', (i % 2 ? 1 : -1) * (180 + i * 40) + 'deg');
      estallido.appendChild(r);
    }
    return sv('svg', { viewBox: '0 0 200 270', class: 'gc-svg', 'aria-hidden': 'true', focusable: 'false' }, cuerpo, estallido);
  }
  function flecha(dir) {
    var p = sv('polygon', { points: '5,0 10,6 7,6 7,10 3,10 3,6 0,6' });
    if (dir === 'bajo') p.setAttribute('transform', 'rotate(180 5 5)');
    return sv('svg', { viewBox: '0 0 10 10', class: 'gc-flecha', 'aria-hidden': 'true', focusable: 'false' }, p);
  }
  function reiniciar(nodo, clase) { nodo.classList.remove(clase); void nodo.offsetWidth; nodo.classList.add(clase); }

  function inicio() {
    parar();
    TYJ.vaciar(raiz);
    ui = {};
    ui.niveles = h('div', { class: 'fila', role: 'group', 'aria-label': 'Nivel' });
    Object.keys(NIVELES).forEach(function (k) {
      ui.niveles.appendChild(h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(k === nivel),
        onclick: function () { nivel = k; inicio(); } }, NIVELES[k].nombre));
    });
    ui.est = h('div');
    var portada = h('div', { class: 'gc-portada' },
      h('div', { class: 'gc-portada-globo gc-globo gc-globo--calma', 'aria-hidden': 'true' }, dibujarGlobo()),
      h('div', { class: 'gc-portada-texto' },
        h('h3', { texto: 'Globo de cifras' }),
        h('p', { class: 'texto', texto: 'Cinco preguntas con un número exacto como respuesta. Si fallas, te decimos si es más alto o más bajo. Pero el globo se hincha con el tiempo, y si revienta se acabó.' }),
        ui.niveles,
        h('div', { class: 'fila' }, h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, 'Inflar el globo'))));
    raiz.appendChild(portada); raiz.appendChild(ui.est);
    sesion.montar(ui.est);
  }

  function empezar() {
    var seg = NIVELES[nivel].seg;
    t = { lista: U.muestra(preguntas, TOTAL), i: 0, intentos: [], puntos: 0, resultados: [], fase: 'jugando', restante: seg, seg: seg };
    montar();
    reloj = new TYJ.Temporizador({ segundos: seg, alTick: tic, alFin: pum });
    mostrar();
    reloj.iniciar(seg);
  }

  function montar() {
    TYJ.vaciar(raiz);
    ui = {};
    ui.hud = TYJ.hud([['pregunta', 'Pregunta', '1/' + TOTAL], ['tiempo', 'Tiempo', String(t.seg)], ['puntos', 'Puntos', '0']]);
    ui.etapas = TYJ.etapas(TOTAL);

    /* Escena: el globo (con el margen escrito dentro), el cartel de pista y la barra de presión */
    ui.margen = h('p', { class: 'gc-margen', 'aria-live': 'off' });
    ui.globo = h('div', { class: 'gc-globo' }, dibujarGlobo(), ui.margen);
    if (!calma) ui.globo.style.transform = 'scale(0.9)';
    ui.pista = h('div', { class: 'gc-pista', 'aria-hidden': 'true' });
    ui.nivelPresion = h('span', { class: 'gc-presion-nivel' });
    ui.presion = h('div', { class: 'gc-presion', 'aria-hidden': 'true' }, ui.nivelPresion);
    ui.escena = h('div', { class: 'gc-escena' }, ui.pista, ui.globo, ui.presion);

    /* Panel: franja del margen, pregunta, respuesta y pistas */
    ui.zona = h('span', { class: 'gc-zona' });
    ui.recta = h('div', { class: 'gc-recta', 'aria-hidden': 'true' }, ui.zona);
    ui.extremos = h('div', { class: 'gc-extremos', 'aria-hidden': 'true' }, h('span'), h('span'));
    ui.preg = h('p', { class: 'gc-pregunta', tabindex: '-1' });
    ui.campo = h('input', { class: 'gc-campo', id: 'gc-campo', type: 'number', inputmode: 'numeric', step: '1', autocomplete: 'off' });
    ui.probar = h('button', { class: 'boton-retro', type: 'submit' }, 'Probar');
    ui.pasar = h('button', { class: 'boton-retro boton-retro--sec', type: 'button', onclick: pasar }, 'Pasar');
    ui.form = h('form', { class: 'gc-form', novalidate: 'novalidate' }, h('label', { for: 'gc-campo' }, 'Tu respuesta', ui.campo), ui.probar, ui.pasar);
    ui.form.addEventListener('submit', function (e) { e.preventDefault(); probar(); });
    ui.msg = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.hist = h('ul', { class: 'gc-hist', 'aria-label': 'Respuestas probadas' });
    ui.siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: siguiente }, 'Siguiente');
    ui.dato = h('p', { class: 'gc-dato' });
    ui.revision = h('div', { class: 'gc-revision' }, ui.dato, ui.siguiente);
    ui.final = h('div'); ui.est = h('div');
    ui.panel = h('div', { class: 'gc-panel' },
      h('div', { class: 'gc-franja' }, ui.recta, ui.extremos, h('p', { class: 'texto-suave gc-ayuda', texto: 'La respuesta está en la franja amarilla.' })),
      ui.preg, ui.form, ui.msg, ui.hist, ui.revision);
    ui.mesa = h('div', { class: 'gc-mesa' }, ui.escena, ui.panel);
    [ui.hud.nodo, ui.etapas.nodo, ui.mesa, ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
  }

  function tic(r) {
    t.restante = r;
    ui.hud.poner('tiempo', Math.ceil(r), r <= 10);
    var usado = 1 - r / t.seg, tenso = r / t.seg <= 0.25;
    ui.globo.classList.toggle('gc-globo--tenso', tenso);
    ui.escena.classList.toggle('gc-escena--tensa', tenso);
    ui.nivelPresion.style.setProperty('width', (usado * 100).toFixed(1) + '%');
    if (!calma) ui.globo.style.transform = 'scale(' + (0.9 + 0.3 * usado).toFixed(3) + ')';
  }

  function pintarMargen() {
    var q = t.lista[t.i];
    TYJ.vaciar(ui.margen);
    [document.createTextNode('Entre '), h('span', { class: 'gc-n', texto: U.miles(t.min) }), document.createTextNode(' y '), h('span', { class: 'gc-n', texto: U.miles(t.max) })]
      .forEach(function (n) { ui.margen.appendChild(n); });
    var total = q.max - q.min + 1;
    ui.zona.style.left = ((t.min - q.min) * 100 / total) + '%';
    ui.zona.style.width = (Math.max(1, t.max - t.min + 1) * 100 / total) + '%';
  }

  function cartel(dir, texto) {
    TYJ.vaciar(ui.pista);
    ui.pista.className = 'gc-pista gc-pista--' + dir;
    if (dir !== 'ok') ui.pista.appendChild(flecha(dir));
    ui.pista.appendChild(h('span', { texto: texto }));
    reiniciar(ui.pista, 'gc-pista--on');
  }

  function mostrar() {
    var q = t.lista[t.i];
    t.min = q.min; t.max = q.max; t.intentos = []; t.fase = 'jugando';
    ui.globo.classList.remove('gc-globo--feliz', 'gc-globo--ay');
    ui.pista.className = 'gc-pista';
    ui.hud.poner('pregunta', (t.i + 1) + '/' + TOTAL);
    ui.preg.textContent = q.p;
    ui.extremos.firstChild.textContent = U.miles(q.min); ui.extremos.lastChild.textContent = U.miles(q.max);
    TYJ.vaciar(ui.hist);
    ui.msg.textContent = '';
    ui.revision.hidden = true;
    ui.campo.disabled = ui.probar.disabled = ui.pasar.disabled = false;
    ui.campo.value = '';
    pintarMargen();
    ui.campo.focus({ preventScroll: true });
  }

  function probar() {
    if (t.fase !== 'jugando') return;
    var q = t.lista[t.i], txt = String(ui.campo.value).trim(), v = Number(txt);
    if (!txt || !isFinite(v) || Math.floor(v) !== v) { ui.msg.textContent = 'Escribe un número entero.'; return; }
    if (v < t.min || v > t.max) { ui.msg.textContent = 'Ya sabes que la respuesta está entre ' + U.miles(t.min) + ' y ' + U.miles(t.max) + '. Prueba con un número de ese margen.'; return; }
    t.intentos.push(v);
    if (v === q.r) return cerrar(true);
    var alto = v < q.r, pista = U.miles(v) + ': más ' + (alto ? 'alto' : 'bajo') + '.';
    if (alto) t.min = v + 1; else t.max = v - 1;
    ui.hist.insertBefore(h('li', { class: alto ? 'gc-hist--alto' : 'gc-hist--bajo', texto: pista }), ui.hist.firstChild);
    ui.msg.textContent = pista;
    cartel(alto ? 'alto' : 'bajo', alto ? 'Más alto' : 'Más bajo');
    if (!calma) reiniciar(ui.globo, 'gc-globo--ay');
    ui.campo.value = '';
    pintarMargen();
    ui.campo.focus({ preventScroll: true });
  }

  function pasar() { if (t.fase === 'jugando') cerrar(false); }

  function cerrar(acierto) {
    var q = t.lista[t.i], n = t.intentos.length, pts = acierto ? Math.max(20, 100 - 10 * (n - 1)) : 0;
    t.restante = reloj.parar();
    t.fase = 'revisando';
    t.puntos += pts;
    t.resultados.push({ ok: acierto, intentos: n, pts: pts, p: q.p, r: q.r });
    ui.etapas.marcar(t.i, acierto);
    ui.hud.poner('puntos', t.puntos);
    ui.campo.disabled = ui.probar.disabled = ui.pasar.disabled = true;
    ui.msg.textContent = (acierto ? '¡Exacto! Era ' + U.miles(q.r) + ' (' + n + (n === 1 ? ' intento' : ' intentos') + ', +' + pts + ' puntos).' : 'Era ' + U.miles(q.r) + '.');
    t.min = t.max = q.r;
    pintarMargen();
    TYJ.vaciar(ui.margen);
    ui.margen.appendChild(document.createTextNode(acierto ? '¡Exacto!' : 'Era'));
    ui.margen.appendChild(h('span', { class: 'gc-n', texto: U.miles(q.r) }));
    if (acierto) { ui.globo.classList.add('gc-globo--feliz'); cartel('ok', '¡Exacto! +' + pts); }
    ui.dato.textContent = q.d;
    ui.siguiente.textContent = t.i + 1 === TOTAL ? 'Ver resultado' : 'Siguiente';
    ui.revision.hidden = false;
    ui.siguiente.focus({ preventScroll: true });
  }

  function siguiente() {
    if (t.fase !== 'revisando') return;
    if (t.i + 1 === TOTAL) return terminar(true);
    t.i++;
    mostrar();
    reloj.iniciar(t.restante);
  }

  function pum() {
    if (t.fase !== 'jugando') return;
    var q = t.lista[t.i];
    ui.globo.classList.remove('gc-globo--tenso', 'gc-globo--ay');
    ui.globo.classList.add('gc-globo--pum');
    ui.globo.style.transform = '';
    ui.nivelPresion.style.setProperty('width', '100%');
    ui.pista.className = 'gc-pista';
    ui.margen.textContent = '¡PUM!';
    ui.msg.textContent = 'El globo ha reventado. La respuesta era ' + U.miles(q.r) + '.';
    ui.campo.disabled = ui.probar.disabled = ui.pasar.disabled = true;
    t.resultados.push({ ok: false, intentos: t.intentos.length, pts: 0, p: q.p, r: q.r, tiempo: true });
    ui.etapas.marcar(t.i, false);
    terminar(false);
  }

  function terminar(completo) {
    t.fase = 'fin';
    var bonus = completo ? Math.floor(t.restante) : 0, total = t.puntos + bonus;
    var exactas = t.resultados.filter(function (r) { return r.ok; }).length;
    sesion.registrar(total, completo && exactas > 0);
    ui.revision.hidden = true;
    var detalles = t.resultados.map(function (r, i) {
      return 'Pregunta ' + (i + 1) + ': ' + (r.ok ? 'exacta en ' + r.intentos + (r.intentos === 1 ? ' intento' : ' intentos') + ' (+' + r.pts + ')' : (r.tiempo ? 'sin tiempo' : 'pasada') + ', era ' + U.miles(r.r));
    });
    if (bonus) detalles.push('Tiempo sobrante: +' + bonus + ' puntos.');
    TYJ.final(ui.final.appendChild(h('div')), { titulo: completo ? '¡Globo a salvo!' : '¡PUM! El globo ha reventado', nivel: U.nivel(total, RANGOS),
      puntos: total, unidad: 'puntos', detalles: detalles,
      compartir: 'Globo de cifras (' + NIVELES[nivel].nombre.split(' (')[0].toLowerCase() + '): ' + total + ' puntos, ' + exactas + ' de ' + TOTAL + ' exactas' + (completo ? '.' : ', pero el globo reventó.'),
      textoRepetir: 'Otro globo', alRepetir: inicio });
  }

  function arrancar() {
    TYJ.datos('globo-de-cifras/preguntas.json').then(function (json) { preguntas = json.preguntas; inicio(); }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
