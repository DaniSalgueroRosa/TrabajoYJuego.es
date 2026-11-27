(function(){
'use strict';
TH.alCargar(function(raiz){
TH.texto(raiz,{
entrada:{etiqueta: 'Pega tu lista, una cosa por línea',ph: 'manzana\npera\nmanzana',ejemplo: 'manzana\npera\nManzana\nuva\n  pera  \n\nkiwi\nuva'},
salida:{etiqueta: 'Lista resultante'},
opciones:[
{id: 'modo',tipo: 'select',etiqueta: 'Qué hacer',valor: 'quitar',ancho: 'completo',opciones:[['quitar','Quitar duplicadas y conservar la primera de cada una'],['unicas','Dejar solo las líneas que no se repiten'],['repetidas','Dejar solo las líneas que se repiten (una vez cada una)']]},
{id: 'mayus',tipo: 'check',etiqueta: 'No distinguir mayúsculas de minúsculas',valor: true},
{id: 'bordes',tipo: 'check',etiqueta: 'Ignorar los espacios al principio y al final',valor: true},
{id: 'vacias',tipo: 'check',etiqueta: 'Quitar también las líneas en blanco',valor: true}
],
descargar:{nombre: 'lista-sin-duplicados.txt'},
procesar: function(t,op){
if(t === '')return{salida: '',filas:[TH.fila('total','Líneas de partida',0,'n0'),TH.fila('distintas','Líneas distintas',0,'n0'),TH.fila('quitadas','Líneas eliminadas',0,'n0')]};
var lineas = t.replace(/\r\n?/g,'\n').split('\n');
if(lineas[lineas.length - 1]=== '')lineas.pop();
var total = lineas.length;
function clave(l){var k = op.bordes ? l.trim(): l;return op.mayus ? k.toLocaleLowerCase('es'): k;}
var util = lineas.filter(function(l){return !(op.vacias && l.trim()=== '');});
var veces ={},orden =[];
util.forEach(function(l){var k = clave(l);if(veces[k]=== undefined){veces[k]= 0;orden.push({k: k,l: op.bordes ? l.trim(): l});}veces[k]++;});
var salida = orden.filter(function(o){return op.modo === 'quitar' ||(op.modo === 'unicas' ? veces[o.k]=== 1 : veces[o.k]> 1);}).map(function(o){return o.l;});
return{salida: salida.join('\n'),filas:[TH.fila('total','Líneas de partida',total,'n0'),TH.fila('distintas','Líneas distintas',orden.length,'n0'),TH.fila('quitadas','Líneas eliminadas',total - salida.length,'n0')]};
}
});
});
})();
