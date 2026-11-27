(function(){
'use strict';
TH.alCargar(function(raiz){
var MILLA = 1.609344;
function hms(s){
s = Math.round(s);
var h = Math.floor(s / 3600),m = Math.floor((s % 3600)/ 60),x = s % 60;
return h > 0 ? h + ':' +('0' + m).slice(-2)+ ':' +('0' + x).slice(-2): m + ':' +('0' + x).slice(-2);
}
function num(x){return isFinite(x)&& x !== null ? +x : 0;}
TH.calculadora(raiz,{
campos:[
{id: 'dist',tipo: 'select',etiqueta: 'Distancia',valor: '10',opciones:[['5','5 km'],['10','10 km'],['21.0975','Media maratón (21,0975 km)'],['42.195','Maratón (42,195 km)'],['otra','Otra distancia']]},
{id: 'otra',etiqueta: 'Otra distancia',unidad: 'km',ph: '7,5',mostrarSi: function(v){return v.dist === 'otra';}},
{id: 'h',etiqueta: 'Horas',entero: true,ph: '0'},
{id: 'm',etiqueta: 'Minutos',ph: '50'},
{id: 's',etiqueta: 'Segundos',ph: '0'}
],
ejemplo:{dist: '10',h: '0',m: '50',s: '0'},
calcular: function(v){
var d = v.dist === 'otra' ? v.otra : +v.dist,h = num(v.h),m = num(v.m),s = num(v.s);
if(!(d > 0)&& v.dist === 'otra' && !isFinite(v.otra))return{vacio: true};
if(h + m + s <= 0)return{vacio: true};
if(!(d > 0))return{error: 'La distancia debe ser mayor que cero.'};
if(h < 0 || m < 0 || s < 0)return{error: 'El tiempo no puede ser negativo.'};
if(m >= 60 || s >= 60)return{error: 'Los minutos y los segundos deben ser menores que 60. Usa el campo de horas para tiempos largos.'};
var total = h * 3600 + m * 60 + s,ritmo = total / d;
return{filas:[TH.fila('ritmo','Ritmo por kilómetro',hms(ritmo)+ ' min/km','txt'),TH.fila('vel','Velocidad media (km/h)',d / total * 3600,'n2'),TH.fila('milla','Ritmo por milla',hms(ritmo * MILLA)+ ' min/milla','txt'),
TH.fila('t5','Tiempo en 5 km',hms(ritmo * 5),'txt'),TH.fila('t10','Tiempo en 10 km',hms(ritmo * 10),'txt'),TH.fila('t21','Tiempo en media maratón',hms(ritmo * 21.0975),'txt'),TH.fila('t42','Tiempo en maratón',hms(ritmo * 42.195),'txt')],
notas:['Las proyecciones suponen el mismo ritmo en toda la distancia; en las largas suelen ser optimistas.']};
}
});
});
})();
