/* MOTOR DE RONDAS: la base de los juegos de preguntas y respuestas (cultura general, intruso, acertijos de una palabra, mates, patrones…).
   Un juego solo tiene que decir cuántas rondas hay, cuánto tiempo se da y cómo se genera la siguiente ronda; el motor dibuja el marcador,
   la barra de tiempo, las respuestas, el aviso de acierto o fallo, la pantalla final y las estadísticas de la sesión (en memoria).

   TYJ.Rondas(raiz, config).iniciar()
   config: {
     titulo, intro,                 // pantalla de inicio
     textoEmpezar,                  // 'Empezar'
     rondas: 10,                    // 0 = sin límite (acaba por vidas o por tiempo)
     segundos: 20,                  // tiempo por ronda (0 = sin límite)
     tiempoTotal: 0,                // segundos para toda la partida (sustituye al tiempo por ronda)
     vidas: 0,                      // fallos permitidos antes de terminar (0 = no cuentan)
     auto: false,                   // true = pasa solo a la siguiente ronda tras responder
     ruta: false,                   // true (con rondas fijas) = dibuja la ruta de rondas (una casilla por ronda: acertada, fallada, en curso)
     pausas: [450, 1400],           // milisegundos de pausa tras un acierto y tras un fallo cuando auto es true
     alIniciar: function () {},     // se llama al empezar cada partida (para barajar datos)
     siguiente: function (n, est) { return ronda; },
     puntuar: function (ronda, acierto, restante, est) { return puntos; },   // opcional
     niveles: [[0, 'Novato'], …],   // opcional
     unidad: 'puntos',
     compartir: function (est, nivel) { return 'texto'; },
     detalleFinal: function (est) { return ['línea', …]; }                   // opcional
   }
   ronda: { enunciado, cuerpo (nodo opcional), opciones: ['a', 'b'], correcta: 0 (o un array de índices válidos),
            // o bien, para respuesta escrita:  aceptadas: ['perro'], numero: 42, placeholder: '…'
            // (con exacta: true la respuesta escrita debe coincidir letra por letra, sin perdonar erratas)
            explicacion, puntosBase (100 por defecto; el juego puede bajarlo mientras la ronda está abierta), etiqueta (para el repaso) }
   est: { n, puntos, aciertos, fallos, racha, mejorRacha, vidas, detalle[] }  */
