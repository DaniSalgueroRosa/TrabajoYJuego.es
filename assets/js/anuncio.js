/* ===== comun/anuncio/anuncio.js ===== */
/* Anuncio lateral (el de 300×600 que acompaña al bajar, a la derecha del texto). Solo existe en pantallas anchas: aquí se decide cuando
   la página ya está cargada. Si la pantalla es estrecha se quita el hueco entero y NO se pide anuncio (un anuncio oculto contaría como
   visto sin que nadie lo vea); si es ancha se pide. Los demás anuncios se piden desde su propia etiqueta en el HTML. No guarda nada. */
(function () {
  var hueco = document.querySelector('[data-lateral]');
  if (!hueco) return;
  var ancha = window.matchMedia && window.matchMedia('(min-width: 75rem)').matches;
  if (!ancha) { hueco.parentNode.removeChild(hueco); return; }
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* sin AdSense (bloqueador o sin conexión): el hueco queda vacío */ }
})();
