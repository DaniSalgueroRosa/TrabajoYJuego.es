(function(){
'use strict';
TH.alCargar(function(raiz){
var DIAS =['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
function hhmm(min){var h = Math.floor(min / 60)% 24,m = min % 60;return('0' + h).slice(-2)+ ':' +('0' + m).slice(-2);}
var campos =[
{id: 'asig',tipo: 'lista',etiqueta: 'Asignaturas y prioridad',inicial: 3,min: 1,max: 15,textoAnadir: 'Añadir asignatura',
columnas:[{id: 'nombre',etiqueta: 'Asignatura',tipo: 'texto',ph: 'Historia'},{id: 'peso',etiqueta: 'Prioridad (1 a 5)',ph: '3',valor: '3',entero: true}]}
];
DIAS.forEach(function(d,i){campos.push({id: 'd' + i,tipo: 'check',etiqueta: d,valor: i < 5});});
campos.push({id: 'horas',etiqueta: 'Horas de estudio por día',ph: '2',valor: '2'},
{id: 'inicio',tipo: 'hora',etiqueta: 'Hora de inicio',valor: '17:00'},
{id: 'bloque',etiqueta: 'Duración de cada bloque',unidad: 'min',ph: '50',valor: '50',entero: true},
{id: 'descanso',etiqueta: 'Descanso entre bloques',unidad: 'min',ph: '10',valor: '10',entero: true});
TH.calculadora(raiz,{
campos: campos,
ejemplo:{asig:[{nombre: 'Matemáticas',peso: '4'},{nombre: 'Historia',peso: '2'},{nombre: 'Inglés',peso: '3'}]},
vacio: 'Escribe tus asignaturas, marca los días que puedes estudiar y elige las horas y los bloques.',
calcular: function(v){
var asig = v.asig.map(function(a,i){return{nombre:(a.nombre || '').trim()|| 'Asignatura ' +(i + 1),peso: a.peso,usada: !isNaN(a.peso)||(a.nombre || '').trim()};}).filter(function(a){return a.usada;});
asig.forEach(function(a){if(isNaN(a.peso))a.peso = 3;});
if(!asig.length)return{vacio: true};
var dias = DIAS.map(function(d,i){return v['d' + i]? i : -1;}).filter(function(i){return i >= 0;});
if(!dias.length)return{error: 'Marca al menos un día de estudio.'};
if(!TH.listos(v,['horas','bloque','descanso'])|| !v.inicio)return{vacio: true};
if(asig.some(function(a){return a.peso < 1 || a.peso > 5;}))return{error: 'La prioridad va de 1 (poca) a 5 (mucha).'};
if(v.horas <= 0 || v.horas > 12 || v.bloque < 10 || v.bloque > 180 || v.descanso < 0 || v.descanso > 60)return{error: 'Revisa los tiempos: de 0,5 a 12 horas al día, bloques de 10 a 180 minutos y descansos de hasta 60.'};
var ini = parseInt(v.inicio.slice(0,2),10)* 60 + parseInt(v.inicio.slice(3,5),10);
var porDia = Math.max(1,Math.floor((v.horas * 60 + v.descanso)/(v.bloque + v.descanso)));
var total = porDia * dias.length,sp = asig.reduce(function(a,x){return a + x.peso;},0);
var cuotas = asig.map(function(a){var e = total * a.peso / sp;return{a: a,n: Math.floor(e),r: e - Math.floor(e)};});
var falta = total - cuotas.reduce(function(s,c){return s + c.n;},0);
cuotas.slice().sort(function(x,y){return y.r - x.r;}).slice(0,falta).forEach(function(c){c.n++;});
var cola =[],rest = cuotas.map(function(c){return{a: c.a,n: c.n};});
while(cola.length < total){
rest.sort(function(x,y){return y.n - x.n;});
var cogidas = 0;
for(var i = 0;i < rest.length && cola.length < total;i++)if(rest[i].n > 0){cola.push(rest[i].a);rest[i].n--;cogidas++;}
if(!cogidas)break;
}
var filas =[],k = 0,cuenta ={};
dias.forEach(function(d,di){
for(var b = 0;b < porDia;b++){
var a = cola[(b * dias.length + di)% cola.length],desde = ini + b *(v.bloque + v.descanso);
cuenta[a.nombre]=(cuenta[a.nombre]|| 0)+ 1;
filas.push([DIAS[d],hhmm(desde)+ ' – ' + hhmm(desde + v.bloque),a.nombre]);k++;
}
});
var texto = 'Horario de estudio\n' + filas.map(function(f){return f.join('  ');}).join('\n');
var resumen = Object.keys(cuenta).map(function(n){return n + ': ' + cuenta[n]+(cuenta[n]=== 1 ? ' bloque' : ' bloques');}).join(' · ');
return{filas:[TH.fila('bloques','Bloques de estudio por semana',total,'n0'),TH.fila('pordia','Bloques por día',porDia,'n0'),TH.fila('horas-semana','Horas de estudio por semana',total * v.bloque / 60,'n2')],
tabla:{titulo: 'Tu horario semanal',cab:['Día','Hora','Asignatura'],cabFila: true,filas: filas},notas:[resumen],texto: texto};
}
});
});
})();
