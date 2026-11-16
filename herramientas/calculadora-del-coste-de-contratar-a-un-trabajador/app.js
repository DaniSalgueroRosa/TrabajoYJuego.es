(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      var BASE_MAX = 5101.20;
      TH.calculadora(raiz, {
        campos: [
          { id: 'bruto', etiqueta: 'Salario bruto anual', unidad: '€', ph: '24000' },
          { id: 'contrato', tipo: 'select', etiqueta: 'Tipo de contrato', valor: 'indefinido', opciones: [['indefinido', 'Indefinido'], ['temporal', 'Temporal']] },
          { id: 'atep', etiqueta: 'Accidentes de trabajo y enfermedades profesionales', unidad: '%', valor: '1,5', ayuda: 'Según la actividad de tu empresa.' },
          { id: 'prl', etiqueta: 'Prevención, formación y otros costes anuales', unidad: '€ al año', ph: '600' },
          { id: 'herramientas', etiqueta: 'Software, licencias y herramientas', unidad: '€ al año', ph: '600' },
          { id: 'unico', etiqueta: 'Coste único de selección y equipo', unidad: '€', ph: '1500' },
          { id: 'anos', etiqueta: 'Años que esperas que permanezca', unidad: 'años', valor: '3' },
          { id: 'horas', etiqueta: 'Horas anuales de trabajo', unidad: 'h', valor: '1800' }
        ],
        ejemplo: { bruto: '24000', contrato: 'indefinido', atep: '1,5', prl: '600', herramientas: '600', unico: '1500', anos: '3', horas: '1800' },
        calcular: function (v) {
          if (!TH.listos(v, ['bruto'])) return { vacio: true };
          var at = z(v.atep), pr = z(v.prl), he = z(v.herramientas), un = z(v.unico), an = z(v.anos), ho = z(v.horas);
          if (v.bruto <= 0) return { error: 'El salario bruto debe ser mayor que 0.' };
          if (at < 0 || at > 20 || pr < 0 || he < 0 || un < 0) return { error: 'Los costes no pueden ser negativos y el porcentaje de accidentes debe estar entre 0 y 20 %.' };
          if (un > 0 && an < 0.5) return { error: 'Para repartir el coste único, indica al menos medio año de permanencia.' };
          var temp = v.contrato === 'temporal', mensual = v.bruto / 12, base = Math.min(mensual, BASE_MAX);
          var tipos = [['Contingencias comunes', 23.6], ['Desempleo', temp ? 6.7 : 5.5], ['FOGASA', 0.2], ['Formación profesional', 0.6], ['MEI', 0.75], ['Accidentes de trabajo y enfermedades profesionales', at]];
          var ss = 0, tabla = [['Salario bruto anual', TH.eur(v.bruto)]];
          tipos.forEach(function (t) { var c = base * 12 * t[1] / 100; ss += c; tabla.push([t[0] + ' (' + TH.fmt(t[1], [0, 2]) + ' %)', TH.eur(c)]); });
          var otros = pr + he + (un > 0 ? un / an : 0), total = v.bruto + ss + otros;
          tabla.push(['Seguridad Social a cargo de la empresa', TH.eur(ss)], ['Otros costes anuales', TH.eur(otros)], ['Coste total anual', TH.eur(total)]);
          var filas = [TH.fila('coste-anual', 'Coste total anual para la empresa', total, 'eur'), TH.fila('coste-mensual', 'Coste mensual', total / 12, 'eur'), TH.fila('ss-empresa', 'Seguridad Social a cargo de la empresa', ss, 'eur'), TH.fila('tipo-ss', 'Tipo medio de Seguridad Social sobre el bruto', ss / v.bruto * 100, 'pct'),
            TH.fila('otros', 'Otros costes anuales repartidos', otros, 'eur'), TH.fila('ratio', 'Coste de cada euro de salario bruto', total / v.bruto, 'n2')];
          if (ho > 0) filas.push(TH.fila('coste-hora', 'Coste por hora de trabajo', total / ho, 'eur'));
          return { filas: filas, avisos: mensual > BASE_MAX ? ['El salario supera la base máxima de cotización (5.101,20 € al mes): la cotización se calcula solo sobre ese tope y no se incluye la cotización de solidaridad.'] : [],
            tabla: { titulo: 'Desglose anual', cab: ['Concepto', 'Importe'], filas: tabla, cabFila: true },
            notas: ['Estimación con los tipos de 2026 a cargo de la empresa, sin bonificaciones, reducciones ni particularidades de convenio. Consulta con tu gestoría antes de contratar.'] };
        }
      });
    })();
  });
})();
