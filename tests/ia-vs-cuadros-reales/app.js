/* IA o cuadro real: se enseña una imagen y hay que decidir si es una pintura real o una imagen hecha con IA. Las imágenes y sus datos están en
   banco.json (mismo sitio) junto a la carpeta imagenes/. No se llama a ningún otro servidor y no se guarda nada. */
(function () {
  'use strict';
  var host = TT.app();
  if (!host) return;
  var RONDAS = 10, banco = [], ronda = [], k = 0, aciertos = { real: 0, ia: 0 }, vistas = { real: 0, ia: 0 }, t0 = 0, tr = [], panel = null, respondida = false, actual = null;
  var datos = TT.datos([['r', 'Imagen', '—'], ['a', 'Aciertos', '0'], ['s', 'Racha', '0']]);
  var mensaje = TT.h('p', { 'class': 'ia-mensaje', role: 'status' });
  var imagen = TT.h('img', { 'class': 'ia-imagen', alt: 'Imagen que hay que clasificar', decoding: 'async' });
  var marco = TT.h('figure', { 'class': 'ia-marco' }, imagen);
  var bReal = TT.boton('Cuadro real', function () { responder('real'); });
  var bIa = TT.boton('Hecho con IA', function () { responder('ia'); });
  var bSig = TT.boton('Siguiente', function () { siguiente(); });
  var ficha = TT.h('div', { 'class': 'ia-ficha', 'aria-live': 'polite' });
  var botones = TT.h('div', { 'class': 'tt-fila tt-fila--centro' }, bReal, bIa);
  var zona = TT.h('div', { 'class': 'tt-zona ia-zona' }, mensaje, marco, botones, bSig, ficha);
  var racha = 0;

  function cargar() {
    return fetch('banco.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(function (d) {
      var lista = (d && d.imagenes || []).filter(function (x) { return x && x.archivo && (x.tipo === 'real' || x.tipo === 'ia'); });
      if (lista.length < 6) throw new Error('faltan imágenes');
      return lista;
    });
  }
  function elegirRonda(lista) {
    var reales = TT.barajar(lista.filter(function (x) { return x.tipo === 'real'; })), ias = TT.barajar(lista.filter(function (x) { return x.tipo === 'ia'; }));
    var n = Math.min(RONDAS, lista.length), ni = Math.min(Math.floor(n / 2), ias.length), nr = Math.min(reales.length, n - ni);
    ni = Math.min(ias.length, n - nr);
    return TT.barajar(reales.slice(0, nr).concat(ias.slice(0, ni)));
  }
  function empezar() {
    ronda = elegirRonda(banco); k = 0; aciertos = { real: 0, ia: 0 }; vistas = { real: 0, ia: 0 }; tr = []; racha = 0;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panel = null; zona.hidden = false; datos.poner('a', '0'); datos.poner('s', '0');
    mostrar();
  }
  function mostrar() {
    actual = ronda[k]; respondida = false;
    imagen.removeAttribute('src'); imagen.src = actual.archivo;
    ficha.textContent = ''; ficha.hidden = true; bSig.hidden = true; botones.hidden = false;
    datos.poner('r', (k + 1) + '/' + ronda.length);
    mensaje.textContent = 'Imagen ' + (k + 1) + ' de ' + ronda.length + ': ¿es un cuadro real o la ha hecho una IA?';
    t0 = performance.now();
  }
  function responder(dice) {
    if (respondida) return;
    respondida = true;
    var bien = dice === actual.tipo;
    vistas[actual.tipo]++; if (bien) { aciertos[actual.tipo]++; racha++; } else racha = 0;
    tr.push((performance.now() - t0) / 1000);
    datos.poner('a', String(aciertos.real + aciertos.ia)); datos.poner('s', String(racha));
    botones.hidden = true;
    mensaje.textContent = bien ? '¡Correcto!' : 'Esta vez no. Era ' + (actual.tipo === 'real' ? 'un cuadro real.' : 'una imagen hecha con IA.');
    var filas = [actual.titulo, [actual.autor, actual.anio].filter(Boolean).join(', '), actual.fuente ? 'Fuente: ' + actual.fuente : '', actual.licencia ? 'Licencia: ' + actual.licencia : ''].filter(Boolean);
    ficha.textContent = '';
    filas.forEach(function (f, i) { ficha.appendChild(TT.h(i === 0 ? 'strong' : 'span', { texto: f })); });
    if (actual.pista) ficha.appendChild(TT.h('span', { 'class': 'ia-pista', texto: 'Pista: ' + actual.pista }));
    ficha.hidden = !ficha.childNodes.length;
    bSig.textContent = k >= ronda.length - 1 ? 'Ver resultado' : 'Siguiente'; bSig.hidden = false; bSig.focus({ preventScroll: true });
  }
  function siguiente() { if (k >= ronda.length - 1) { terminar(); return; } k++; mostrar(); }
  function terminar() {
    zona.hidden = true;
    var total = aciertos.real + aciertos.ia, n = ronda.length, pct = total / n * 100;
    var rango = TT.rango(pct, [
      [0, 'Ojo por entrenar', 'Las imágenes de IA cada vez se parecen más a las pinturas. Mira los detalles: manos, texto, simetrías raras y bordes.'],
      [40, 'Ojo curioso', 'Aciertas más o menos como al azar. Prueba a fijarte en las pinceladas y en los detalles pequeños.'],
      [60, 'Buen ojo', 'Distingues bastante bien. Tu intuición funciona.'],
      [80, 'Ojo de experto', 'Casi no se te escapa ninguna.'],
      [100, 'Ojo de museo', 'Las has acertado todas.']]);
    var pr = vistas.real ? aciertos.real / vistas.real * 100 : 0, pi = vistas.ia ? aciertos.ia / vistas.ia * 100 : 0;
    var extra = TT.h('div', { 'class': 'tt-res-extra' }, TT.h('div', {}, TT.h('h3', { texto: 'Aciertos por tipo de imagen' }), TT.graf.barras([
      { nombre: 'Cuadros reales', valor: pr, nota: aciertos.real + ' de ' + vistas.real }, { nombre: 'Hechas con IA', valor: pi, nota: aciertos.ia + ' de ' + vistas.ia }], { descripcion: 'Porcentaje de aciertos con cuadros reales y con imágenes de IA' })),
      TT.h('div', {}, TT.h('h3', { texto: 'Tu puntuación' }), TT.graf.medidor(pct, { izq: '0 %', der: '100 %', texto: TT.fmt(pct, 0) + ' %', descripcion: 'Porcentaje de aciertos' })));
    panel = TT.resultado(host, { titulo: 'Tu ojo para distinguir', valor: total + ' de ' + n, unidad: 'aciertos', rango: rango, extra: extra,
      detalles: [['Cuadros reales acertados', aciertos.real + ' de ' + vistas.real], ['Imágenes de IA acertadas', aciertos.ia + ' de ' + vistas.ia], ['Tiempo medio por imagen', TT.fmt(TT.media(tr), 1) + ' s']],
      copia: 'He acertado ' + total + ' de ' + n + ' distinguiendo cuadros reales de imágenes de IA.', alRepetir: empezar });
    TT.anunciar('Resultado: ' + total + ' aciertos de ' + n + '.');
    TT.enfocar(panel);
  }
  host.appendChild(datos.nodo);
  host.appendChild(zona);
  mensaje.textContent = 'Cargando las imágenes…';
  botones.hidden = true; bSig.hidden = true; ficha.hidden = true;
  cargar().then(function (l) { banco = l; empezar(); }, function () {
    mensaje.textContent = 'No se han podido cargar las imágenes de este test. Abre la página desde el sitio web (no desde un archivo suelto) o vuelve a intentarlo más tarde.';
  });
})();
