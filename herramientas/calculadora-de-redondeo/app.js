(function(){
'use strict';
TH.alCargar(function(raiz){
var NOMBRES ={normal: 'Redondeo normal',abajo: 'Hacia abajo',arriba: 'Hacia arriba',cero: 'Truncar',par: 'Al par'};
TH.calculadora(raiz,{
campos:[
{id: 'n',etiqueta: 'Número',ph: '2,675'},
{id: 'dec',etiqueta: 'Decimales',ph: '2',valor: '2',entero: true,ayuda: 'Pon 0 para redondear a enteros, o un número negativo para decenas (-1), centenas (-2)…'},
{id: 'multiplo',etiqueta: 'O redondear al múltiplo de (opcional)',ph: '5',ayuda: 'Por ejemplo 5 para redondear a múltiplos de 5, o 0,05 al múltiplo de 5 céntimos.'}
],
ejemplo:{n: '2,675',dec: '2',multiplo: ''},
vacio: 'Escribe un número y los decimales a los que quieres redondearlo.',
calcular: function(v){
if(!TH.listos(v,['n']))return{vacio: true};
var filas =[];
if(!isNaN(v.multiplo)&& v.multiplo !== 0){
var m = Math.abs(v.multiplo),q = v.n / m;
Object.keys(NOMBRES).forEach(function(k){filas.push(TH.fila('m-' + k,NOMBRES[k]+ ' al múltiplo de ' + TH.fmt(m,[0,8]),parseFloat((TH.redondear(q,0,k)* m).toPrecision(12)),'auto'));});
return{filas: filas,notas:['Se divide entre ' + TH.fmt(m,[0,8])+ ', se redondea a entero y se vuelve a multiplicar.']};
}
if(isNaN(v.dec)|| v.dec !== Math.floor(v.dec)|| v.dec < -15 || v.dec > 15)return{error: 'Los decimales deben ser un número entero entre -15 y 15.'};
Object.keys(NOMBRES).forEach(function(k){filas.push(TH.fila(k,NOMBRES[k],TH.redondear(v.n,v.dec,k),[0,Math.max(0,v.dec)].length ? function(x){return TH.fmt(x,[Math.max(0,v.dec),Math.max(0,v.dec)]);}: 'n2'));});
return{filas: filas,notas:['El redondeo normal lleva el 5 hacia arriba (alejándose de cero). El redondeo al par, usado en estadística y contabilidad, lleva el 5 exacto al par más cercano para no sesgar las sumas.']};
}
});
});
})();
