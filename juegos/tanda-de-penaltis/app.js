/* TANDA DE PENALTIS: cinco tiros por equipo, alternados (tú chutas y luego te lanzas de portero), y muerte súbita si hay empate.
   Al chutar eliges una de seis zonas de la portería (3 columnas × 2 alturas) y la barra de fuerza se detiene en ese instante: dentro de la franja verde el tiro
   es bueno, flojo lo para el portero y pasado se va por encima del larguero. El portero rival adivina tu zona más repetida un tercio de las veces.
   Hay un modo sin barra de fuerza (siempre tiro bueno). Todo en memoria; nada se guarda. */
(function () {
  'use strict';
  var TYJ = window.TYJ, U = TYJ.util, h = TYJ.h;
  var raiz = document.getElementById('tp');
  if (!raiz) return;

  var NOMBRES = ['arriba a la izquierda', 'arriba en el centro', 'arriba a la derecha', 'abajo a la izquierda', 'abajo en el centro', 'abajo a la derecha'];
  var FX = [0.17, 0.5, 0.83, 0.17, 0.5, 0.83], FY = [0.27, 0.27, 0.27, 0.72, 0.72, 0.72];     // centro de cada zona dentro de la portería (0 a 1)
  var PESOS_RIVAL = [22, 8, 22, 18, 12, 18];                                                  // dónde suele chutar el rival
  var FUERZA_MIN = 45, FUERZA_MAX = 88;                                                      // franja verde de la barra (en %)
  var PAUSA = 1500;
  var sesion = TYJ.Sesion(null, { victorias: true, racha: true, mejor: false });
  var sinBarra = false;                                                                      // preferencia solo en memoria
  var t = null, ui = null, reloj = null, fuerza = 0, pasos = 0;

  /* La portería ocupa el 84 % del ancho y el 56 % del alto del campo dibujado: así se pasa de zona a posición en el campo */
  function posX(z) { return 8 + 84 * FX[z]; }
  function posY(z) { return 4 + 56 * FY[z]; }

  function nueva() {
    detener();
    t = { jug: [], rival: [], k: 0, golesJ: 0, golesR: 0, ocupado: false, fin: false, zonas: [0, 0, 0, 0, 0, 0], paradas: 0, final: null };
    montar(); turno();
  }

  function detener() { if (reloj) { clearInterval(reloj); reloj = null; } }

  /* ---- Pantalla */
  function bolas(lista, total) {
    var nodos = [];
    for (var i = 0; i < total; i++) {
      var r = lista[i];
      nodos.push(h('li', { class: 'tp-bola' + (r === 'gol' ? ' tp-bola--gol' : r === 'fallo' ? ' tp-bola--fallo' : ''), 'aria-label': 'Tiro ' + (i + 1) + ': ' + (r === 'gol' ? 'gol' : r === 'fallo' ? 'fallado' : 'pendiente') }));
    }
    return nodos;
  }
  function pintarMarcador() {
    var total = Math.max(5, t.jug.length + (t.jug.length === t.rival.length && t.jug.length >= 5 ? 1 : 0), t.rival.length);
    TYJ.vaciar(ui.filaJ).appendChild(h('span', { class: 'tp-quien', texto: 'Tú' })); bolas(t.jug, total).forEach(function (n) { ui.filaJ.appendChild(n); });
    TYJ.vaciar(ui.filaR).appendChild(h('span', { class: 'tp-quien', texto: 'Rival' })); bolas(t.rival, total).forEach(function (n) { ui.filaR.appendChild(n); });
    ui.hud.poner('marc', t.golesJ + ' - ' + t.golesR);
  }

  function montar() {
    TYJ.vaciar(raiz); ui = {};
    ui.hud = TYJ.hud([['marc', 'Marcador', '0 - 0'], ['ronda', 'Ronda', '1']]);
    ui.filaJ = h('ol', { class: 'tp-fila', 'aria-label': 'Tus tiros' }); ui.filaR = h('ol', { class: 'tp-fila', 'aria-label': 'Tiros del rival' });
    ui.marcador = h('div', { class: 'tp-marcador' }, ui.filaJ, ui.filaR);
    ui.msg = h('p', { class: 'mensaje tp-msg', role: 'status', 'aria-live': 'polite' });
    ui.zonas = NOMBRES.map(function (n, i) { return h('button', { class: 'tp-zona', type: 'button', 'data-zona': String(i), onclick: function () { elegir(i); } }); });
    ui.porteria = h('div', { class: 'tp-porteria' }, ui.zonas);
    ui.portero = h('div', { class: 'tp-portero', 'aria-hidden': 'true' }, portero());
    ui.balon = h('div', { class: 'tp-balon', 'aria-hidden': 'true' });
    ui.campo = h('div', { class: 'tp-campo' }, ui.porteria, ui.portero, ui.balon, h('span', { class: 'tp-punto', 'aria-hidden': 'true' }));
    ui.aguja = h('span', { class: 'tp-aguja' });
    ui.barra = h('div', { class: 'tp-fuerza', 'aria-hidden': 'true' }, h('span', { class: 'tp-fuerza-verde' }), ui.aguja);
    ui.ayuda = h('p', { class: 'texto-suave tp-ayuda' });
    ui.opcion = h('button', { class: 'boton-retro boton-retro--sec boton-retro--chico', type: 'button', 'aria-pressed': String(sinBarra), onclick: function () {
      sinBarra = !sinBarra; ui.opcion.setAttribute('aria-pressed', String(sinBarra)); if (!t.fin && !t.ocupado && t.k % 2 === 0) preparar();
    } }, 'Sin barra de fuerza');
    ui.final = h('div'); ui.est = h('div');
    [ui.hud.nodo, ui.marcador, ui.campo, ui.barra, ui.msg, ui.ayuda, h('div', { class: 'fila' }, ui.opcion), ui.final, ui.est].forEach(function (n) { raiz.appendChild(n); });
    sesion.montar(ui.est);
    colocar(ui.balon, 50, 86); colocar(ui.portero, 50, 40, 0);
    pintarMarcador();
  }
  function colocar(nodo, x, y, giro) {
    nodo.style.left = x + '%'; nodo.style.top = y + '%';
    if (giro != null) nodo.style.setProperty('--giro', giro + 'deg');
  }
  function portero() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 12 16'); svg.setAttribute('shape-rendering', 'crispEdges'); svg.setAttribute('focusable', 'false');
    [[4, 0, 4, 3, 'tp-piel'], [3, 3, 6, 6, 'tp-camiseta'], [0, 3, 3, 3, 'tp-guante'], [9, 3, 3, 3, 'tp-guante'], [3, 9, 2, 6, 'tp-pantalon'], [7, 9, 2, 6, 'tp-pantalon']].forEach(function (r) {
      var e = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      e.setAttribute('x', r[0]); e.setAttribute('y', r[1]); e.setAttribute('width', r[2]); e.setAttribute('height', r[3]); e.setAttribute('class', r[4]); svg.appendChild(e);
    });
    return svg;
  }

  /* ---- Turnos */
  function turno() {
    var chutaJugador = t.k % 2 === 0;
    t.ocupado = false;
    ui.hud.poner('ronda', Math.floor(t.k / 2) + 1);
    ui.zonas.forEach(function (z, i) {
      z.disabled = false;
      z.setAttribute('aria-label', (chutaJugador ? 'Chutar ' : 'Lanzarte ') + NOMBRES[i]);
    });
    colocar(ui.balon, 50, 86); colocar(ui.portero, 50, 40, 0);
    ui.balon.classList.remove('tp-balon--vuela');
    if (chutaJugador) preparar();
    else {
      detener(); ui.barra.hidden = true;
      ui.msg.textContent = 'Turno del portero: el rival va a chutar. Elige hacia dónde te lanzas.';
      ui.ayuda.textContent = 'Si coincides con su zona, paras el penalti.';
    }
    TYJ.anunciar(ui.msg.textContent || 'Te toca chutar.');
  }
  function preparar() {
    detener();
    ui.msg.textContent = 'Te toca chutar. Elige una zona de la portería.';
    if (sinBarra) {
      ui.barra.hidden = true;
      ui.ayuda.textContent = 'Sin barra de fuerza: todos los tiros salen bien. Solo importa a qué zona vas.';
    } else {
      ui.barra.hidden = false;
      ui.ayuda.textContent = 'La barra va y viene: el tiro sale con la fuerza que marque cuando pulses una zona. Lo bueno es la franja verde.';
      pasos = 0;
      reloj = setInterval(function () {
        pasos += 1;
        var fase = (pasos % 60) / 60;                                   // una ida y vuelta cada 1,5 s
        fuerza = Math.round((fase < 0.5 ? fase * 2 : (1 - fase) * 2) * 100);
        ui.aguja.style.left = fuerza + '%';
      }, 25);
    }
  }

  function pesoAleatorio(pesos) {
    var total = pesos.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
    for (var i = 0; i < pesos.length; i++) { r -= pesos[i]; if (r < 0) return i; }
    return pesos.length - 1;
  }
  /* El portero rival se lanza a tu zona más repetida un 35 % de las veces; el resto, al azar. */
  function zonaPortero() {
    var maxima = 0, favorita = 0;
    t.zonas.forEach(function (n, i) { if (n > maxima) { maxima = n; favorita = i; } });
    return maxima >= 2 && Math.random() < 0.35 ? favorita : U.entre(0, 5);
  }

  function elegir(i) {
    if (t.ocupado || t.fin) return;
    t.ocupado = true; detener();
    ui.zonas.forEach(function (z) { z.disabled = true; });
    var chuta = t.k % 2 === 0, resultado, bx = posX(i), by = posY(i), px, py, giro;
    if (chuta) {
      var f = sinBarra ? 70 : fuerza;
      t.zonas[i]++;
      var dive = zonaPortero();
      if (f < FUERZA_MIN) { resultado = 'parada'; dive = i; ui.msg.textContent = 'Demasiado flojo: el portero lo para sin problema.'; }
      else if (f > FUERZA_MAX) { resultado = 'alto'; by = -4; ui.msg.textContent = 'Te has pasado de fuerza: el balón se va por encima del larguero.'; }
      else if (dive === i) { resultado = 'parada'; ui.msg.textContent = '¡Parada del portero! Se lanzó a tu misma zona.'; }
      else { resultado = 'gol'; ui.msg.textContent = '¡GOL! ' + mayus(NOMBRES[i]) + '.'; }
      px = posX(dive); py = posY(dive);
    } else {
      var zr = pesoAleatorio(PESOS_RIVAL);
      if (Math.random() < 0.12) { resultado = 'fuera'; bx = Math.random() < 0.5 ? 3 : 97; by = 18; ui.msg.textContent = 'El rival ha fallado: el balón se va fuera.'; px = posX(i); py = posY(i); }
      else if (zr === i) { resultado = 'parada'; bx = posX(zr); by = posY(zr); ui.msg.textContent = '¡Paradón! El rival chutó ' + NOMBRES[zr] + ' y te lanzaste a esa zona.'; px = posX(i); py = posY(i); t.paradas++; }
      else { resultado = 'gol'; bx = posX(zr); by = posY(zr); ui.msg.textContent = 'Gol del rival: chutó ' + NOMBRES[zr] + ' y tú te lanzaste ' + NOMBRES[i] + '.'; px = posX(i); py = posY(i); }
    }
    giro = (px < 40 ? -55 : px > 60 ? 55 : 0);
    ui.balon.classList.add('tp-balon--vuela');
    colocar(ui.balon, bx, by);
    colocar(ui.portero, px, py, giro);
    registrar(chuta, resultado);
    TYJ.anunciar(ui.msg.textContent);
    setTimeout(siguiente, PAUSA);
  }
  function mayus(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function registrar(chuta, resultado) {
    var gol = resultado === 'gol';
    if (chuta) { t.jug.push(gol ? 'gol' : 'fallo'); if (gol) t.golesJ++; }
    else { t.rival.push(gol ? 'gol' : 'fallo'); if (gol) t.golesR++; }
    pintarMarcador();
  }

  /* ¿Está decidida la tanda? Primero se resuelve la ronda de los cinco tiros por equipo y, si hay empate, la muerte súbita (cada par de tiros) */
  function decidida() {
    var j = t.jug.length, r = t.rival.length;
    if (j < 5 || r < 5) {
      if (t.golesJ > t.golesR + (5 - r)) return 'gana';
      if (t.golesR > t.golesJ + (5 - j)) return 'pierde';
      return null;
    }
    if (j === r) return t.golesJ > t.golesR ? 'gana' : (t.golesJ < t.golesR ? 'pierde' : null);
    return null;
  }

  function siguiente() {
    var d = decidida();
    if (d) return fin(d === 'gana');
    t.k++;
    turno();
  }

  function fin(gano) {
    t.fin = true; detener(); ui.barra.hidden = true; ui.msg.textContent = ''; ui.ayuda.textContent = '';
    ui.zonas.forEach(function (z) { z.disabled = true; });
    sesion.registrar(t.golesJ, gano);
    var detalles = ['Marcador final: ' + t.golesJ + ' - ' + t.golesR, 'Paradas como portero: ' + t.paradas];
    if (t.jug.length > 5) detalles.push('Hubo muerte súbita tras el empate a ' + Math.min(t.golesJ, t.golesR) + ' en los cinco primeros tiros.');
    TYJ.final(ui.final.appendChild(h('div')), { titulo: gano ? '¡Has ganado la tanda!' : 'Has perdido la tanda', puntos: t.golesJ, unidad: t.golesJ === 1 ? 'gol' : 'goles', detalles: detalles,
      compartir: 'Tanda de penaltis: ' + (gano ? 'gané' : 'perdí') + ' ' + t.golesJ + ' - ' + t.golesR + (t.paradas ? ' con ' + t.paradas + (t.paradas === 1 ? ' parada' : ' paradas') : '') + '.',
      textoRepetir: 'Otra tanda', alRepetir: nueva });
  }

  nueva();
})();
