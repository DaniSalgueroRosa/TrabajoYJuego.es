(function(){
'use strict';
TH.alCargar(function(raiz){
TH.texto(raiz,{
entrada:{etiqueta: 'Pega aquí el texto que quieres limpiar',ph: 'Pega aquí tu texto…',ejemplo: '  Hola   mundo ,  esto  es   una prueba .  \n\n\n\n   Otra   línea con  tabulaciones\t\ty espacios  raros  '},
salida:{etiqueta: 'Texto limpio'},
opciones:[
{id: 'dobles',tipo: 'check',etiqueta: 'Convertir varios espacios seguidos en uno',valor: true},
{id: 'bordes',tipo: 'check',etiqueta: 'Quitar los espacios del principio y del final de cada línea',valor: true},
{id: 'vacias',tipo: 'check',etiqueta: 'Dejar como máximo una línea en blanco seguida',valor: true},
{id: 'signos',tipo: 'check',etiqueta: 'Quitar el espacio antes de , . ; : ! ? y después de ¿ ¡ (',valor: true},
{id: 'raros',tipo: 'check',etiqueta: 'Cambiar tabulaciones y espacios especiales por espacios normales',valor: true},
{id: 'tras',tipo: 'check',etiqueta: 'Añadir el espacio que falta tras , ; y tras un punto seguido de mayúscula',valor: false},
{id: 'unir',tipo: 'check',etiqueta: 'Unir todo en un solo párrafo (quitar los saltos de línea)',valor: false}
],
descargar:{nombre: 'texto-limpio.txt'},
procesar: function(t,op){
var s = t.replace(/\r\n?/g,'\n');
s = s.replace(/[​⁠﻿]/g,'');
if(op.raros)s = s.replace(/[\t   -   　]/g,' ');
if(op.bordes)s = s.split('\n').map(function(l){return l.replace(/^[ \t]+|[ \t]+$/g,'');}).join('\n');
if(op.dobles)s = s.replace(/(\S)[ \t]{2,}/g,'$1 ');
if(op.signos)s = s.replace(/[ \t]+([,.;:!?)])/g,'$1').replace(/([¿¡(])[ \t]+/g,'$1');
if(op.tras)s = s.replace(/([\p{L}\p{N}])([,;])(?=[\p{L}])/gu,'$1$2 ').replace(/(\p{Ll})\.(?=\p{Lu})/gu,'$1. ');
if(op.vacias)s = s.split('\n').map(function(l){return /^\s*$/.test(l)? '' : l;}).join('\n').replace(/\n{3,}/g,'\n\n');
if(op.unir)s = s.replace(/\s*\n\s*/g,' ');
if(op.bordes)s = s.replace(/^\s+|\s+$/g,'');
var dif = t.length - s.length;
return{salida: s,filas:[TH.fila('quitados',dif >= 0 ? 'Caracteres eliminados' : 'Caracteres añadidos',Math.abs(dif),'n0')]};
}
});
});
})();
