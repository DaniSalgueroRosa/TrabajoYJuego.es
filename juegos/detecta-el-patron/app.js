(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util;
var raiz = document.getElementById('dep');
if(!raiz)return;
var ALFABETO = Array.from('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ');
var PRIMOS =[2,3,5,7,11,13,17,19,23,29,31,37,41];
var NIVEL1 =[
function(){var a = U.entre(2,30),d = U.entre(2,9),s =[];for(var i = 0;i < 6;i++)s.push(a + d * i);return{serie: s.slice(0,5),sig: s[5],regla: 'Sumas ' + d + ' cada vez.',cerca:[d - 1,d + 1]};},
function(){var a = U.entre(1,5),r = U.elegir([2,3]),s =[];for(var i = 0;i < 6;i++)s.push(a * Math.pow(r,i));return{serie: s.slice(0,5),sig: s[5],regla: 'Multiplicas por ' + r + ' cada vez.',cerca:[]};},
function(){var a = U.entre(60,150),d = U.entre(3,9),s =[];for(var i = 0;i < 6;i++)s.push(a - d * i);return{serie: s.slice(0,5),sig: s[5],regla: 'Restas ' + d + ' cada vez.',cerca:[]};}
];
var NIVEL2 =[
function(){var o = U.entre(1,4),s =[];for(var i = 0;i < 6;i++)s.push(Math.pow(i + o,2));return{serie: s.slice(0,5),sig: s[5],regla: 'Son los cuadrados de ' +(o)+ ', ' +(o + 1)+ ', ' +(o + 2)+ '…',cerca:[]};},
function(){var s =[],t = 0,o = U.entre(0,2);for(var i = 1;i <= 8;i++){t += i;s.push(t);}s = s.slice(o);return{serie: s.slice(0,5),sig: s[5],regla: 'Números triangulares: se suma 1, luego 2, luego 3…',cerca:[]};},
function(){var a = U.entre(1,9),d = 1,s =[a];for(var i = 0;i < 5;i++){s.push(s[s.length - 1]+ d + i);}return{serie: s.slice(0,5),sig: s[5],regla: 'La suma aumenta de uno en uno: +1, +2, +3, +4, +5…',cerca:[]};},
function(){var s =[],a = U.entre(1,4),b = U.entre(5,9);for(var i = 0;i < 3;i++){s.push(a + i * 2);s.push(b * Math.pow(2,i));}return{serie: s.slice(0,5),sig: s[5],regla: 'Dos series entrelazadas: una suma 2 y la otra multiplica por 2.',cerca:[]};}
];
var NIVEL3 =[
function(){var a = U.entre(1,4),b = U.entre(2,5),s =[a,b];for(var i = 2;i < 6;i++)s.push(s[i - 1]+ s[i - 2]);return{serie: s.slice(0,5),sig: s[5],regla: 'Cada término es la suma de los dos anteriores.',cerca:[]};},
function(){var o = U.entre(0,4),s = PRIMOS.slice(o,o + 6);return{serie: s.slice(0,5),sig: s[5],regla: 'Son números primos consecutivos.',cerca:[]};},
function(){var a = U.entre(1,5),s =[a];for(var i = 0;i < 5;i++)s.push(s[i]* 2 + 1);return{serie: s.slice(0,5),sig: s[5],regla: 'Cada término es el doble del anterior más 1.',cerca:[]};},
function(){var s =[],o = U.entre(1,3);for(var i = 0;i < 6;i++)s.push(Math.pow(i + o,3));return{serie: s.slice(0,5),sig: s[5],regla: 'Son cubos perfectos: ' + o + '³, ' +(o + 1)+ '³, ' +(o + 2)+ '³…',cerca:[]};}
];
function letras(){
var paso = U.entre(2,4),ini = U.entre(0,26 - 5 * paso),s =[];
for(var i = 0;i < 6;i++)s.push(ALFABETO[ini + paso * i]);
return{serie: s.slice(0,5),sig: s[5],regla: 'Saltas ' + paso + ' letras cada vez en el alfabeto español.',letras: true};
}
function serie(n){
var g = n < 3 ? U.elegir(NIVEL1): n < 6 ? U.elegir(NIVEL2): n < 9 ? U.elegir(NIVEL3): null;
return g ? g(): letras();
}
function opciones(s){
var cands =[],sig = s.sig,esLetra = !!s.letras;
if(esLetra){
var i = ALFABETO.indexOf(sig);
[-1,1,2,-2,3,-3].forEach(function(d){var l = ALFABETO[i + d];if(l && l !== sig)cands.push(l);});
}else{
var ult = s.serie[s.serie.length - 1],dif = sig - ult;
[sig + 1,sig - 1,sig + 2,sig + ult,ult + dif + 1,ult * 2,sig + 10,sig - 2].forEach(function(v){if(v > 0 && v !== sig && cands.indexOf(v)< 0)cands.push(v);});
}
var falsas = U.barajar(cands).slice(0,3);
return U.barajar([sig].concat(falsas)).map(String);
}
TYJ.Rondas(raiz,{
titulo: 'Detecta el patrón',
intro: 'Cada serie esconde una regla. Descubre cuál es y elige el elemento que continúa la serie. Diez rondas de 25 segundos que se van complicando.',
rondas: 10,segundos: 25,
niveles:[[0,'Ciego'],[500,'Observador'],[800,'Analítico'],[1100,'Lógico'],[1400,'Mente brillante']],
siguiente: function(n){
var s = serie(n),ops = opciones(s);
return{enunciado: s.serie.join(',  ')+ ',  ?',opciones: ops,correcta: ops.indexOf(String(s.sig)),explicacion: s.regla + ' Seguía: ' + s.sig + '.',etiqueta: s.serie.join(', ')+ ', ?'};
},
compartir: function(est,nivel){return 'Detecta el patrón · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
})();
