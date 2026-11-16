(function () {
  'use strict';
  TH.alCargar(function (raiz) {
      var h = TH.h, COMUNES = new Set('123456 1234567 12345678 123456789 1234567890 12345 1234 111111 000000 123123 654321 666666 121212 112233 123321 987654321 555555 7777777 222222 999999 123qwe 1q2w3e 1q2w3e4r 1q2w3e4r5t qwerty qwerty123 qwertyuiop qwe123 asdfgh asdfghjkl zxcvbnm qazwsx 1qaz2wsx abc123 abcd1234 abcdef a1b2c3 password password1 password123 passw0rd p4ssword contrasena contrasena1 contrasena123 contraseña admin admin123 administrador root toor user guest welcome welcome1 login master letmein iloveyou monkey dragon sunshine princess football baseball soccer hockey batman superman shadow michael jordan harley hunter ranger buster thomas robert jennifer jessica ashley nicole daniel andrew joshua matthew charlie banana cookie summer winter secret trustno1 whatever freedom starwars pokemon minecraft changeme default test test123 testing demo hello hello123 hola hola123 holamundo hola1234 teamo teamo123 tequiero tequieromucho amor amor123 amorcito mariposa estrella corazon princesa carino cariño bonita chocolate familia mama papa dios jesus barcelona realmadrid madrid atletico sevilla valencia betis futbol messi cristiano ronaldo naruto goku pikachu spiderman sol luna cielo azul rojo casa perro gato negro amigo amigos verano invierno primavera otono enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre lunes martes miercoles jueves viernes sabado domingo españa espana mexico argentina colombia chile peru venezuela'.split(' '));
      var FILAS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];
      var LEET = { '@': 'a', '4': 'a', '0': 'o', '1': 'i', '3': 'e', '$': 's', '5': 's', '7': 't', '!': 'i', '€': 'e' };
      function lg(x) { return Math.log(x) / Math.LN2; }
      function paso(a, b) {
        a = a.toLowerCase(); b = b.toLowerCase();
        var d = b.charCodeAt(0) - a.charCodeAt(0);
        if (a.length === 1 && b.length === 1 && /^[a-z0-9]$/.test(a) && /^[a-z0-9]$/.test(b) && (d === 1 || d === -1)) return d;
        for (var i = 0; i < FILAS.length; i++) {
          var x = FILAS[i].indexOf(a), y = FILAS[i].indexOf(b);
          if (x >= 0 && y >= 0 && Math.abs(x - y) === 1) return y - x;
        }
        return 0;
      }
      function nivel(b) { return b < 28 ? 'Muy débil' : b < 40 ? 'Débil' : b < 60 ? 'Aceptable' : b < 80 ? 'Fuerte' : 'Muy fuerte'; }
      function analizar(p) {
        var c = Array.from(p), n = c.length, pool = 0, tipos = [], patrones = [], i, j;
        var t = { min: /[a-z]/.test(p), may: /[A-Z]/.test(p), num: /[0-9]/.test(p), sim: /[ -\/:-@\[-`{-~]/.test(p), emin: /[ñáéíóúü]/.test(p), emay: /[ÑÁÉÍÓÚÜ]/.test(p) };
        t.otros = c.some(function (x) { return x.codePointAt(0) > 126 && !/[ñáéíóúüÑÁÉÍÓÚÜ]/.test(x); });
        if (t.min) { pool += 26; tipos.push('minúsculas'); }
        if (t.may) { pool += 26; tipos.push('mayúsculas'); }
        if (t.num) { pool += 10; tipos.push('números'); }
        if (t.sim) { pool += 33; tipos.push('símbolos'); }
        if (t.emin || t.emay) { pool += (t.emin ? 7 : 0) + (t.emay ? 7 : 0); tipos.push('letras con tilde o ñ'); }
        if (t.otros) { pool += 100; tipos.push('otros caracteres'); }
        var bc = lg(pool), bits = 0;
        i = 0;
        while (i < n) {
          j = i; while (j + 1 < n && c[j + 1] === c[i]) j++;
          if (j - i + 1 >= 3) { bits += bc + lg(j - i + 1); patrones.push('repetición'); i = j + 1; continue; }
          var d = i + 1 < n ? paso(c[i], c[i + 1]) : 0;
          if (d !== 0) {
            j = i + 1; while (j + 1 < n && paso(c[j], c[j + 1]) === d) j++;
            if (j - i + 1 >= 3) { bits += bc + lg(j - i + 1) + 1; patrones.push('secuencia'); i = j + 1; continue; }
          }
          if (n > 4 && i === n - 4 && /^(19|20)[0-9]{2}$/.test(c.slice(i).join(''))) { bits += 7; patrones.push('año al final'); i = n; continue; }
          bits += bc; i++;
        }
        var bajo = p.toLowerCase(), comun = null;
        function leetear(s) { return s.split('').map(function (x) { return LEET[x] || x; }).join(''); }
        function quitaCola(s) { return s.replace(/[^a-zñ]+$/, ''); }
        var cand = [leetear(bajo), quitaCola(bajo), leetear(quitaCola(bajo)), quitaCola(leetear(bajo))];
        if (COMUNES.has(bajo)) comun = 'exacta';
        else if (cand.some(function (x) { return x.length >= 4 && COMUNES.has(x); })) comun = 'variante';
        if (comun === 'exacta') bits = Math.min(bits, 12); else if (comun === 'variante') bits = Math.min(bits, 20);
        return { n: n, tipos: tipos, pool: pool, bits: bits, patrones: patrones.filter(function (x, k, a) { return a.indexOf(x) === k; }), comun: comun };
      }
      function duracion(s) {
        if (s < 1) return 'menos de un segundo';
        if (s < 60) return TH.pl(Math.round(s), 'segundo', 'segundos');
        if (s < 3600) return TH.pl(Math.round(s / 60), 'minuto', 'minutos');
        if (s < 86400) return TH.pl(Math.round(s / 3600), 'hora', 'horas');
        if (s < 31557600) return TH.pl(Math.round(s / 86400), 'día', 'días');
        var a = s / 31557600;
        if (a < 1000) return TH.pl(Math.round(a), 'año', 'años');
        if (a < 1e6) return TH.fmt(Math.round(a / 1000), 0) + ' mil años';
        if (a < 1e9) return TH.fmt(Math.round(a / 1e6), 0) + ' millones de años';
        return 'más de mil millones de años';
      }
      var campo = h('input', { id: 'c-clave', type: 'password', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', placeholder: 'Escribe una contraseña' });
      var ver = h('input', { id: 'c-ver', type: 'checkbox' });
      var salida = h('div', { class: 'herr-salida', 'aria-live': 'polite' });
      raiz.appendChild(h('div', { class: 'herr-form' },
        h('div', { class: 'campo' }, h('label', { for: 'c-clave', texto: 'Contraseña' }), campo),
        h('div', { class: 'campo campo--check' }, h('span', { class: 'campo-check' }, ver, h('label', { for: 'c-ver', texto: 'Mostrar la contraseña' })))));
      raiz.appendChild(h('p', { class: 'herr-estado herr-estado--aviso', texto: 'Por prudencia, no escribas aquí una contraseña que uses de verdad: prueba con otra parecida. Lo que escribes no sale de tu navegador.' }));
      raiz.appendChild(salida);
      ver.addEventListener('change', function () { campo.type = ver.checked ? 'text' : 'password'; });
      function pintar() {
        TH.vaciar(salida);
        var p = campo.value;
        if (!p) { salida.appendChild(h('p', { class: 'herr-vacio', texto: 'Escribe una contraseña y verás aquí su fortaleza estimada.' })); return; }
        var r = analizar(p), niv = nivel(r.bits), seg = Math.pow(2, r.bits - 1);
        var dl = h('dl', { class: 'herr-res' });
        [TH.fila('nivel', 'Fortaleza', niv, 'txt'), TH.fila('entropia', 'Entropía estimada', r.bits, function (x) { return TH.fmt(x, 1) + ' bits'; }),
         TH.fila('longitud', 'Longitud', r.n, function (x) { return TH.pl(x, 'carácter', 'caracteres'); }), TH.fila('tipos', 'Tipos de carácter', r.tipos.join(', '), 'txt'),
         TH.fila('patrones', 'Patrones detectados', r.patrones.length ? r.patrones.join(', ') : 'Ninguno', 'txt'),
         TH.fila('comun', 'Contraseñas comunes', r.comun === 'exacta' ? 'Está entre las más usadas' : r.comun === 'variante' ? 'Es una variante de una contraseña muy usada' : 'No aparece en la lista de comunes', 'txt'),
         TH.fila('tiempo-web', 'Tiempo medio en un servicio web (10 intentos por segundo)', duracion(seg / 10), 'txt'),
         TH.fila('tiempo-offline', 'Tiempo medio con una base de datos robada (10.000 millones por segundo)', duracion(seg / 1e10), 'txt')
        ].forEach(function (f) { dl.appendChild(h('div', { class: 'herr-fila' }, h('dt', { texto: f.t }), h('dd', { 'data-k': f.k, 'data-v': String(f.v), texto: f.f }))); });
        salida.appendChild(dl);
        var consejos = [];
        if (r.comun) consejos.push('Es una contraseña muy conocida o una variante de una: cámbiala por otra sin relación con palabras comunes.');
        if (r.patrones.length) consejos.push('Evita repeticiones, secuencias del teclado (qwerty, 1234) y años al final: los programas de adivinación lo prueban antes que nada.');
        if (r.n < 12) consejos.push('Alárgala: a partir de 12 caracteres, y mejor 16, el ataque por fuerza bruta se vuelve mucho más costoso.');
        if (r.tipos.length < 3 && r.n < 20) consejos.push('Mezcla minúsculas, mayúsculas, números y símbolos, o usa una frase larga de varias palabras sin relación.');
        if (!consejos.length) consejos.push('Es una buena contraseña. Úsala solo en un servicio y guárdala en un gestor de contraseñas.');
        salida.appendChild(h('ul', { class: 'herr-notas', 'data-k': 'consejos' }, consejos.map(function (x) { return h('li', { texto: x }); })));
        TH.anunciar('Fortaleza: ' + niv);
      }
      campo.addEventListener('input', pintar);
      pintar();
  });
})();
