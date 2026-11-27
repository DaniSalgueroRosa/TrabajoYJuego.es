(function(){
'use strict';
TH.alCargar(function(raiz){
(function(){
var z = function(x){return typeof x === 'number' && isFinite(x)? x : 0;};
TH.calculadora(raiz,{
campos:[
{tipo: 'lista',id: 'asistentes',etiqueta: 'Quién asiste',inicial: 2,max: 12,textoAnadir: 'Añadir perfil',
columnas:[{id: 'perfil',etiqueta: 'Perfil',tipo: 'texto',ph: 'Dirección'},{id: 'personas',etiqueta: 'Personas',tipo: 'numero',ph: '2'},{id: 'coste',etiqueta: 'Coste por hora (€)',tipo: 'numero',ph: '60'}]},
{id: 'duracion',etiqueta: 'Duración',unidad: 'minutos',ph: '90'},
{id: 'veces',etiqueta: 'Veces que se repite al mes',unidad: 'veces',ph: '4'}
],
ejemplo:{asistentes:[{perfil: 'Dirección',personas: '2',coste: '60'},{perfil: 'Equipo',personas: '6',coste: '25'}],duracion: '90',veces: '4'},
calcular: function(v){
if(!TH.listos(v,['duracion']))return{vacio: true};
var filas =(v.asistentes ||[]).filter(function(a){return isFinite(a.personas)&& isFinite(a.coste);});
if(!filas.length)return{vacio: true};
var veces = z(v.veces)> 0 ? v.veces : 1;
if(v.duracion <= 0 || v.duracion > 1440)return{error: 'La duración debe estar entre 1 y 1.440 minutos.'};
if(filas.some(function(a){return a.personas < 1 || a.personas !== Math.floor(a.personas)|| a.coste < 0;}))return{error: 'Cada perfil necesita un número entero de personas (1 o más) y un coste por hora no negativo.'};
var pers = 0,hora = 0;
filas.forEach(function(a){pers += a.personas;hora += a.personas * a.coste;});
var h = v.duracion / 60,reunion = hora * h,mes = reunion * veces;
var rf =[TH.fila('coste-reunion','Coste de cada reunión',reunion,'eur'),TH.fila('coste-mes','Coste al mes con ' + veces + ' reuniones',mes,'eur'),TH.fila('coste-anio','Coste al año (12 meses)',mes * 12,'eur'),
TH.fila('coste-minuto','Coste por minuto',hora / 60,'eur'),TH.fila('horas-persona','Horas-persona por reunión',pers * h,'n2'),TH.fila('asistentes','Asistentes',pers,'n0'),TH.fila('coste-asistente','Coste medio por asistente',reunion / pers,'eur')];
return{filas: rf,tabla:{titulo: 'Coste por perfil',cab:['Perfil','Personas','Coste por hora','Coste de la reunión'],cabFila: true,
filas: filas.map(function(a,i){return[(a.perfil || '').trim()|| 'Perfil ' +(i + 1),String(a.personas),TH.eur(a.coste),TH.eur(a.personas * a.coste * h)];})},
notas:['El coste por hora debe ser el coste total para la empresa. No incluye el valor de lo que dejan de hacer los asistentes durante la reunión.']};
}
});
})();
});
})();
