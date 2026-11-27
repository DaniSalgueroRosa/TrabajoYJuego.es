(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('qps');
if(!raiz)return;
var banco =[],mazo =[];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function arrancar(){
TYJ.datos('que-palabra-soy/palabras.json').then(function(json){
banco = json.palabras;
TYJ.Rondas(raiz,{
titulo: '¿Qué palabra soy?',
intro: 'Una palabra se describe a sí misma. Escribe cuál es antes de que se acabe el tiempo. Diez adivinanzas, 30 segundos cada una.',
rondas: 10,segundos: 30,
niveles:[[0,'Despistado'],[500,'Curioso'],[800,'Agudo'],[1100,'Ingenioso'],[1400,'Maestro del enigma']],
siguiente: function(){
var q = robar(),pista = h('p',{class: 'texto-suave',role: 'status'});
var r ={enunciado: q.d,aceptadas: q.r,explicacion: 'Era «' + q.r[0]+ '». ' + q.e,etiqueta: q.d,placeholder: 'Una palabra'};
var boton = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){
if(boton.disabled)return;
boton.disabled = true;r.puntosBase = 60;
var p = q.r[0];
pista.textContent = 'Pista: empieza por «' + p.charAt(0).toUpperCase()+ '» y tiene ' + p.length + ' letras. Esta ronda vale 60 puntos.';
var campo = document.getElementById('rondas-respuesta');if(campo)campo.focus();
}},'Pista (−40 puntos)');
r.cuerpo = h('div',{class: 'fila'},boton,pista);
return r;
},
compartir: function(est,nivel){return '¿Qué palabra soy? · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/10 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
