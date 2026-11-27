(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué conoces?',valor: 'base',opciones:[['base','Tengo la base (sin IVA) y quiero el total'],['total','Tengo el total (con IVA) y quiero la base']],ancho: 'completo'},
{id: 'importe',etiqueta: 'Importe',unidad: '€',ph: '1.000'},
{id: 'tipo',tipo: 'select',etiqueta: 'Tipo de IVA',valor: '21',opciones:[['21','21 % (general)'],['10','10 % (reducido)'],['4','4 % (superreducido)'],['0','0 % (exento)'],['otro','Otro porcentaje']]},
{id: 'otro',etiqueta: 'Otro tipo',unidad: '%',ph: '7',mostrarSi: function(v){return v.tipo === 'otro';}}
],
ejemplo:{modo: 'base',importe: '1000',tipo: '21'},
calcular: function(v){
var t = v.tipo === 'otro' ? v.otro : +v.tipo;
if(!TH.listos(v,['importe'])|| !isFinite(t))return{vacio: true};
if(t < 0 || t > 100)return{error: 'El tipo de IVA debe estar entre 0 y 100 %.'};
var base = v.modo === 'base' ? v.importe : v.importe /(1 + t / 100);
var iva = base * t / 100,total = base + iva;
return{filas:[v.modo === 'base' ? TH.fila('total','Total con IVA',total,'eur'): TH.fila('base','Base imponible',base,'eur'),
TH.fila('iva','IVA (' + TH.fmt(t,[0,2])+ ' %)',iva,'eur'),v.modo === 'base' ? TH.fila('base','Base imponible',base,'eur'): TH.fila('total','Total con IVA',total,'eur')],
notas:['El cálculo es matemático y se redondea a céntimos al mostrarlo. En una factura, el IVA se redondea por factura o por línea según el criterio del emisor.']};
}
});
});
})();
