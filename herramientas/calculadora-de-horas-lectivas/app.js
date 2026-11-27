(function(){
'use strict';
TH.alCargar(function(raiz){
TH.calculadora(raiz,{
campos:[
{id: 'asig',tipo: 'lista',etiqueta: 'Asignaturas o módulos',inicial: 3,min: 1,max: 30,textoAnadir: 'Añadir asignatura',
columnas:[{id: 'nombre',etiqueta: 'Nombre',tipo: 'texto',ph: 'Programación'},{id: 'horas',etiqueta: 'Horas a la semana',ph: '6'}]},
{id: 'semanas',etiqueta: 'Semanas lectivas del curso',ph: '32',valor: '32',ayuda: 'Descuenta vacaciones, festivos y exámenes si no hay clase.'},
{id: 'pfaltas',etiqueta: 'Porcentaje máximo de faltas (opcional)',unidad: '%',ph: '20',ayuda: 'Para ver cuántas horas puedes faltar en cada asignatura.'}
],
ejemplo:{asig:[{nombre: 'Programación',horas: '6'},{nombre: 'Bases de datos',horas: '4'},{nombre: 'Lenguajes de marcas',horas: '3'}],semanas: '32',pfaltas: '20'},
vacio: 'Escribe las horas semanales de cada asignatura y las semanas del curso.',
calcular: function(v){
var f = v.asig.filter(function(x){return !isNaN(x.horas);});
if(!f.length || !TH.listos(v,['semanas']))return{vacio: true};
if(v.semanas <= 0 || f.some(function(x){return x.horas < 0;}))return{error: 'Las semanas y las horas tienen que ser positivas.'};
var hay = !isNaN(v.pfaltas);
if(hay &&(v.pfaltas < 0 || v.pfaltas > 100))return{error: 'El porcentaje de faltas debe estar entre 0 y 100 %.'};
var total = 0,semana = 0,rows =[];
f.forEach(function(x,i){
var origen = v.asig.filter(function(d){return d.horas === x.horas;})[0],h = x.horas * v.semanas;total += h;semana += x.horas;
var fila =[(x.nombre ||(origen && origen.nombre)|| 'Asignatura ' +(i + 1)),TH.fmt(x.horas,[0,2]),TH.fmt(h,[0,2])];
if(hay)fila.push(TH.fmt(Math.floor(h * v.pfaltas / 100 + 1e-9),0));
rows.push(fila);
});
var filas =[TH.fila('total','Horas lectivas del curso',total,'n2'),TH.fila('semana','Horas a la semana',semana,'n2'),TH.fila('media','Horas al día (en 5 días)',semana / 5,'n2')];
if(hay)filas.push(TH.fila('faltasmax','Faltas máximas en total (suma por asignatura)',f.reduce(function(a,x){return a + Math.floor(x.horas * v.semanas * v.pfaltas / 100 + 1e-9);},0),'n0'));
return{filas: filas,tabla:{titulo: 'Horas por asignatura',cab:['Asignatura','Horas a la semana','Horas en el curso'].concat(hay ?['Faltas máximas']:[]),cabFila: true,filas: rows}};
}
});
});
})();
