/* =========================================================
   FP Cuenta · datos/ra.js
   Resultados de aprendizaje (RA) de cada módulo, para que la calculadora de notas pueda cargarlos.
   Ahora está vacío: la persona apunta sus RA a mano. Cuando añadas módulos aquí, aparecerá en la
   calculadora el botón «Cargar los RA de este módulo» al elegir el ciclo y escribir el módulo.

   Formato:
     window.FP_DATA.ra = {
       "<id del ciclo>": {                       // el id del ciclo en comunidades/<comunidad>/ciclos.json, p. ej. "desarrollo-de-aplicaciones-web-gs"
         "<nombre del módulo>": [                // tal y como aparece en ciclos.json
           ["RA1. Texto corto del resultado de aprendizaje", 20],   // [nombre, peso en %]
           ["RA2. …", 30]
         ]
       }
     };
   Los pesos los fija cada centro: si pones unos de referencia, avísalo en el nombre o en la fuente.
   ========================================================= */
window.FP_DATA = window.FP_DATA || {};
window.FP_DATA.ra = {};
