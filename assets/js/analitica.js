/* ===== comun/analitica/analitica.js ===== */
/* Arranque de Google Tag Manager (solo se carga con la analítica activa; ver config/analitica.json).
   Es el código «en línea» que da Google (dataLayer, gtag y el aviso de inicio), pero en un archivo del propio sitio para que la política de contenido
   no tenga que admitir scripts en línea por su culpa. Va justo antes de gtm.js, que se carga después y de forma asíncrona.
   Consentimiento: en el Espacio Económico Europeo, Reino Unido y Suiza, Tag Manager arranca con el almacenamiento de analítica y de publicidad DENEGADO
   y espera hasta medio segundo a que el mensaje de consentimiento de Google (el de AdSense) responda; si el visitante acepta, ese mensaje lo actualiza.
   En el resto del mundo no hay estado inicial: rige el valor por defecto de Google. Este archivo NO guarda nada ni usa cookies ni almacenamiento propio. */
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
             'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH'],
    wait_for_update: 500
  });
  gtag('js', new Date());
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
})();
