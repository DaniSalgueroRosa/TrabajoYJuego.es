(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('qj');
if(!raiz)return;
var banco =[],mazo =[];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function arrancar(){
TYJ.datos('que-futbolista-soy/futbolistas.json').then(function(json){
banco = json.futbolistas;
TYJ.Rondas(raiz,{
titulo: '¿Qué futbolista soy?',
intro: 'Cinco pistas, de la más difícil a la más fácil. Si lo adivinas con la primera ganas 100 puntos; cada pista extra resta 20. Ocho rondas de 45 segundos.',
rondas: 8,segundos: 45,ruta: true,
niveles:[[0,'Cantera'],[400,'Suplente'],[700,'Titular'],[950,'Capitán'],[1200,'Leyenda']],
siguiente: function(){
var q = robar(),vistas = 1;
var lista = h('ol',{class: 'qj-pistas','aria-label': 'Pistas'});
var r ={enunciado: 'Pista 1 de 5',aceptadas: q.r,explicacion: 'Era: ' + q.n + '.',etiqueta: 'Pistas: ' + q.p[0]+ '…',placeholder: 'Escribe el nombre del futbolista',puntosBase: 100};
function pintar(){
TYJ.vaciar(lista);
q.p.slice(0,vistas).forEach(function(t,i){lista.appendChild(h('li',{class: i === vistas - 1 ? 'qj-nueva' : ''},t));});
var enun = document.querySelector('.rondas-enunciado');
if(enun)enun.textContent = 'Pista ' + vistas + ' de 5 · la ronda vale ' + r.puntosBase + ' puntos';
}
var mas = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){
if(vistas >= 5)return;
vistas++;r.puntosBase = 120 - vistas * 20;
pintar();TYJ.anunciar('Pista ' + vistas + ': ' + q.p[vistas - 1]);
if(vistas >= 5)mas.disabled = true;
var campo = document.getElementById('rondas-respuesta');if(campo)campo.focus();
}},'Otra pista (−20 puntos)');
r.cuerpo = h('div',{class: 'qj-bloque'},lista,h('div',{class: 'fila'},mas));
setTimeout(pintar,0);
return r;
},
compartir: function(est,nivel){return '¿Qué futbolista soy? · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/8 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
