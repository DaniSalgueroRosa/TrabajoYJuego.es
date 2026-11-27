(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('an');
if(!raiz)return;
var LARGOS =[4,4,4,5,5,5,6,6,7,7];
var banco = null,firmas ={},usadas ={};
function firma(p){return U.letras(p).sort().join('');}
function preparar(json){
banco = json.longitudes;
Object.keys(banco).forEach(function(n){
firmas[n]={};
banco[n].soluciones.concat(banco[n].validas).forEach(function(p){var f = firma(p);(firmas[n][f]= firmas[n][f]||[]).indexOf(p)< 0 && firmas[n][f].push(p);});
});
}
function conLasLetras(palabra,n){
var propias = firmas[n][firma(palabra)],vistas ={},todas =[];
propias.forEach(function(p){vistas[U.norm(p)]= true;todas.push(p);});
TYJ.diccionario.anagramas(U.letras(palabra)).forEach(function(p){if(!vistas[p]){vistas[p]= true;todas.push(p);}});
return todas;
}
function desordenar(palabra,todas){
var base = U.letras(palabra),validas ={};
todas.forEach(function(p){validas[U.letras(p).join('')]= true;});
var mezcla;
for(var i = 0;i < 60;i++){mezcla = U.barajar(base);if(!validas[mezcla.join('')])return mezcla;}
return mezcla;
}
function robar(n){
var lista = banco[n].soluciones.filter(function(p){return !usadas[p];});
var p = U.elegir(lista.length ? lista : banco[n].soluciones);
usadas[p]= true;
return p;
}
function arrancar(){
var diccionario = TYJ.diccionario.cargar().catch(function(){});
TYJ.datos('datos/palabras.json').then(function(json){
preparar(json);
return diccionario;
}).then(function(){
TYJ.Rondas(raiz,{
titulo: 'Anagramas',
intro: 'Te damos las letras desordenadas de una palabra: ordénalas y escribe la palabra. Son diez rondas que empiezan con palabras de 4 letras y acaban con palabras de 7, y tienes 40 segundos para cada una. Vale cualquier palabra que use exactamente esas letras.',
rondas: 10,segundos: 40,
niveles:[[0,'Revuelto'],[400,'Ordenado'],[800,'Descifrador'],[1200,'Maestro de las letras'],[1600,'Genio de las palabras']],
alIniciar: function(){usadas ={};},
siguiente: function(k){
var n = LARGOS[k],palabra = robar(n),todas = conLasLetras(palabra,n),letras = desordenar(palabra,todas);
var aceptadas =[palabra].concat(todas.filter(function(p){return p !== palabra;}));
var cuerpo = h('div',{class: 'an-letras',role: 'img','aria-label': 'Letras desordenadas: ' + letras.join(', ')},
letras.map(function(l){return h('span',{class: 'an-letra','aria-hidden': 'true'},l.toUpperCase());}));
cuerpo.setAttribute('data-letras',letras.join(''));
return{enunciado: 'Forma una palabra de ' + n + ' letras',cuerpo: cuerpo,aceptadas: aceptadas,exacta: true,placeholder: 'Escribe la palabra',
explicacion: aceptadas.length > 1 ? 'También valen: ' + aceptadas.slice(1,9).join(', ')+(aceptadas.length > 9 ? ' y otras ' +(aceptadas.length - 9): '')+ '.' : 'Las letras ' + letras.join(' ').toUpperCase()+ ' forman «' + palabra + '».',etiqueta: letras.join('').toUpperCase()};
},
puntuar: function(r,acierto,restante,est){return Math.round(100 + 50 * restante / 40 + Math.min(est.racha,5)* 10);},
compartir: function(est,nivel){return 'Anagramas · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
