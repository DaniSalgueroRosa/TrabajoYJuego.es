(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{id: 'importe',etiqueta: 'Importe de la factura',unidad: '€',ph: '5000'},
{id: 'desc',etiqueta: 'Descuento por pronto pago',unidad: '%',ph: '2'},
{id: 'dias',etiqueta: 'Días para acogerse al descuento',unidad: 'días',ph: '10'},
{id: 'plazo',etiqueta: 'Plazo normal de pago',unidad: 'días',ph: '30'},
{id: 'financiacion',etiqueta: 'Lo que te cuesta financiarte (opcional)',unidad: '% anual',ph: '8'}
],
ejemplo:{importe: '5000',desc: '2',dias: '10',plazo: '30',financiacion: '8'},
calcular: function(v){
if(!TH.listos(v,['importe','desc','dias','plazo']))return{vacio: true};
var fin = z(v.financiacion);
if(v.importe <= 0)return{error: 'El importe debe ser mayor que 0.'};
if(v.desc <= 0 || v.desc >= 100)return{error: 'El descuento debe ser mayor que 0 y menor que 100 %.'};
if(v.dias < 0 || v.plazo <= v.dias)return{error: 'El plazo normal debe ser mayor que los días de pronto pago.'};
if(fin < 0)return{error: 'El coste de financiación no puede ser negativo.'};
var d = v.desc / 100,ahorro = v.importe * d,pagar = v.importe - ahorro,ganados = v.plazo - v.dias,tasa = d /(1 - d),per = 365 / ganados;
var simple = tasa * per * 100,efectivo =(Math.pow(1 + tasa,per)- 1)* 100;
var filas =[TH.fila('ahorro','Ahorro si pagas antes',ahorro,'eur'),TH.fila('pagar','Importe a pagar con descuento',pagar,'eur'),TH.fila('tasa-simple','Coste anual equivalente (tipo simple)',simple,'pct'),TH.fila('tasa-efectiva','Coste anual equivalente (con capitalización)',efectivo,'pct'),
TH.fila('dias-ganados','Días de crédito a los que renuncias',ganados,'n0')],avisos =[];
if(fin > 0){
avisos.push(simple > fin ? 'Compensa pagar antes: renunciar al descuento te sale más caro (' + TH.fmt(simple,[0,1])+ ' % anual) que financiarte al ' + TH.fmt(fin,[0,1])+ ' %, siempre que tengas la liquidez.' : 'No compensa pagar antes: financiarte te cuesta más (' + TH.fmt(fin,[0,1])+ ' %) que lo que ahorras con el descuento (' + TH.fmt(simple,[0,1])+ ' % anual).');
}
return{filas: filas,avisos: avisos,notas:['Fórmula del descuento anualizado: tipo = descuento ÷ (1 − descuento) × 365 ÷ días ganados. Supone que tienes liquidez y que el proveedor acepta el pago anticipado.']};
}
});
})();
});
})();
