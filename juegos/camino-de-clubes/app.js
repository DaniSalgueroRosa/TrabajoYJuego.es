(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('cc');
if(!raiz)return;
var banco =[],mazo =[];
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function arrancar(){
TYJ.datos('camino-de-clubes/caminos.json').then(function(json){
banco = json.jugadores;
TYJ.Rondas(raiz,{
titulo: 'Camino de clubes',
intro: 'Te enseño los clubes por los que ha pasado un futbolista, en orden cronológico, y tienes que decir quién es. Si pides la pista (país y posición) la ronda vale 70 puntos en lugar de 100. Ocho rondas de 40 segundos.',
rondas: 8,segundos: 40,ruta: true,
niveles:[[0,'Cantera'],[350,'Ojeador'],[550,'Secretario técnico'],[700,'Director deportivo'],[780,'Enciclopedia del fútbol']],
siguiente: function(){
var q = robar();
var r ={enunciado: '¿Qué futbolista pasó por estos clubes?',aceptadas: q.r,explicacion: 'Era ' + q.n + ' (' + q.p + ').',etiqueta: q.c[0]+ ' → … → ' + q.c[q.c.length - 1],placeholder: 'Escribe el nombre del futbolista',puntosBase: 100};
var lista = h('ol',{class: 'cc-camino','aria-label': 'Clubes en orden cronológico'},q.c.map(function(c){return h('li',{texto: c});}));
var pista = h('p',{class: 'texto-suave',role: 'status'});
var boton = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){
r.puntosBase = 70;boton.disabled = true;
pista.textContent = 'Pista: es ' +(q.pos === 'portero' ? 'un portero' : q.pos === 'defensa' ? 'un defensa' : q.pos === 'centrocampista' ? 'un centrocampista' : 'un delantero')+ ' de ' + q.p + '. La ronda vale 70 puntos.';
TYJ.anunciar(pista.textContent);
var campo = document.getElementById('rondas-respuesta');if(campo)campo.focus();
}},'Pista: país y posición (−30 puntos)');
r.cuerpo = h('div',{class: 'cc-bloque'},lista,h('div',{class: 'fila'},boton),pista);
return r;
},
compartir: function(est,nivel){return 'Camino de clubes · ' + U.miles(est.puntos)+ ' puntos · ' + est.aciertos + '/8 · ' + nivel;}
}).iniciar();
}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
