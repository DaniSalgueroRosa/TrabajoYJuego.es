(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.calculadora(raiz, {
      campos: [
        { id: 'w', etiqueta: 'Potencia del aparato', unidad: 'W', ph: '2000' },
        { id: 'n', etiqueta: 'Número de aparatos iguales', valor: '1', entero: true },
        { id: 'h', etiqueta: 'Horas de uso al día', unidad: 'h', ph: '3' },
        { id: 'dias', etiqueta: 'Días de uso al mes', valor: '30', entero: true },
        { id: 'precio', etiqueta: 'Precio del kWh (opcional)', unidad: '€/kWh', ph: '0,15' }
      ],
      ejemplo: { w: '2000', n: '1', h: '3', dias: '30', precio: '0,15' },
      calcular: function (v) {
        if (!TH.listos(v, ['w', 'n', 'h', 'dias'])) return { vacio: true };
        if (v.w <= 0 || v.n < 1 || v.n !== Math.floor(v.n)) return { error: 'La potencia debe ser mayor que cero y el número de aparatos, un entero desde 1.' };
        if (v.h < 0 || v.h > 24) return { error: 'Las horas de uso al día deben estar entre 0 y 24.' };
        if (v.dias < 0 || v.dias > 31 || v.dias !== Math.floor(v.dias)) return { error: 'Los días de uso al mes deben ser un entero entre 0 y 31.' };
        var dia = v.w * v.n * v.h / 1000, mes = dia * v.dias, anio = mes * 12, p = v.precio > 0 ? v.precio : null, f = [];
        if (p) f.push(TH.fila('coste-mes', 'Coste al mes', mes * p, 'eur'), TH.fila('coste-anio', 'Coste al año', anio * p, 'eur'), TH.fila('coste-dia', 'Coste en un día de uso', dia * p, 'eur'));
        f.push(TH.fila('kwh-dia', 'Consumo en un día de uso (kWh)', dia, 'n2'), TH.fila('kwh-mes', 'Consumo al mes (kWh)', mes, 'n2'), TH.fila('kwh-anio', 'Consumo al año (kWh)', anio, 'n2'));
        return { filas: f, notas: [p ? 'Solo se cuenta la parte variable: la potencia contratada y los impuestos de la factura no están incluidos.' : 'Indica el precio del kWh para ver también el coste.'] };
      }
    });
  });
})();
