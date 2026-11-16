/* Prueba de audición (edad auditiva, orientativa): tonos agudos de 8 a 20 kHz a volumen bajo. Hay silencios de control para detectar respuestas por inercia. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var FREQS = [8000, 10000, 12000, 14000, 15000, 16000, 17000, 18000, 19000, 20000];
  var GANANCIA = 0.1, DUR = 1.2;
  var pasos = [], i = 0, oido = 0, oidos = 0, reales = 0, falsos = 0, seguidos = 0, sonado = false, estado = 'espera', panel = null, tempo = 0, silencios = 0;
  var datos = TT.datos([['p', 'Tono', '—'], ['o', 'Oídos', '0']]);
  var aviso = TT.h('p', { class: 'tt-aviso', role: 'status', texto: 'Empieza con el volumen del equipo bajo. Pulsa «Probar volumen» y ajústalo hasta que el sonido sea cómodo. No lo subas después para intentar oír los tonos agudos: si no los oyes, es normal.' });
  var bVolumen = TT.boton('Probar volumen', function () {
    if (!TT.audio()) { aviso.textContent = 'Tu navegador no permite reproducir audio, así que esta prueba no se puede hacer aquí.'; return; }
    TT.tono(1000, 0.8, GANANCIA);
    aviso.textContent = 'Si has oído un pitido suave y cómodo, el volumen es correcto. Mantenlo así durante toda la prueba.';
  }, true);
  var mensaje = TT.h('p', { class: 'pa-mensaje', role: 'status' });
  var bEmpezar = TT.boton('Empezar', function () { empezar(); });
  var bTono = TT.boton('Reproducir el tono', function () { reproducir(); });
  var bSi = TT.boton('Sí, lo he oído', function () { responder(true); });
  var bNo = TT.boton('No lo he oído', function () { responder(false); }, true);
  var botones = TT.h('div', { class: 'tt-fila tt-fila--centro' }, bSi, bNo);
  var juego = TT.h('div', { class: 'pa-juego' }, bTono, botones);
  var zona = TT.h('div', { class: 'tt-zona pa-zona' }, mensaje, bEmpezar, juego);

  function mostrar() {
    sonado = false; bSi.disabled = true; bNo.disabled = true; bTono.disabled = false;
    datos.poner('p', (i + 1) + '/' + pasos.length); datos.poner('o', String(oidos));
    mensaje.textContent = 'Tono ' + (i + 1) + ' de ' + pasos.length + '. Pulsa «Reproducir el tono» y escucha con atención. Algunos serán silencio.';
  }
  function empezar() {
    if (!TT.audio()) { aviso.textContent = 'Tu navegador no permite reproducir audio, así que esta prueba no se puede hacer aquí.'; return; }
    estado = 'jugando'; oido = 0; oidos = 0; reales = 0; falsos = 0; seguidos = 0; silencios = 0; i = 0;
    pasos = FREQS.map(function (f) { return { f: f, silencio: false }; });
    var n = 0;
    for (var k = 0; k < 2; k++) { var pos = TT.azar(3, 7 + n); pasos.splice(pos, 0, { f: pasos[pos - 1].f, silencio: true }); n++; }
    bEmpezar.style.display = 'none'; juego.style.display = '';
    mostrar();
    TT.anunciar('Empieza la prueba.');
  }
  function reproducir() {
    if (estado !== 'jugando') return;
    var p = pasos[i];
    bTono.disabled = true; bSi.disabled = true; bNo.disabled = true;
    mensaje.textContent = 'Escuchando…';
    if (!p.silencio) TT.tono(p.f, DUR, GANANCIA);
    window.clearTimeout(tempo);
    tempo = window.setTimeout(function () {
      sonado = true; bTono.disabled = false; bSi.disabled = false; bNo.disabled = false;
      mensaje.textContent = '¿Has oído un tono? También puedes volver a reproducirlo.';
      TT.anunciar('¿Lo has oído?');
    }, DUR * 1000 + 150);
  }
  function responder(si) {
    if (estado !== 'jugando' || !sonado) return;
    var p = pasos[i];
    if (p.silencio) { silencios++; if (si) falsos++; }
    else { reales++; if (si) { oidos++; oido = Math.max(oido, p.f); seguidos = 0; } else seguidos++; }
    i++;
    if (seguidos >= 2 || i >= pasos.length) { terminar(); return; }
    mostrar();
  }
  function terminar() {
    estado = 'fin'; juego.style.display = 'none'; mensaje.textContent = 'Terminado.';
    var kHz = oido / 1000, etiqueta = oido ? TT.fmt(kHz, 0) : '< 8', edad = TT.rango(oido, [
      [0, 'Por debajo de 8 kHz', 'No has oído ni el primer tono. Revisa el volumen y la salida de sonido antes de sacar conclusiones, porque el equipo también cuenta.'],
      [8000, 'Más de 60 años', 'Un techo de unos 8 kHz es el habitual en personas de más de 60 años, aunque varía mucho de una a otra.'],
      [10000, 'Unos 55–60 años', 'Rango orientativo para un techo de 10 kHz.'],
      [12000, 'Unos 50–55 años', 'Rango orientativo para un techo de 12 kHz.'],
      [14000, 'Unos 45–50 años', 'Rango orientativo para un techo de 14 kHz.'],
      [15000, 'Unos 35–45 años', 'Rango orientativo para un techo de 15 kHz.'],
      [16000, 'Unos 30–35 años', 'Rango orientativo para un techo de 16 kHz.'],
      [17000, 'Unos 25–30 años', 'Rango orientativo para un techo de 17 kHz.'],
      [18000, 'Unos 20–25 años', 'Rango orientativo para un techo de 18 kHz.'],
      [19000, 'Menos de 20 años', 'Rango orientativo para un techo de 19 kHz o más.']]);
    var detalles = [['Tonos oídos', oidos + ' de ' + reales], ['Silencios de control', silencios + (falsos ? ' (dijiste oír ' + falsos + ')' : ' (los has detectado bien)')]];
    var nota = falsos ? 'Has dicho oír un tono en un silencio de control: el resultado es poco fiable. Repite la prueba sin anticiparte.' : 'Es un pasatiempo: los altavoces del portátil y del móvil suelen dejar de sonar por encima de 16 kHz, así que tu equipo puede ser el límite. No es una prueba médica.';
    window.setTimeout(function () {
      if (estado !== 'fin') return;
      panel = TT.resultado(host, { titulo: 'Tu techo de audición', valor: etiqueta, unidad: 'kHz', rango: { nombre: 'Edad auditiva orientativa: ' + edad.nombre.toLowerCase(), texto: edad.texto },
        extra: TT.h('p', { class: 'tt-aviso', texto: nota }), detalles: detalles,
        copia: 'Mi techo de audición en esta prueba orientativa: ' + etiqueta + ' kHz.', alRepetir: reiniciar });
      TT.anunciar('Resultado: tu techo es de ' + etiqueta + ' kilohercios.');
      TT.enfocar(panel);
    }, 300);
  }
  function reiniciar() {
    window.clearTimeout(tempo); estado = 'espera';
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null;
    datos.poner('p', '—'); datos.poner('o', '0');
    juego.style.display = 'none'; bEmpezar.style.display = '';
    mensaje.textContent = 'Sonarán tonos cada vez más agudos, de 8 a 20 kHz, y algunos serán silencio. Después de cada uno, di si lo has oído. La prueba termina cuando dejas de oír dos seguidos.';
  }
  host.appendChild(aviso);
  host.appendChild(TT.h('div', { class: 'tt-fila' }, bVolumen));
  host.appendChild(datos.nodo);
  host.appendChild(zona);
  reiniciar();
})();