(function (global) {
  'use strict';
  var TYJ = global.TYJ = global.TYJ || {};
  if (!global.document) return;

  TYJ.Rondas = function (raiz, cfg) {
    var U = TYJ.util, h = TYJ.h;
    var est, temporizador = null, global_ = null, cerrada = true, alTecla = null;
    var sesion = TYJ.Sesion(null, { etiquetaMejor: 'Mejor puntuación: ', victorias: false });

    function quitarTecla() { if (alTecla) { document.removeEventListener('keydown', alTecla); alTecla = null; } }
    function parar() { quitarTecla(); if (temporizador) temporizador.parar(); if (global_) global_.parar(); }

    /* ---- Inicio */
    function iniciar() {
      parar();
      TYJ.vaciar(raiz);
      raiz.appendChild(h('h2', { texto: cfg.titulo }));
      raiz.appendChild(h('p', { class: 'texto', texto: cfg.intro }));
      var b = h('button', { class: 'boton-retro', type: 'button', onclick: empezar }, cfg.textoEmpezar || 'Empezar');
      raiz.appendChild(h('div', { class: 'fila' }, b));
      var s = h('div'); raiz.appendChild(s); sesion.montar(s);
    }

    function empezar() {
      est = { n: 0, puntos: 0, aciertos: 0, fallos: 0, racha: 0, mejorRacha: 0, vidas: cfg.vidas || 0, detalle: [], terminada: false };
      if (cfg.alIniciar) cfg.alIniciar(est);
      global_ = null;
      if (cfg.tiempoTotal) {
        global_ = new TYJ.Temporizador({ segundos: cfg.tiempoTotal, alTick: function (r) { if (est && est.hud) { est.hud.poner('tiempo', Math.ceil(r), r <= 10); if (est.barra) est.barra.poner(r / cfg.tiempoTotal); } }, alFin: function () { if (!est.terminada) final(); } });
        est.globalArrancado = false;
      }
      ronda();
    }

    /* ---- Una ronda */
    function ronda() {
      quitarTecla();
      var r = cfg.siguiente(est.n, est);
      est.n++;
      cerrada = false;
      r.puntosBase = r.puntosBase == null ? 100 : r.puntosBase;
      var hud = TYJ.hud([].concat(
        cfg.rondas ? [['n', 'Ronda', est.n + ' / ' + cfg.rondas]] : [['n', 'Ronda', est.n]],
        cfg.tiempoTotal ? [['tiempo', 'Tiempo', Math.ceil(global_ ? global_.restante : cfg.tiempoTotal)]] : [],
        [['pts', 'Puntos', U.miles(est.puntos)], ['racha', 'Racha', est.racha]],
        cfg.vidas ? [['vidas', 'Vidas', est.vidas]] : []));
      est.hud = hud;
      var barra = TYJ.barraDeTiempo(), segundos = h('span', { class: 'rondas-segundos', 'aria-hidden': 'true' });
      est.barra = cfg.tiempoTotal ? barra : null;
      if (cfg.tiempoTotal) barra.poner(global_.restante / cfg.tiempoTotal);
      var zona = h('div', { role: 'status', 'aria-live': 'polite' });
      var cuerpo = h('div', { class: 'rondas-cuerpo' });
      TYJ.vaciar(raiz);
      raiz.appendChild(hud.nodo);
      var ruta = null;
      if (cfg.ruta && cfg.rondas) { ruta = TYJ.etapas(cfg.rondas, est.detalle.map(function (d) { return d.acierto; })); raiz.appendChild(ruta.nodo); }
      if (cfg.segundos || cfg.tiempoTotal) raiz.appendChild(h('div', { class: 'rondas-tiempo' }, barra.nodo, cfg.segundos ? segundos : null));
      raiz.appendChild(h('h2', { class: 'rondas-enunciado', tabindex: '-1', texto: r.enunciado }));
      if (r.cuerpo) raiz.appendChild(r.cuerpo);
      raiz.appendChild(cuerpo);
      raiz.appendChild(zona);

      if (cfg.segundos) {
        temporizador = new TYJ.Temporizador({ segundos: cfg.segundos,
          alTick: function (t) { barra.poner(t / cfg.segundos); segundos.textContent = String(Math.ceil(t)); segundos.classList.toggle('rondas-segundos--alerta', t <= 5); },
          alFin: function () { responder(null); } });
        temporizador.iniciar();
      }
      if (global_ && !est.globalArrancado) { est.globalArrancado = true; global_.iniciar(); }

      var botones = [], entrada = null;
      if (r.opciones) {
        var lista = h('div', { class: 'opciones opciones--' + (r.opciones.length <= 2 ? '2' : 'n') });
        r.opciones.forEach(function (texto, i) {
          var b = h('button', { class: 'opcion', type: 'button', 'aria-keyshortcuts': String(i + 1), onclick: function () { responder(i); } }, h('span', { class: 'opcion-tecla', 'aria-hidden': 'true', texto: (i + 1) + ' ' }), texto);
          botones.push(b); lista.appendChild(b);
        });
        cuerpo.appendChild(lista);
        alTecla = function (e) {
          if (e.ctrlKey || e.metaKey || e.altKey || cerrada) return;
          var i = parseInt(e.key, 10) - 1;
          if (i >= 0 && i < botones.length) { e.preventDefault(); responder(i); }
        };
        document.addEventListener('keydown', alTecla);
      } else {
        entrada = h('input', { id: 'rondas-respuesta', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: '60', placeholder: r.placeholder || 'Escribe tu respuesta', inputmode: r.numero != null ? 'decimal' : 'text' });
        var enviar = h('button', { class: 'boton-retro', type: 'submit' }, 'Responder');
        var form = h('form', { class: 'rondas-form', novalidate: true }, h('div', { class: 'fila' },
          h('div', { class: 'campo-retro' }, h('label', { for: 'rondas-respuesta', texto: 'Tu respuesta' }), entrada), enviar));
        form.addEventListener('submit', function (e) { e.preventDefault(); if (!entrada.value.trim()) { entrada.focus(); return; } responder(entrada.value); });
        cuerpo.appendChild(form);
        entrada.focus();
      }

      function esAcierto(resp) {
        if (resp == null) return false;
        if (r.opciones) return Array.isArray(r.correcta) ? r.correcta.indexOf(resp) >= 0 : resp === r.correcta;
        if (r.numero != null) { var v = parseFloat(String(resp).replace(',', '.')); return !isNaN(v) && Math.abs(v - r.numero) < 1e-9; }
        if (r.exacta) return r.aceptadas.some(function (x) { return U.clave(x) === U.clave(resp); });   // sin perdonar erratas (anagramas)
        return U.coincide(resp, r.aceptadas);
      }
      function textoCorrecta() {
        if (r.opciones) return (Array.isArray(r.correcta) ? r.correcta : [r.correcta]).map(function (i) { return r.opciones[i]; }).join(' / ');
        return r.numero != null ? String(r.numero).replace('.', ',') : r.aceptadas[0];
      }

      function responder(resp) {
        if (cerrada || est.terminada) return;
        cerrada = true; quitarTecla();
        var restante = temporizador ? temporizador.parar() : 0;
        var acierto = esAcierto(resp), pts = 0;
        if (acierto) {
          pts = cfg.puntuar ? cfg.puntuar(r, true, restante, est) :
            Math.round(r.puntosBase + (cfg.segundos ? r.puntosBase * 0.5 * restante / cfg.segundos : 0) + Math.min(est.racha, 5) * 10);
          est.aciertos++; est.racha++; est.mejorRacha = Math.max(est.mejorRacha, est.racha); est.puntos += pts;
        } else {
          est.fallos++; est.racha = 0; if (cfg.vidas) est.vidas--;
        }
        est.detalle.push({ etiqueta: r.etiqueta || r.enunciado, correcta: textoCorrecta(), acierto: acierto, explicacion: r.explicacion || '' });
        if (ruta) ruta.marcar(est.n - 1, acierto);
        hud.poner('pts', U.miles(est.puntos)); hud.poner('racha', est.racha); if (cfg.vidas) hud.poner('vidas', est.vidas, est.vidas <= 1);
        if (r.opciones) botones.forEach(function (b, i) {
          b.disabled = true;
          var buena = Array.isArray(r.correcta) ? r.correcta.indexOf(i) >= 0 : r.correcta === i;
          if (buena) b.classList.add('ok'); else if (i === resp) b.classList.add('mal');
        });
        else { entrada.disabled = true; TYJ.$('button[type=submit]', cuerpo).disabled = true; }

        var terminaPartida = (cfg.rondas && est.n >= cfg.rondas) || (cfg.vidas && est.vidas <= 0);
        var titulo = acierto ? '¡Correcto! +' + pts : (resp == null ? 'Se acabó el tiempo.' : 'Fallo.') + ' Era: ' + textoCorrecta();
        var siguiente = h('button', { class: 'boton-retro', type: 'button', onclick: function () { if (terminaPartida) final(); else ronda(); } }, terminaPartida ? 'Ver resultado' : 'Siguiente');
        var caja = h('div', { class: 'rondas-aviso' + (acierto ? ' rondas-aviso--ok' : '') },
          h('p', { class: 'mensaje ' + (acierto ? 'mensaje--ok' : 'mensaje--mal'), texto: titulo }),
          r.explicacion ? h('p', { class: 'texto-suave', texto: r.explicacion }) : null,
          cfg.auto ? null : h('div', { class: 'fila' }, siguiente));
        TYJ.vaciar(zona).appendChild(caja);
        TYJ.anunciar(titulo);
        if (cfg.auto) setTimeout(function () { if (est.terminada) return; if (terminaPartida) final(); else ronda(); }, (cfg.pausas || [450, 1400])[acierto ? 0 : 1]);
        else siguiente.focus();
      }
    }

    /* ---- Final */
    function final() {
      if (est.terminada) return;
      est.terminada = true; parar();
      var nivel = cfg.niveles ? U.nivel(est.puntos, cfg.niveles) : null;
      sesion.registrar(est.puntos);
      var detalles = [est.aciertos + ' aciertos de ' + (est.aciertos + est.fallos) + ' respuestas', 'Mejor racha: ' + est.mejorRacha];
      if (cfg.detalleFinal) detalles = detalles.concat(cfg.detalleFinal(est));
      var contenedor = h('div');
      TYJ.vaciar(raiz).appendChild(contenedor);
      TYJ.final(contenedor, { titulo: nivel ? 'Nivel: ' + nivel : 'Partida terminada', puntos: est.puntos, unidad: cfg.unidad || 'puntos', detalles: detalles,
        compartir: cfg.compartir ? cfg.compartir(est, nivel) : null, textoRepetir: 'Jugar otra vez', alRepetir: empezar });
      var fallos = est.detalle.filter(function (d) { return !d.acierto; });
      if (fallos.length) {
        contenedor.firstChild.appendChild(h('details', { class: 'rondas-repaso' }, h('summary', { texto: 'Repasa lo que has fallado (' + fallos.length + ')' }),
          h('ul', {}, fallos.map(function (d) {
            return h('li', {}, h('strong', { texto: d.etiqueta }), ' → ', d.correcta, d.explicacion ? h('span', { class: 'texto-suave', texto: ' · ' + d.explicacion }) : null);
          }))));
      }
      var s = h('div'); raiz.appendChild(s); sesion.montar(s);
    }

    return { iniciar: iniciar, sesion: sesion };
  };
})(typeof window !== 'undefined' ? window : globalThis);
