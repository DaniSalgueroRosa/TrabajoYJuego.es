/* PALABRA INFINITA
   Adivina la palabra oculta en 6 intentos (4, 5, 6 o 7 letras). Palabras de juegos/datos/palabras.json.
   Nada se guarda en el dispositivo: las estadísticas viven en variables y desaparecen al recargar. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('pi');
  if (!raiz) return;

  var INTENTOS = 6;
  var LONGITUDES = [4, 5, 6, 7];
  var TECLADO = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
  var PRIORIDAD = { no: 1, hay: 2, ok: 3 };
  var EMOJI = { ok: '🟩', hay: '🟨', no: '⬛' };
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var palabras = {};        // por longitud: { soluciones: [{n, v}], validas: Set }
  var usadas = {};          // palabras ya jugadas en esta sesión, por longitud
  var distribucion = [0, 0, 0, 0, 0, 0];
  var longitud = 5;
  var g = null;             // partida en curso
  var ui = {};

  /* ---------------------------------------------------------------- datos */
  function prepararDatos(json) {
    LONGITUDES.forEach(function (n) {
      var d = json.longitudes[String(n)], validas = new Set();
      var soluciones = d.soluciones.map(function (v) { var k = U.norm(v); validas.add(k); return { n: k, v: v }; });
      d.validas.forEach(function (v) { validas.add(U.norm(v)); });
      palabras[n] = { soluciones: soluciones, validas: validas };
    });
  }

  /* ---------------------------------------------------------------- interfaz */
  function construir() {
    TYJ.vaciar(raiz);
    ui.botonesLongitud = LONGITUDES.map(function (n) {
      return h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': 'false', 'aria-label': n + ' letras',
        onclick: function () { if (n !== longitud || g.terminado || g.filas.length) nuevaPartida(n); } }, String(n));
    });
    ui.info = h('p', { class: 'pi-info' });
    ui.rendirse = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', onclick: rendirse }, 'Rendirme');
    ui.mensaje = h('p', { class: 'mensaje', role: 'status', 'aria-live': 'polite' });
    ui.tablero = h('div', { class: 'pi-tablero', role: 'grid' });
    ui.teclado = h('div', { class: 'pi-teclado', role: 'group', 'aria-label': 'Teclado en pantalla' });
    ui.panel = h('div', { hidden: true });
    ui.sesion = h('div');
    ui.dist = h('ul', { class: 'pi-dist', 'aria-label': 'Aciertos por número de intentos' });

    TECLADO.forEach(function (letras, i) {
      var fila = h('div', { class: 'pi-teclado-fila' });
      if (i === 2) fila.appendChild(h('button', { class: 'pi-tecla pi-tecla--ancha', type: 'button', onclick: enviar }, 'Intro'));
      Array.from(letras).forEach(function (l) {
        var b = h('button', { class: 'pi-tecla', type: 'button', 'data-letra': l, 'aria-label': l === 'ñ' ? 'letra eñe' : 'letra ' + l, onclick: function () { escribir(l); } }, l);
        fila.appendChild(b);
      });
      if (i === 2) fila.appendChild(h('button', { class: 'pi-tecla pi-tecla--ancha', type: 'button', 'aria-label': 'Borrar la última letra', onclick: borrar }, 'Borrar'));
      ui.teclado.appendChild(fila);
    });

    raiz.appendChild(h('div', { class: 'pi-controles' },
      h('div', { class: 'pi-longitud', role: 'group', 'aria-labelledby': 'pi-longitud-etiqueta' },
        h('span', { class: 'pi-longitud-etiqueta', id: 'pi-longitud-etiqueta', texto: 'Letras:' }), ui.botonesLongitud),
      ui.info));
    raiz.appendChild(ui.tablero);
    raiz.appendChild(ui.mensaje);
    raiz.appendChild(ui.teclado);
    raiz.appendChild(h('div', { class: 'fila fila--centro' }, ui.rendirse));
    raiz.appendChild(ui.panel);
    raiz.appendChild(h('div', { class: 'pi-sesion-bloque' }, ui.sesion, h('h3', { texto: 'Aciertos por intento (esta sesión)' }), ui.dist));
    ui.estadisticas = TYJ.Sesion(ui.sesion, { victorias: true, racha: true, mejor: false });
    pintarDistribucion(-1);
  }

  function pintarTablero() {
    TYJ.vaciar(ui.tablero);
    ui.tablero.style.setProperty('--n', longitud);
    ui.tablero.setAttribute('data-n', longitud);
    ui.tablero.setAttribute('aria-label', 'Tablero: ' + INTENTOS + ' intentos de ' + longitud + ' letras');
    ui.filas = [];
    for (var r = 0; r < INTENTOS; r++) {
      var fila = h('div', { class: 'pi-fila', role: 'row' }), celdas = [];
      for (var c = 0; c < longitud; c++) {
        var celda = h('div', { class: 'pi-celda', role: 'gridcell', 'aria-label': 'vacía' });
        celdas.push(celda); fila.appendChild(celda);
      }
      ui.filas.push({ nodo: fila, celdas: celdas });
      ui.tablero.appendChild(fila);
    }
  }

  function pintarEscritura() {
    var fila = ui.filas[g.filas.length];
    if (!fila) return;
    fila.celdas.forEach(function (celda, i) {
      var l = g.actual[i];
      celda.textContent = l ? l : '';
      celda.classList.toggle('llena', !!l);
      celda.setAttribute('aria-label', l ? 'letra ' + l : 'vacía');
    });
  }

  function aviso(texto, tipo) {
    ui.mensaje.textContent = texto || '';
    ui.mensaje.className = 'mensaje' + (tipo ? ' mensaje--' + tipo : '');
  }
  function actualizarInfo() {
    ui.info.textContent = g.terminado ? 'Partida terminada' : 'Intento ' + Math.min(g.filas.length + 1, INTENTOS) + ' de ' + INTENTOS;
    ui.botonesLongitud.forEach(function (b, i) { b.setAttribute('aria-pressed', String(LONGITUDES[i] === longitud)); });
    ui.rendirse.hidden = g.terminado;
  }
  function pintarTeclas() {
    TYJ.$$('.pi-tecla[data-letra]', ui.teclado).forEach(function (b) {
      var e = g.teclas[b.getAttribute('data-letra')];
      if (e) b.setAttribute('data-estado', e); else b.removeAttribute('data-estado');
      var base = b.getAttribute('aria-label').replace(/, .*$/, '');
      b.setAttribute('aria-label', e ? base + ', ' + { ok: 'bien colocada', hay: 'en otro sitio', no: 'no está' }[e] : base);
    });
  }
  function pintarDistribucion(ultima) {
    TYJ.vaciar(ui.dist);
    var max = Math.max.apply(null, distribucion.concat([1]));
    distribucion.forEach(function (n, i) {
      var barra = h('span', { class: 'pi-dist-barra' + (i === ultima ? ' pi-dist-barra--ultima' : ''), texto: String(n) });
      barra.style.width = Math.max(8, Math.round(n / max * 100)) + '%';
      ui.dist.appendChild(h('li', {}, h('span', { texto: String(i + 1) }), barra));
    });
  }

  /* ---------------------------------------------------------------- partida */
  function elegirPalabra(n) {
    var todas = palabras[n].soluciones, ya = usadas[n] = usadas[n] || {};
    var libres = todas.filter(function (p) { return !ya[p.n]; });
    if (!libres.length) { usadas[n] = ya = {}; libres = todas; }
    var p = U.elegir(libres);
    ya[p.n] = true;
    return p;
  }

  function nuevaPartida(n) {
    longitud = n || longitud;
    var p = elegirPalabra(longitud);
    g = { secreta: p.n, vista: p.v, filas: [], resultados: [], actual: [], teclas: {}, terminado: false, animando: false, pendiente: null };
    pintarTablero();
    pintarTeclas();
    ui.panel.hidden = true; TYJ.vaciar(ui.panel);
    ui.teclado.hidden = false;
    aviso('');
    actualizarInfo();
    TYJ.anunciar('Nueva palabra de ' + longitud + ' letras. Tienes ' + INTENTOS + ' intentos.');
  }

  function escribir(letra) {
    if (!g || g.terminado || g.animando) return;
    if (g.actual.length >= longitud) return;
    g.actual.push(U.norm(letra)); g.pendiente = null;
    aviso('');
    pintarEscritura();
  }
  function borrar() {
    if (!g || g.terminado || g.animando || !g.actual.length) return;
    g.actual.pop(); g.pendiente = null;
    aviso('');
    pintarEscritura();
  }
  function sacudir() {
    var f = ui.filas[g.filas.length];
    if (!f) return;
    f.nodo.classList.remove('pi-fila--sacudida'); void f.nodo.offsetWidth; f.nodo.classList.add('pi-fila--sacudida');
  }

  function enviar() {
    if (!g || g.terminado || g.animando) return;
    if (g.actual.length < longitud) {
      sacudir(); aviso('Faltan letras: la palabra tiene ' + longitud + '.', 'mal'); TYJ.anunciar('Faltan letras: la palabra tiene ' + longitud + '.');
      return;
    }
    var palabra = g.actual.join('');
    if (!palabras[longitud].validas.has(palabra) && g.pendiente !== palabra) {
      g.pendiente = palabra; sacudir();
      var t = '«' + palabra.toUpperCase() + '» no está en mi lista. Si existe, pulsa Intro otra vez para usarla.';
      aviso(t, 'mal'); TYJ.anunciar(t);
      return;
    }
    g.pendiente = null;
    var res = U.evaluarPalabra(palabra, g.secreta), fila = g.filas.length;
    g.filas.push(g.actual.slice()); g.resultados.push(res); g.actual = [];
    revelar(fila, res, palabra);
  }

  function revelar(fila, res, palabra) {
    g.animando = true; aviso('');
    var celdas = ui.filas[fila].celdas, paso = reducido ? 0 : 200;
    celdas.forEach(function (celda, i) {
      setTimeout(function () {
        celda.classList.remove('llena');
        celda.classList.add(res[i]);
        celda.setAttribute('aria-label', 'letra ' + palabra[i] + ', ' + { ok: 'bien colocada', hay: 'en otro sitio', no: 'no está' }[res[i]]);
        var actual = g.teclas[palabra[i]];
        if (!actual || PRIORIDAD[res[i]] > PRIORIDAD[actual]) g.teclas[palabra[i]] = res[i];
      }, i * paso);
    });
    setTimeout(function () {
      g.animando = false;
      pintarTeclas();
      var resumen = 'Intento ' + (fila + 1) + ': ' + res.map(function (e, i) { return palabra[i] + ' ' + { ok: 'bien', hay: 'en otro sitio', no: 'no está' }[e]; }).join(', ') + '.';
      TYJ.anunciar(resumen);
      if (res.every(function (e) { return e === 'ok'; })) terminar(true);
      else if (g.filas.length >= INTENTOS) terminar(false);
      else actualizarInfo();
    }, longitud * paso + (reducido ? 0 : 150));
  }

  function rendirse() {
    if (!g || g.terminado || g.animando) return;
    terminar(false);
  }

  function textoParaCompartir(ganada) {
    var lineas = ['Palabra Infinita · ' + longitud + ' letras · ' + (ganada ? g.filas.length : 'X') + '/' + INTENTOS];
    g.resultados.forEach(function (r) { lineas.push(r.map(function (e) { return EMOJI[e]; }).join('')); });
    return lineas.join('\n');
  }

  function terminar(ganada) {
    g.terminado = true;
    ui.estadisticas.registrar(0, ganada);
    if (ganada) distribucion[g.filas.length - 1]++;
    pintarDistribucion(ganada ? g.filas.length - 1 : -1);
    actualizarInfo();
    var frases = ['¡Increíble, a la primera!', '¡Qué ojo! En dos intentos.', '¡Muy bien!', '¡Bien jugado!', '¡Por los pelos!', '¡Lo has sacado en el último intento!'];
    ui.teclado.hidden = true;
    TYJ.final(ui.panel, {
      titulo: ganada ? frases[g.filas.length - 1] : 'No ha podido ser',
      puntos: ganada ? g.filas.length : null, unidad: ganada ? 'de ' + INTENTOS + ' intentos' : null,
      detalles: [(ganada ? 'La palabra era ' : 'La palabra era ') + g.vista.toUpperCase() + '.'],
      compartir: g.filas.length ? textoParaCompartir(ganada) : null,
      textoRepetir: 'Otra palabra', alRepetir: function () { nuevaPartida(longitud); }
    });
    ui.panel.hidden = false;
  }

  /* ---------------------------------------------------------------- teclado físico */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !g) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    var enBoton = t && t.closest && t.closest('button, a');
    if (e.key === 'Enter') {
      if (enBoton && enBoton.matches(':focus-visible')) return;          // con el foco en un botón por teclado, Intro lo pulsa
      e.preventDefault(); enviar();
    } else if (e.key === 'Backspace') {
      e.preventDefault(); borrar();
    } else if (e.key.length === 1 && /^[a-zñáéíóúü]$/i.test(e.key)) {
      e.preventDefault(); escribir(e.key);
    }
  });

  /* ---------------------------------------------------------------- arranque */
  function arrancar() {
    TYJ.datos('datos/palabras.json').then(function (json) {
      prepararDatos(json);
      construir();
      nuevaPartida(5);
    }).catch(function () { TYJ.errorDeCarga(raiz, arrancar); });
  }
  arrancar();
})();
