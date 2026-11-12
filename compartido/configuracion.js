/* =========================================================
   FP Cuenta · compartido/configuracion.js
   AQUÍ cambias tus datos. Es el único archivo de ajustes de la web.
   Después de cambiar el ID de AdSense o el modo de consentimiento, ejecuta de nuevo  python3 gen/construir.py
   (escribe la metaetiqueta de AdSense, el archivo ads.txt y los textos legales).
   ========================================================= */
window.FP_CONFIG = {
  // ID de editor de AdSense, p. ej. 'ca-pub-1234567890123456'. Lo ves en AdSense → Cuenta → Información de la cuenta.
  // Déjalo vacío hasta que te registres en AdSense: sin ID no se carga ningún anuncio ni nada de Google.
  adsenseClient: '',

  // Quién pide el permiso para los anuncios:
  //   'propio' → el aviso de cookies de esta web. El script de Google solo se carga si se pulsa «Aceptar».
  //   'google' → el mensaje de consentimiento de Google (AdSense → Privacidad y mensajes → Normativa europea).
  //              Para mostrar anuncios personalizados a quien visita desde la UE o el Reino Unido, Google exige una
  //              plataforma de consentimiento certificada, y la suya lo es. Con esta opción esta web no muestra su
  //              aviso de anuncios y el botón «Configurar cookies» del pie abre el mensaje de Google.
  consentimiento: 'propio',

  // Bloques de anuncios. Se crean en AdSense → Anuncios → Por bloque de anuncios (código «Anuncio display»), con
  // formato adaptable. Copia aquí el número de «data-ad-slot» de cada uno (p. ej. '1234567890').
  // Un hueco sin número no muestra nada. Si prefieres anuncios automáticos, activa en AdSense «Anuncios automáticos»
  // y deja los huecos vacíos.
  adsenseSlots: {
    portada: '',      // portada, antes de las preguntas
    faltas: '',       // calculadora de faltas, debajo de la calculadora y su explicación
    notas: '',        // calculadora de notas, igual
    normativa: ''     // normativa por comunidad, antes del último apartado
  },

  // URL que recibe las sugerencias (p. ej. Formspree: 'https://formspree.io/f/xxxxxxx').
  // Si está vacío, el formulario abre el programa de correo de la persona.
  suggestionsEndpoint: '',

  // Correo al que llegan las sugerencias cuando no hay endpoint.
  contactEmail: 'contacto@tudominio.es',

  // No hace falta tocar lo siguiente
  consentKey: 'fpcuenta-consent-v1',
  themeKey: 'fpcuenta-tema-v1',
  minSecondsBetweenMessages: 30
};
