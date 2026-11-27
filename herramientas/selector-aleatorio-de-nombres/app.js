(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/azar.js').then(function(){
var A = TH.azar,cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
function lineas(t){return t.split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);}
function unicos(l){var vistos ={};return l.filter(function(x){var k = x.toLocaleLowerCase('es');if(vistos[k])return false;vistos[k]= true;return true;});}
var forzar = true,clave = '',elegidos =[];
TH.texto(raiz,{
entrada:{etiqueta: 'Lista de nombres (uno por línea)',ph: 'Ana\nLuis\nMarta\nPablo',ejemplo: 'Ana\nLuis\nMarta\nPablo\nElena\nJorge\nLucía'},
salida:{etiqueta: 'Elegidos'},
filas: 8,
botones:[{texto: 'Elegir de nuevo',accion: function(api){forzar = true;api.actualizar();}}],
opciones:[
{id: 'cuantos',etiqueta: 'Cuántos elegir',valor: 1,entero: true},
{id: 'repetir',tipo: 'check',etiqueta: 'Permitir que un mismo nombre salga más de una vez',valor: false},
{id: 'quitar',tipo: 'check',etiqueta: 'Ignorar los nombres repetidos de la lista',valor: false},
{id: 'numerar',tipo: 'check',etiqueta: 'Numerar los elegidos',valor: false}
],
procesar: function(t,op){
var l = lineas(t),n = op.cuantos;
if(!l.length)return{salida: '',avisos:['Escribe o pega los nombres, uno por línea, y aquí aparecerá el elegido.']};
if(op.quitar)l = unicos(l);
if(!(n >= 1)|| n !== Math.floor(n))return{salida: '',avisos:['Indica cuántos nombres quieres elegir con un número entero de 1 en adelante.']};
if(!op.repetir && n > l.length)return{salida: '',filas:[TH.fila('total','Nombres en la lista',l.length,'n0')],avisos:['Quieres elegir ' + n + ' pero la lista solo tiene ' + l.length +(l.length === 1 ? ' nombre' : ' nombres')+ '. Añade más nombres o baja la cantidad.']};
if(n > 10000)return{salida: '',avisos:['Se pueden elegir como mucho 10.000 nombres de una vez.']};
var k =[l.join('\u0001'),n,op.repetir].join('|');
if(forzar || k !== clave){
elegidos = op.repetir ? Array.apply(null,Array(n)).map(function(){return A.elegir(l);}): A.muestra(l,n);
clave = k;forzar = false;
}
return{salida: elegidos.map(function(x,i){return op.numerar ?(i + 1)+ '. ' + x : x;}).join('\n'),
filas:[TH.fila('total','Nombres en la lista',l.length,'n0'),TH.fila('elegidos','Elegidos',elegidos.length,'n0')]};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
