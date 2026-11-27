(function(){
'use strict';
TH.alCargar(function(raiz){
function dia0(d){return Math.floor((d - Date.UTC(d.getUTCFullYear(),0,1,12))/ 86400000);}
function iso(d){
var lun =(d.getUTCDay()+ 6)% 7,jue = TH.sumarDias(d,3 - lun),y = jue.getUTCFullYear();
return{anio: y,semana: Math.floor(dia0(jue)/ 7)+ 1,lunes: TH.sumarDias(d,-lun),domingo: TH.sumarDias(d,6 - lun)};
}
function semanasDe(y){return iso(new Date(Date.UTC(y,11,28,12))).semana;}
TH.calculadora(raiz,{
campos:[
{id: 'modo',tipo: 'select',etiqueta: '¿Qué quieres saber?',valor: 'fecha',ancho: 'completo',opciones:[['fecha','En qué semana del año cae una fecha'],['semana','Qué fechas abarca una semana del año']]},
{id: 'fecha',tipo: 'fecha',etiqueta: 'Fecha',valor: 'hoy',mostrarSi: function(v){return v.modo === 'fecha';}},
{id: 'anio',etiqueta: 'Año',ph: '2026',entero: true,mostrarSi: function(v){return v.modo === 'semana';}},
{id: 'semana',etiqueta: 'Número de semana',ph: '47',entero: true,mostrarSi: function(v){return v.modo === 'semana';}}
],
ejemplo:{modo: 'fecha',fecha: '2026-11-14'},
vacio: 'Elige una fecha para ver su semana del año.',
calcular: function(v){
if(v.modo === 'fecha'){
var d = TH.fechaUTC(v.fecha);
if(!v.fecha)return{vacio: true};
if(!d)return{error: 'Escribe una fecha válida.'};
var r = iso(d),y = d.getUTCFullYear(),fin = Date.UTC(y,11,31,12),q = Math.floor(d.getUTCMonth()/ 3)+ 1;
return{filas:[TH.fila('semana','Semana del año',r.semana,'n0'),TH.fila('anio-iso','Año de esa semana',r.anio,'txt'),TH.fila('lunes','La semana empieza el',TH.fechaLarga(r.lunes),'txt'),TH.fila('domingo','La semana termina el',TH.fechaLarga(r.domingo),'txt'),
TH.fila('dia-anio','Día del año',dia0(d)+ 1,'n0'),TH.fila('restantes','Días que quedan de año',Math.round((fin - d)/ 86400000),'n0'),TH.fila('trimestre','Trimestre',q,'n0'),TH.fila('semanas-anio','Semanas que tiene ' + y,semanasDe(y),'n0')],
notas:['Numeración ISO 8601, la de uso habitual en Europa: las semanas empiezan en lunes y la primera semana del año es la que contiene el primer jueves. Por eso los primeros o últimos días de enero y diciembre pueden pertenecer a la semana de otro año.']};
}
if(!TH.listos(v,['anio','semana']))return{vacio: true};
if(v.anio < 1900 || v.anio > 2200 || v.anio !== Math.floor(v.anio))return{error: 'El año debe ser un número entero entre 1900 y 2200.'};
var max = semanasDe(v.anio);
if(v.semana < 1 || v.semana > max || v.semana !== Math.floor(v.semana))return{error: 'El año ' + v.anio + ' tiene ' + max + ' semanas: escribe un número entre 1 y ' + max + '.'};
var cuatro = new Date(Date.UTC(v.anio,0,4,12)),lun = TH.sumarDias(cuatro,-((cuatro.getUTCDay()+ 6)% 7)+(v.semana - 1)* 7);
return{filas:[TH.fila('lunes','La semana ' + v.semana + ' empieza el',TH.fechaLarga(lun),'txt'),TH.fila('domingo','Y termina el',TH.fechaLarga(TH.sumarDias(lun,6)),'txt'),TH.fila('semanas-anio','Semanas que tiene ' + v.anio,max,'n0')]};
}
});
});
})();
