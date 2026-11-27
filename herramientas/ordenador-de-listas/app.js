(function(){
'use strict';
TH.alCargar(function(raiz){
var SEPS ={linea:{ent: /\r?\n/,sal: '\n'},coma:{ent: /,/,sal: ', '},pyc:{ent: /;/,sal: '; '}};
function esNumero(x){return /^[-+]?\d+([.,]\d+)?$/.test(x);}
function aNumero(x){return parseFloat(x.replace(',','.'));}
TH.texto(raiz,{
entrada:{etiqueta: 'Pega tu lista',ph: 'zorro\nÁlamo\nñu\nnube',ejemplo: 'zorro\nÁlamo\nñu\nnube\noso\nnube\nitem10\nitem2\nitem1'},
salida:{etiqueta: 'Lista ordenada'},
botones:[{texto: 'Mezclar de nuevo',accion: function(api){api.actualizar();}}],
opciones:[
{id: 'orden',tipo: 'select',etiqueta: 'Ordenar',valor: 'az',opciones:[['az','De la A a la Z'],['za','De la Z a la A'],['corta','Por longitud: de la más corta a la más larga'],['larga','Por longitud: de la más larga a la más corta'],['num','Numéricamente (de menor a mayor)'],['invertir','Invertir el orden actual'],['azar','Al azar']]},
{id: 'sep',tipo: 'select',etiqueta: 'Los elementos están separados por',valor: 'linea',opciones:[['linea','Saltos de línea'],['coma','Comas'],['pyc','Puntos y coma']]},
{id: 'natural',tipo: 'check',etiqueta: 'Orden natural: item2 antes que item10',valor: true},
{id: 'dup',tipo: 'check',etiqueta: 'Quitar los elementos repetidos',valor: false},
{id: 'vacios',tipo: 'check',etiqueta: 'Quitar los elementos vacíos',valor: true},
{id: 'numerar',tipo: 'check',etiqueta: 'Numerar el resultado',valor: false}
],
descargar:{nombre: 'lista-ordenada.txt'},
procesar: function(t,op){
var sep = SEPS[op.sep],col = new Intl.Collator('es',{numeric: !!op.natural});
var items = t === '' ?[]: t.split(sep.ent).map(function(x){return x.trim();}),antes = items.length;
if(op.vacios)items = items.filter(function(x){return x !== '';});
if(op.dup){var vistos ={};items = items.filter(function(x){var k = x.toLocaleLowerCase('es');if(vistos[k])return false;vistos[k]= 1;return true;});}
var largo = function(x){return TH.grafemas(x).length;};
switch(op.orden){
case 'az': items.sort(col.compare);break;
case 'za': items.sort(function(a,b){return col.compare(b,a);});break;
case 'corta': items.sort(function(a,b){return largo(a)- largo(b)|| col.compare(a,b);});break;
case 'larga': items.sort(function(a,b){return largo(b)- largo(a)|| col.compare(a,b);});break;
case 'num': items.sort(function(a,b){var na = esNumero(a),nb = esNumero(b);return na && nb ? aNumero(a)- aNumero(b): na ? -1 : nb ? 1 : col.compare(a,b);});break;
case 'invertir': items.reverse();break;
default: for(var i = items.length - 1;i > 0;i--){var j = Math.floor(Math.random()*(i + 1)),x = items[i];items[i]= items[j];items[j]= x;}
}
if(op.numerar)items = items.map(function(x,i){return(i + 1)+ '. ' + x;});
return{salida: items.join(sep.sal),filas:[TH.fila('elementos','Elementos en el resultado',items.length,'n0'),TH.fila('quitados','Elementos eliminados',antes - items.length,'n0')]};
}
});
});
})();
