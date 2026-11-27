(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('oh');
if(!raiz)return;
var RONDAS = 6,N = 5,NIVELES =[[0,'Aprendiz'],[150,'Estudiante'],[250,'Historiador'],[340,'Catedrático'],[400,'Cronista mayor']];
var conjuntos =[],sesion = TYJ.Sesion(null,{}),e,ui;
function anio(a){return a < 0 ? Math.abs(a)+ ' a. C.' : String(a);}
function empezar(){
var temas = U.muestra(conjuntos,RONDAS);
e ={ronda: 0,puntos: 0,aciertos: 0,temas: temas};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda','1 de ' + RONDAS],['puntos','Puntos',0]]);
ui.cuerpo = h('div',{class: 'oh-cuerpo'});
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,ui.cuerpo,ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
ronda();
}
function ronda(){
var tema = e.temas[e.ronda],hechos = U.muestra(tema.e,N);
var orden = hechos.slice().sort(function(a,b){return a.a - b.a;});
var mezcla = U.barajar(hechos),intentos = 0;
while(mezcla.every(function(x,i){return x === orden[i];})&& intentos++ < 20)mezcla = U.barajar(hechos);
e.actual ={tema: tema,lista: mezcla,orden: orden,comprobada: false};
ui.hud.poner('ronda',(e.ronda + 1)+ ' de ' + RONDAS);
pintar();
}
function mover(i,d){
var l = e.actual.lista,j = i + d;
if(e.actual.comprobada || j < 0 || j >= l.length)return;
var t = l[i];l[i]= l[j];l[j]= t;
pintar(j,d);
TYJ.anunciar('«' + t.n + '» ahora está en la posición ' +(j + 1)+ ' de ' + l.length);
}
function pintar(foco,dir){
var A = e.actual;
TYJ.vaciar(ui.cuerpo);
ui.cuerpo.appendChild(h('p',{class: 'oh-tema'},'Tema: ',h('strong',{texto: A.tema.t})));
if(!A.comprobada)ui.cuerpo.appendChild(h('p',{class: 'mensaje'},'Ordena del más antiguo (arriba) al más reciente (abajo).'));
var ol = h('ol',{class: 'oh-lista'});
A.lista.forEach(function(x,i){
var correcto = A.comprobada && A.orden[i]=== x;
var li = h('li',{class: 'oh-ficha' +(A.comprobada ?(correcto ? ' oh-ficha--ok' : ' oh-ficha--mal'): '')},
h('span',{class: 'oh-pos',texto: String(i + 1)}),
h('span',{class: 'oh-texto'},x.n,A.comprobada ? h('span',{class: 'oh-anio',texto: ' · ' + anio(x.a)+(correcto ? ' ✓' : ' ✕')}): null),
A.comprobada ? null : h('span',{class: 'oh-mover'},
h('button',{class: 'boton-retro boton-retro--chico',type: 'button','aria-label': 'Subir: ' + x.n,disabled: i === 0,onclick: function(){mover(i,-1);}},'▲'),
h('button',{class: 'boton-retro boton-retro--chico',type: 'button','aria-label': 'Bajar: ' + x.n,disabled: i === A.lista.length - 1,onclick: function(){mover(i,1);}},'▼')));
ol.appendChild(li);
});
ui.cuerpo.appendChild(ol);
if(!A.comprobada){
ui.cuerpo.appendChild(h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro',type: 'button',onclick: comprobar},'Comprobar')));
if(foco != null){var b = ol.children[foco].querySelectorAll('button');var k = dir > 0 ? 1 : 0;if(b[k]&& !b[k].disabled)b[k].focus();else(b[1 - k]|| b[0]).focus();}
}
}
function comprobar(){
var A = e.actual;A.comprobada = true;
var bien = A.lista.filter(function(x,i){return A.orden[i]=== x;}).length;
var pts = bien * 10 +(bien === N ? 20 : 0);
e.puntos += pts;e.aciertos += bien;ui.hud.poner('puntos',e.puntos);
pintar();
var ultima = e.ronda === RONDAS - 1;
ui.cuerpo.insertBefore(h('p',{class: 'mensaje ' +(bien === N ? 'mensaje--ok' : ''),role: 'status'},bien === N ? '¡Perfecto! +' + pts + ' puntos.' : bien + ' de ' + N + ' en su sitio: +' + pts + ' puntos.'),ui.cuerpo.querySelector('.oh-lista'));
ui.cuerpo.appendChild(h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(ultima)fin();else{e.ronda++;ronda();}}},ultima ? 'Ver resultado' : 'Siguiente ronda')));
TYJ.anunciar(bien + ' de ' + N + ' hechos en su sitio.');
}
function fin(){
sesion.registrar(e.puntos);
TYJ.vaciar(ui.cuerpo);
var cont = h('div');ui.final.appendChild(cont);
TYJ.final(cont,{titulo: 'Fin de la partida',puntos: e.puntos,unidad: 'puntos de 420',nivel: U.nivel(e.puntos,NIVELES),
detalles:['Hechos bien colocados: ' + e.aciertos + ' de ' +(RONDAS * N)],
compartir: 'Ordena la historia: ' + e.puntos + ' de 420 puntos (' + e.aciertos + '/' +(RONDAS * N)+ ' hechos en su sitio).',textoRepetir: 'Jugar otra vez',alRepetir: empezar});
}
function arrancar(){
TYJ.datos('ordena-la-historia/cronologias.json').then(function(j){conjuntos = j.conjuntos;empezar();}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
