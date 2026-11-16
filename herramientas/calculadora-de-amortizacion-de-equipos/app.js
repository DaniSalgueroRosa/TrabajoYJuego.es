(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      var BIENES = [['manual', 'Otro bien: escribo yo la vida útil', 0], ['info', 'Equipos para procesos de información (25 %, hasta 8 años)', 25], ['soft', 'Sistemas y programas informáticos (33 %, hasta 6 años)', 33],
        ['elec', 'Equipos electrónicos (20 %, hasta 10 años)', 20], ['mob', 'Mobiliario (10 %, hasta 20 años)', 10], ['maq', 'Maquinaria (12 %, hasta 18 años)', 12], ['util', 'Útiles y herramientas (25 %, hasta 8 años)', 25],
        ['transp', 'Elementos de transporte externo (16 %, hasta 14 años)', 16], ['camion', 'Autocamiones (20 %, hasta 10 años)', 20], ['inst', 'Instalaciones, resto (10 %, hasta 20 años)', 10], ['medico', 'Equipos médicos y asimilados (15 %, hasta 14 años)', 15]];
      var COEF = {}; BIENES.forEach(function (b) { COEF[b[0]] = b[2]; });
      function vidaManual(v) { return v.metodo !== 'lineal' || v.bien === 'manual'; }
      TH.calculadora(raiz, {
        campos: [
          { id: 'valor', etiqueta: 'Valor de adquisición', unidad: '€', ph: '3000', ayuda: 'Sin IVA, porque el IVA soportado se recupera.' },
          { id: 'residual', etiqueta: 'Valor residual al final (opcional)', unidad: '€', ph: '0' },
          { id: 'metodo', tipo: 'select', etiqueta: 'Método', valor: 'lineal', opciones: [['lineal', 'Lineal'], ['digitos', 'Números dígitos decrecientes'], ['constante', 'Porcentaje constante']] },
          { id: 'bien', tipo: 'select', etiqueta: 'Tipo de bien (coeficiente máximo de la tabla)', valor: 'info', ancho: 'completo', opciones: BIENES.map(function (b) { return [b[0], b[1]]; }), mostrarSi: function (v) { return v.metodo === 'lineal'; } },
          { id: 'vida', etiqueta: 'Vida útil', unidad: 'años', ph: '5', entero: true, mostrarSi: vidaManual },
          { id: 'pct', etiqueta: 'Porcentaje anual sobre el valor pendiente', unidad: '%', ph: '30', mostrarSi: function (v) { return v.metodo === 'constante'; } }
        ],
        ejemplo: { valor: '3000', residual: '0', metodo: 'lineal', bien: 'info' },
        calcular: function (v) {
          var res = z(v.residual), usaVida = vidaManual(v), need = ['valor'];
          if (usaVida) need.push('vida'); if (v.metodo === 'constante') need.push('pct');
          if (!TH.listos(v, need)) return { vacio: true };
          if (v.valor <= 0) return { error: 'El valor de adquisición debe ser mayor que 0.' };
          if (res < 0 || res >= v.valor) return { error: 'El valor residual debe ser menor que el valor de adquisición y no puede ser negativo.' };
          if (usaVida && (v.vida < 1 || v.vida > 100 || v.vida !== Math.floor(v.vida))) return { error: 'La vida útil debe ser un número entero de años entre 1 y 100.' };
          if (v.metodo === 'constante' && (v.pct <= 0 || v.pct > 100)) return { error: 'El porcentaje debe ser mayor que 0 y no superar el 100 %.' };
          var o = { valor: v.valor, residual: res, metodo: v.metodo, vida: v.vida, pct: v.pct };
          if (v.metodo === 'lineal' && v.bien !== 'manual') o.coef = COEF[v.bien];
          var f = N.amortizar(o), ultimo = f[f.length - 1];
          var filas = [TH.fila('cuota-anual', 'Amortización del primer año', f[0].cuota, 'eur'), TH.fila('anos', 'Años de amortización', f.length, 'n0'), TH.fila('total', 'Total amortizado', ultimo.acumulada, 'eur'), TH.fila('neto-final', 'Valor neto contable al final', ultimo.neto, 'eur')];
          if (v.metodo === 'lineal') filas.push(TH.fila('coeficiente', 'Coeficiente lineal aplicado', o.coef || 100 / v.vida, 'pct'));
          return { filas: filas, tabla: { titulo: 'Cuadro de amortización', cab: ['Año', 'Amortización del año', 'Amortización acumulada', 'Valor neto contable'], cabFila: true,
            filas: f.map(function (x) { return ['Año ' + x.anio, TH.eur(x.cuota), TH.eur(x.acumulada), TH.eur(x.neto)]; }) },
            notas: ['Años completos, sin prorrateo por el mes de compra. La base amortizable es el valor de adquisición menos el residual. Los coeficientes de la lista son los máximos de la tabla del Impuesto sobre Sociedades.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
