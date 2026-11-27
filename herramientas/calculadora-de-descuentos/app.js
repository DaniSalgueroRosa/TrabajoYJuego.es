(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
var b1 = h('section',{class: 'herr-bloque','aria-labelledby': 'd-t1'},h('h3',{id: 'd-t1',class: 'herr-bloque-titulo',texto: 'Precio final con descuento'}));
var i1 = h('div',{});b1.appendChild(i1);
var b2 = h('section',{class: 'herr-bloque','aria-labelledby': 'd-t2'},h('h3',{id: 'd-t2',class: 'herr-bloque-titulo',texto: '¿Qué descuento me han hecho?'}));
var i2 = h('div',{});b2.appendChild(i2);
TH.vaciar(raiz).appendChild(b1);raiz.appendChild(b2);
TH.calculadora(i1,{
campos:[
{id: 'precio',etiqueta: 'Precio original',unidad: '€',ph: '89,90'},
{id: 'd1',etiqueta: 'Descuento',unidad: '%',ph: '30'},
{id: 'd2',etiqueta: 'Descuento adicional (opcional)',unidad: '%',ph: '10',ayuda: 'Se aplica sobre el precio ya rebajado, como en «30 % + 10 % extra».'}
],
ejemplo:{precio: '89,90',d1: '30',d2: '10'},
calcular: function(v){
if(!TH.listos(v,['precio','d1']))return{vacio: true};
var d2 = isNaN(v.d2)? 0 : v.d2;
if(v.d1 < 0 || d2 < 0 || v.d1 > 100 || d2 > 100)return{error: 'Los descuentos deben estar entre 0 y 100 %.'};
var tras1 = v.precio *(1 - v.d1 / 100),fin = tras1 *(1 - d2 / 100),ahorro = v.precio - fin;
var f =[TH.fila('final','Precio final',fin,'eur'),TH.fila('ahorro','Te ahorras',ahorro,'eur'),TH.fila('efectivo','Descuento total efectivo',v.precio ? ahorro / v.precio * 100 : 0,'pct')];
if(d2 > 0)f.splice(1,0,TH.fila('tras1','Precio tras el primer descuento',tras1,'eur'));
return{filas: f,notas: d2 > 0 ?['Dos descuentos del ' + TH.fmt(v.d1,[0,2])+ ' % y el ' + TH.fmt(d2,[0,2])+ ' % no suman un ' + TH.fmt(v.d1 + d2,[0,2])+ ' %: el segundo se aplica sobre el precio ya rebajado.']:[]};
}
});
TH.calculadora(i2,{
campos:[{id: 'orig',etiqueta: 'Precio original',unidad: '€',ph: '120'},{id: 'rebaj',etiqueta: 'Precio rebajado',unidad: '€',ph: '90'}],
vacio: 'Escribe los dos precios.',
calcular: function(v){
if(!TH.listos(v,['orig','rebaj']))return{vacio: true};
if(v.orig <= 0)return{error: 'El precio original debe ser mayor que cero.'};
var p =(1 - v.rebaj / v.orig)* 100;
return{filas:[TH.fila('desc',p >= 0 ? 'Descuento aplicado' : 'Variación (es un aumento)',Math.abs(p),'pct'),TH.fila('dif',p >= 0 ? 'Ahorro' : 'Aumento',Math.abs(v.orig - v.rebaj),'eur')]};
}
});
});
})();
