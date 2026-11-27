(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: 'Qué quieres calcular',valor: 'consumo',opciones:[['consumo','Calcular el consumo de mi coche'],['viaje','Calcular el coste de un viaje']]},
{id: 'km',etiqueta: 'Kilómetros recorridos',unidad: 'km',ph: '620',mostrarSi: function(v){return v.modo === 'consumo';}},
{id: 'litros',etiqueta: 'Litros repostados',unidad: 'l',ph: '38,5',mostrarSi: function(v){return v.modo === 'consumo';}},
{id: 'dist',etiqueta: 'Distancia del viaje',unidad: 'km',ph: '450',mostrarSi: function(v){return v.modo === 'viaje';}},
{id: 'cons',etiqueta: 'Consumo de tu coche',unidad: 'l/100 km',ph: '6,2',mostrarSi: function(v){return v.modo === 'viaje';}},
{id: 'ida',tipo: 'check',etiqueta: 'Ida y vuelta',valor: false,mostrarSi: function(v){return v.modo === 'viaje';}},
{id: 'personas',etiqueta: 'Personas que reparten el gasto',valor: '1',entero: true,mostrarSi: function(v){return v.modo === 'viaje';}},
{id: 'precio',etiqueta: 'Precio del litro (opcional en el consumo)',unidad: '€/l',ph: '1,55'}
],
ejemplo:{modo: 'consumo',km: '620',litros: '38,5',precio: '1,55'},
calcular: function(v){
var precio = v.precio > 0 ? v.precio : null;
if(v.modo === 'consumo'){
if(!TH.listos(v,['km','litros']))return{vacio: true};
if(v.km <= 0 || v.litros <= 0)return{error: 'Los kilómetros y los litros deben ser mayores que cero.'};
var c = v.litros / v.km * 100,filas =[TH.fila('consumo','Consumo (litros cada 100 km)',c,'n2'),TH.fila('kml','Kilómetros por litro',v.km / v.litros,'n2')];
if(precio){filas.push(TH.fila('coste100','Coste cada 100 km',c * precio,'eur'));filas.push(TH.fila('costekm','Coste por kilómetro',precio * v.litros / v.km,'eur'));filas.push(TH.fila('coste','Coste de este repostaje',v.litros * precio,'eur'));}
return{filas: filas,notas:['Para que el dato sea fiable, el depósito debe estar lleno al empezar y al terminar la medición.']};
}
if(!TH.listos(v,['dist','cons','personas']))return{vacio: true};
if(v.dist <= 0 || v.cons <= 0)return{error: 'La distancia y el consumo deben ser mayores que cero.'};
if(v.personas < 1 || v.personas > 100 || v.personas !== Math.floor(v.personas))return{error: 'Las personas deben ser un entero entre 1 y 100.'};
var km = v.dist *(v.ida ? 2 : 1),l = km * v.cons / 100,f =[TH.fila('litros-viaje','Combustible necesario (litros)',l,'n2'),TH.fila('km-total','Kilómetros totales',km,'n0')];
if(precio){f.push(TH.fila('coste-viaje','Coste del combustible',l * precio,'eur'));f.push(TH.fila('coste-persona',v.personas > 1 ? 'Cada persona paga' : 'Por persona',l * precio / v.personas,'eur'));f.push(TH.fila('coste-km','Coste por kilómetro',l * precio / km,'eur'));}
return{filas: f,notas: precio ?['Solo cuenta el combustible: peajes, aparcamiento y desgaste del coche no están incluidos.']:['Indica el precio del litro para ver también el coste.']};
}
});
});
})();
