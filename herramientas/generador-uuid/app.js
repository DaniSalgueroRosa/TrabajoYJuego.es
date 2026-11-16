(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    var lote = [], claveLote = '', forzar = true;
    function aleatorios(n) {
      var c = window.crypto, b = new Uint8Array(n);
      if (!c || !c.getRandomValues) throw new Error('Tu navegador no permite generar números aleatorios seguros, así que no se pueden crear UUID fiables aquí.');
      c.getRandomValues(b); return b;
    }
    function v4() { var b = aleatorios(16); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128; return b; }
    function v7(n) {
      var res = [], ms = 0, cont = 0, i;
      for (i = 0; i < n; i++) {
        var r = aleatorios(10), ahora = Math.floor(TH.ahora()), b = new Uint8Array(16), alto, bajo, k;
        if (i === 0 || ahora > ms) { ms = ahora; cont = ((r[0] << 8) | r[1]) & 0x7ff; }                         // contador que arranca en la primera mitad para dejar sitio a los siguientes
        else { cont++; if (cont > 0xfff) { ms++; cont = ((r[0] << 8) | r[1]) & 0x7ff; } }
        alto = Math.floor(ms / 4294967296); bajo = ms % 4294967296;
        b[0] = (alto >>> 8) & 255; b[1] = alto & 255; b[2] = bajo >>> 24; b[3] = (bajo >>> 16) & 255; b[4] = (bajo >>> 8) & 255; b[5] = bajo & 255;
        b[6] = 0x70 | (cont >> 8); b[7] = cont & 255; b[8] = 0x80 | (r[2] & 63);
        for (k = 9; k < 16; k++) b[k] = r[k - 6];
        res.push(b);
      }
      return res;
    }
    function texto(b, op) {
      var h = '', i;
      for (i = 0; i < 16; i++) h += (b[i] < 16 ? '0' : '') + b[i].toString(16);
      if (op.formato !== 'sin') h = h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      if (op.formato === 'llaves') h = '{' + h + '}';
      return op.mayusculas ? h.toUpperCase() : h;
    }
    TH.texto(raiz, {
      sinEntrada: true,
      salida: { etiqueta: 'UUID generados' },
      filas: 10,
      descargar: { nombre: 'uuid.txt', mime: 'text/plain;charset=utf-8' },
      botones: [{ texto: 'Generar otros', accion: function (api) { forzar = true; api.actualizar(); } }],
      opciones: [
        { id: 'version', tipo: 'select', etiqueta: 'Versión', valor: '4', opciones: [['4', 'Versión 4 (aleatorio, la más usada)'], ['7', 'Versión 7 (ordenable por fecha y hora)']] },
        { id: 'cantidad', etiqueta: 'Cuántos', valor: 5, entero: true, ayuda: 'De 1 a 1000.' },
        { id: 'formato', tipo: 'select', etiqueta: 'Formato', valor: 'std', opciones: [['std', 'Con guiones (el estándar)'], ['sin', 'Sin guiones'], ['llaves', 'Entre llaves, como en .NET']] },
        { id: 'mayusculas', tipo: 'check', etiqueta: 'En mayúsculas', valor: false }
      ],
      procesar: function (t, op) {
        var n = op.cantidad;
        if (!(n >= 1 && n <= 1000) || n !== Math.floor(n)) return { salida: '', avisos: ['Indica cuántos UUID quieres con un número entero de 1 a 1000.'] };
        var clave = op.version + '|' + n;
        if (forzar || clave !== claveLote) {
          lote = op.version === '7' ? v7(n) : (function () { var l = [], i; for (i = 0; i < n; i++) l.push(v4()); return l; })();
          claveLote = clave; forzar = false;
        }
        var filas = [TH.fila('cantidad', 'UUID generados', n, 'n0'), TH.fila('version', 'Versión', op.version === '7' ? 'Versión 7 (con fecha y hora)' : 'Versión 4 (aleatoria)', 'txt')];
        if (op.version === '7') {
          var b = lote[0], ms = b[0] * 1099511627776 + b[1] * 4294967296 + b[2] * 16777216 + b[3] * 65536 + b[4] * 256 + b[5];
          filas.push(TH.fila('marca', 'Fecha y hora del primero (UTC)', new Date(ms).toISOString(), 'txt'));
        }
        return { salida: lote.map(function (b) { return texto(b, op); }).join('\n'), filas: filas };
      }
    });
  });
})();
