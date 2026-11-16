/* Buscador y filtros de un listado. Los controles vienen ocultos en el HTML y solo se muestran si este script funciona,
   así que sin JavaScript no hay botones muertos: se ve la lista entera. No guarda nada: al recargar, vuelve todo a «Todos». */
(function () {
  var form = document.querySelector('[data-filtros]');
  var lista = document.querySelector('ul.rejilla');
  if (!form || !lista) return;
  var items = Array.prototype.slice.call(document.querySelectorAll('ul.rejilla > li'));      // todas las listas: una sola, o una por grupo
  var grupos = Array.prototype.slice.call(document.querySelectorAll('[data-bloque]'));
  var campo = form.querySelector('[data-filtro-texto]');
  var dificultad = form.querySelector('[data-filtro-dificultad]');
  var estado = form.querySelector('[data-filtro-estado]');
  var borrar = form.querySelector('[data-filtro-borrar]');
  var chips = Array.prototype.slice.call(form.querySelectorAll('[data-filtro-categoria]'));
  var desplegable = form.querySelector('[data-filtro-categoria-lista]');   // alternativa compacta a los chips: un desplegable (<select>)
  var singular = form.getAttribute('data-singular') || 'elemento';
  var plural = form.getAttribute('data-plural') || 'elementos';
  var categoria = '';

  function norm(t) {   // minúsculas y sin acentos, conservando la ñ (igual que el generador)
    return t.toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ');
  }
  function aplicar() {
    var terminos = norm(campo ? campo.value : '').split(/\s+/).filter(Boolean);
    var dif = dificultad ? dificultad.value : '';
    var visibles = 0;
    items.forEach(function (li) {
      var texto = li.getAttribute('data-busqueda') || '';
      var ok = (!categoria || li.getAttribute('data-categoria') === categoria) &&
               (!dif || li.getAttribute('data-dificultad') === dif) &&
               terminos.every(function (t) { return texto.indexOf(t) !== -1; });
      li.hidden = !ok;
      if (ok) visibles++;
    });
    grupos.forEach(function (g) { g.hidden = !g.querySelector('ul.rejilla > li:not([hidden])'); });
    var filtrando = !!(categoria || dif || terminos.length);
    if (borrar) borrar.hidden = !filtrando;
    if (!estado) return;
    if (visibles === 0) estado.textContent = 'Ningún ' + singular + ' coincide. Prueba con otra palabra o quita algún filtro.';
    else if (!filtrando) estado.textContent = items.length + ' ' + (items.length === 1 ? singular : plural);
    else estado.textContent = visibles + ' de ' + items.length + ' ' + (items.length === 1 ? singular : plural);
  }
  function elegir(id) {
    categoria = id;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filtro-categoria') === id ? 'true' : 'false'); });
    if (desplegable) desplegable.value = id;
    aplicar();
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { elegir(c.getAttribute('data-filtro-categoria')); }); });
  if (desplegable) desplegable.addEventListener('change', function () { elegir(desplegable.value); });
  if (campo) campo.addEventListener('input', aplicar);
  if (dificultad) dificultad.addEventListener('change', aplicar);
  if (borrar) borrar.addEventListener('click', function () {
    if (campo) campo.value = '';
    if (dificultad) dificultad.value = '';
    elegir('');
    if (campo) campo.focus();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.hidden = false;
  aplicar();
  /* Enlace desde la portada: «?categoria=palabras» abre el listado ya filtrado. Solo se lee la dirección (no se guarda nada) y
     una categoría que no exista se ignora: se ve todo. */
  try {
    var pedida = new URLSearchParams(window.location.search).get('categoria');
    var existe = chips.some(function (c) { return c.getAttribute('data-filtro-categoria') === pedida; }) ||
      (desplegable && Array.prototype.some.call(desplegable.options, function (o) { return o.value === pedida; }));
    if (pedida && existe) elegir(pedida);
  } catch (e) { /* navegador sin URLSearchParams: se ve todo */ }
})();
