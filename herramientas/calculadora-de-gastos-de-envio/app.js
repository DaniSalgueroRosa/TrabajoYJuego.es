(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    (function () {
      var z = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
      TH.calculadora(raiz, {
        campos: [
          { id: 'largo', etiqueta: 'Largo', unidad: 'cm', ph: '40' }, { id: 'ancho', etiqueta: 'Ancho', unidad: 'cm', ph: '30' }, { id: 'alto', etiqueta: 'Alto', unidad: 'cm', ph: '20' },
          { id: 'peso', etiqueta: 'Peso real del paquete', unidad: 'kg', ph: '3,2' },
          { id: 'divisor', etiqueta: 'Divisor volumétrico del transportista', unidad: 'cm³/kg', valor: '5000' },
          { tipo: 'lista', id: 'tramos', etiqueta: 'Tus tarifas por tramos (sin IVA)', inicial: 3, max: 12, textoAnadir: 'Añadir tramo',
            columnas: [{ id: 'hasta', etiqueta: 'Hasta (kg)', tipo: 'numero', ph: '5' }, { id: 'precio', etiqueta: 'Precio (€)', tipo: 'numero', ph: '7,90' }] },
          { id: 'combustible', etiqueta: 'Recargo de combustible', unidad: '%', ph: '5' },
          { id: 'embalaje', etiqueta: 'Coste del embalaje', unidad: '€', ph: '0,8' },
          { id: 'iva', etiqueta: 'IVA', unidad: '%', valor: '21' },
          { id: 'pedido', etiqueta: 'Importe medio del pedido (opcional)', unidad: '€', ph: '60' },
          { id: 'maxpct', etiqueta: 'Máximo del pedido que puede costar el envío', unidad: '%', valor: '10' }
        ],
        ejemplo: { largo: '40', ancho: '30', alto: '20', peso: '3,2', divisor: '5000', tramos: [{ hasta: '2', precio: '5,5' }, { hasta: '5', precio: '7,9' }, { hasta: '10', precio: '11,2' }], combustible: '5', embalaje: '0,8', iva: '21', pedido: '60', maxpct: '10' },
        calcular: function (v) {
          if (!TH.listos(v, ['largo', 'ancho', 'alto', 'peso', 'divisor'])) return { vacio: true };
          var comb = z(v.combustible), emb = z(v.embalaje), iva = z(v.iva), ped = z(v.pedido), mp = z(v.maxpct);
          if (v.largo <= 0 || v.ancho <= 0 || v.alto <= 0 || v.peso <= 0 || v.divisor <= 0) return { error: 'Las medidas, el peso y el divisor deben ser mayores que 0.' };
          if (comb < 0 || emb < 0 || iva < 0 || iva > 50 || ped < 0 || mp < 0 || mp > 100) return { error: 'El recargo, el embalaje y el pedido no pueden ser negativos; el IVA debe estar entre 0 y 50 % y el máximo del envío entre 0 y 100 %.' };
          var tr = (v.tramos || []).filter(function (t) { return isFinite(t.hasta) && isFinite(t.precio) && t.hasta > 0 && t.precio >= 0; }).sort(function (a, b) { return a.hasta - b.hasta; });
          if (!tr.length) return { error: 'Escribe al menos un tramo con su peso máximo y su precio.' };
          var vol = v.largo * v.ancho * v.alto / v.divisor, fact = Math.max(v.peso, vol), t = null, i;
          for (i = 0; i < tr.length; i++) if (tr[i].hasta >= fact - 1e-9) { t = tr[i]; break; }
          if (!t) return { error: 'El peso facturable (' + TH.fmt(fact, [0, 2]) + ' kg) supera el último tramo de tu tarifa. Añade un tramo mayor o consulta la tarifa especial.' };
          var rec = t.precio * comb / 100, env = t.precio + rec, ivaE = env * iva / 100, tot = env + ivaE;
          var filas = [TH.fila('envio-total', 'Coste del envío con IVA', tot, 'eur'), TH.fila('volumetrico', 'Peso volumétrico', vol, 'n2'), TH.fila('facturable', 'Peso facturable', fact, 'n2'), TH.fila('tarifa', 'Tarifa del tramo (hasta ' + TH.fmt(t.hasta, [0, 2]) + ' kg)', t.precio, 'eur'),
            TH.fila('recargo', 'Recargo de combustible', rec, 'eur'), TH.fila('envio-sin-iva', 'Envío sin IVA', env, 'eur'), TH.fila('iva-eur', 'IVA del envío', ivaE, 'eur'), TH.fila('coste-total', 'Envío y embalaje (sin IVA del envío)', env + emb, 'eur')];
          if (ped > 0) filas.push(TH.fila('pct-pedido', 'Envío sobre el importe del pedido', env / ped * 100, 'pct'));
          if (mp > 0) filas.push(TH.fila('pedido-minimo', 'Pedido mínimo para que el envío no pase del ' + TH.fmt(mp, [0, 2]) + ' %', env / mp * 100, 'eur'));
          return { filas: filas, avisos: fact > v.peso ? ['El paquete se factura por su peso volumétrico, mayor que el real. Un embalaje más ajustado reduciría la tarifa.'] : [], notas: ['Calculado con las tarifas que has escrito: la herramienta no contiene precios de ningún transportista. El coste del envío del pedido mínimo se calcula sin IVA, que es lo que soportas como empresa.'] };
        }
      });
    })();
  });
})();
