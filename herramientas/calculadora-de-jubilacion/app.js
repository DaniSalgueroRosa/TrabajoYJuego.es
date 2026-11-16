(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.script('lib/negocio.js').then(function () {
      var N = TH.negocio, z = N.n0;
      TH.calculadora(raiz, {
        campos: [
          { id: 'edad', etiqueta: 'Tu edad actual', unidad: 'años', ph: '35', entero: true },
          { id: 'edadJub', etiqueta: 'Edad a la que quieres jubilarte', unidad: 'años', valor: '67', entero: true },
          { id: 'edadFin', etiqueta: 'Edad hasta la que debe durar el dinero', unidad: 'años', valor: '90', entero: true },
          { id: 'gasto', etiqueta: 'Gasto mensual que quieres mantener', unidad: '€ de hoy', ph: '1800' },
          { id: 'pension', etiqueta: 'Pensión pública estimada', unidad: '€ al mes de hoy', ph: '1100', ayuda: 'Pon 0 si no cuentas con ella.' },
          { id: 'inflacion', etiqueta: 'Inflación media esperada', unidad: '% anual', valor: '2' },
          { id: 'rentAntes', etiqueta: 'Rentabilidad mientras ahorras', unidad: '% anual', valor: '4' },
          { id: 'rentDespues', etiqueta: 'Rentabilidad una vez jubilado', unidad: '% anual', valor: '3' },
          { id: 'ahorro', etiqueta: 'Ahorro ya acumulado para la jubilación', unidad: '€', ph: '20000' },
          { id: 'aporte', etiqueta: 'Aportación mensual actual (opcional)', unidad: '€ al mes de hoy', ph: '300' }
        ],
        ejemplo: { edad: '35', edadJub: '67', edadFin: '90', gasto: '1800', pension: '1100', inflacion: '2', rentAntes: '4', rentDespues: '3', ahorro: '20000', aporte: '300' },
        calcular: function (v) {
          if (!TH.listos(v, ['edad', 'edadJub', 'edadFin', 'gasto', 'inflacion', 'rentAntes', 'rentDespues'])) return { vacio: true };
          var pen = z(v.pension), aho = z(v.ahorro), ap = isFinite(v.aporte) ? v.aporte : null;
          if (v.edad < 0 || v.edad >= v.edadJub) return { error: 'La edad de jubilación debe ser mayor que tu edad actual.' };
          if (v.edadFin <= v.edadJub || v.edadFin > 120) return { error: 'La edad final debe ser mayor que la de jubilación y no superar los 120 años.' };
          if (v.edad !== Math.floor(v.edad) || v.edadJub !== Math.floor(v.edadJub) || v.edadFin !== Math.floor(v.edadFin)) return { error: 'Escribe las edades en años enteros.' };
          if (v.gasto <= 0 || pen < 0 || aho < 0 || (ap !== null && ap < 0)) return { error: 'El gasto debe ser mayor que 0 y los demás importes no pueden ser negativos.' };
          if (v.inflacion < -5 || v.inflacion > 30 || v.rentAntes < -10 || v.rentAntes > 30 || v.rentDespues < -10 || v.rentDespues > 30) return { error: 'La inflación debe estar entre −5 y 30 % y las rentabilidades entre −10 y 30 %.' };
          var r = N.jubilacion({ edad: v.edad, edadJub: v.edadJub, edadFin: v.edadFin, gasto: v.gasto, pension: pen, inflacion: v.inflacion, rentAntes: v.rentAntes, rentDespues: v.rentDespues, ahorro: aho, aporte: ap });
          var filas = [TH.fila('necesario', 'Capital necesario al jubilarte (euros de hoy)', r.necesario, 'eur'), TH.fila('necesario-nominal', 'Esa cifra en euros del momento de jubilarte', r.necesarioNominal, 'eur'),
            TH.fila('retirada', 'Retirada mensual que debe cubrir tu capital', r.retirada, 'eur'), TH.fila('del-ahorro', 'Lo que aportará tu ahorro actual (euros de hoy)', r.delAhorro, 'eur'), TH.fila('aporte-necesario', 'Aportación mensual necesaria (euros de hoy)', r.aporteNecesario, 'eur')];
          if (ap !== null) filas.push(TH.fila('capital', 'Capital que reunirías con tu aportación', r.capital, 'eur'), TH.fila('cobertura', 'Parte de la meta que cubrirías', r.cobertura, 'pct'), TH.fila('renta-posible', 'Gasto mensual que podrías sostener', r.rentaPosible, 'eur'));
          filas.push(TH.fila('anos-ahorrando', 'Años de ahorro', r.anosAhorrando, 'n0'), TH.fila('anos-cobrando', 'Años de jubilación cubiertos', r.anosCobrando, 'n0'),
            TH.fila('real-antes', 'Rentabilidad real mientras ahorras', r.realAntes, 'pct'), TH.fila('real-despues', 'Rentabilidad real jubilado', r.realDespues, 'pct'));
          var avisos = [];
          if (r.retirada === 0) avisos.push('Tu pensión estimada ya cubre el gasto que quieres mantener, así que no necesitas capital adicional.');
          else if (ap !== null && r.cobertura < 100) avisos.push('Con esa aportación cubrirías el ' + TH.fmt(r.cobertura, [0, 1]) + ' % de la meta. Aumentar la aportación, retrasar la jubilación o reducir el gasto acorta la diferencia.');
          return { filas: filas, avisos: avisos, notas: ['Modelo con rentabilidad e inflación constantes, aportaciones y retiradas al final de cada mes y expresado en euros de hoy: las aportaciones deberían subir cada año con la inflación.'] };
        }
      });
    }, function () {
      var p = document.createElement('p'); p.className = 'herr-estado herr-estado--error'; p.setAttribute('role', 'alert');
      p.textContent = 'No se ha podido cargar la herramienta. Recarga la página.'; TH.vaciar(raiz).appendChild(p);
    });
  });
})();
