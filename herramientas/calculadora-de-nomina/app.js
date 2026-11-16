(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    /* Datos de 2026 (Orden PJC/297/2026). Hay que revisarlos cada enero. */
    var BASE_MAX = 5101.20;
    TH.calculadora(raiz, {
      campos: [
        { id: 'base', etiqueta: 'Salario base mensual', unidad: '€', ph: '1.800' },
        { id: 'compl', etiqueta: 'Complementos salariales del mes', unidad: '€', ph: '200', ayuda: 'Pluses de convenio, antigüedad, transporte salarial, objetivos…' },
        { id: 'prorrata', etiqueta: 'Prorrata de pagas extra incluida', unidad: '€', ph: '0', ayuda: 'Solo si tus pagas extra están prorrateadas en la nómina.' },
        { id: 'irpf', etiqueta: 'Retención de IRPF', unidad: '%', ph: '12', ayuda: 'Es el porcentaje que figura en tu nómina o en tu contrato.' },
        { id: 'contrato', tipo: 'select', etiqueta: 'Tipo de contrato', valor: 'indef', opciones: [['indef', 'Indefinido'], ['temp', 'De duración determinada']] },
        { id: 'atep', etiqueta: 'Accidentes de trabajo (a cargo de la empresa)', unidad: '%', valor: '1,5', ayuda: 'Depende de la actividad de la empresa. Solo afecta al coste empresarial.' }
      ],
      ejemplo: { base: '1800', compl: '200', prorrata: '333,33', irpf: '12', contrato: 'indef', atep: '1,5' },
      calcular: function (v) {
        var comp = isFinite(v.compl) ? v.compl : 0, pr = isFinite(v.prorrata) ? v.prorrata : 0, atep = isFinite(v.atep) ? v.atep : 0;
        if (!TH.listos(v, ['base', 'irpf'])) return { vacio: true };
        if (v.base < 0 || comp < 0 || pr < 0) return { error: 'El salario, los complementos y la prorrata no pueden ser negativos.' };
        if (v.irpf < 0 || v.irpf > 60) return { error: 'La retención de IRPF debe estar entre 0 y 60 %.' };
        if (atep < 0 || atep > 15) return { error: 'El porcentaje de accidentes de trabajo debe estar entre 0 y 15 %.' };
        var temp = v.contrato === 'temp', dev = v.base + comp + pr;
        if (dev <= 0) return { vacio: true };
        var bc = Math.min(dev, BASE_MAX), cc = bc * 0.047, des = bc * (temp ? 0.016 : 0.0155), fp = bc * 0.001, mei = bc * 0.0015, ss = cc + des + fp + mei, ir = dev * v.irpf / 100;
        var emp = bc * (0.236 + (temp ? 0.067 : 0.055) + 0.002 + 0.006 + 0.0075 + atep / 100);
        return { filas: [TH.fila('liquido', 'Líquido a percibir', dev - ss - ir, 'eur'), TH.fila('devengado', 'Total devengado (bruto del mes)', dev, 'eur'), TH.fila('bc', 'Base de cotización', bc, 'eur'),
            TH.fila('cc', 'Contingencias comunes (4,70 %)', cc, 'eur'), TH.fila('desempleo', 'Desempleo (' + (temp ? '1,60' : '1,55') + ' %)', des, 'eur'), TH.fila('fp', 'Formación profesional (0,10 %)', fp, 'eur'), TH.fila('mei', 'MEI (0,15 %)', mei, 'eur'),
            TH.fila('ss', 'Total Seguridad Social del trabajador', ss, 'eur'), TH.fila('irpf', 'Retención de IRPF', ir, 'eur'), TH.fila('deducciones', 'Total deducciones', ss + ir, 'eur'),
            TH.fila('ss-empresa', 'Seguridad Social a cargo de la empresa', emp, 'eur'), TH.fila('coste', 'Coste total para la empresa', dev + emp, 'eur')],
          avisos: dev > BASE_MAX ? ['El salario supera la base máxima de cotización (5.101,20 € al mes): las cotizaciones se calculan solo sobre ese tope.'] : [],
          notas: ['Cálculo orientativo con los tipos de 2026 para el Régimen General. En una nómina real pueden intervenir horas extra, retribuciones en especie, bases mínimas por grupo de cotización, bonificaciones y otras particularidades. Contrasta el resultado con tu nómina.'] };
      }
    });
  });
})();
