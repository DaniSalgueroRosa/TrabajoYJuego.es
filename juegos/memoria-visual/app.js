(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('mv');
if(!raiz)return;
var VIDAS = 3,NIVELES =[[0,'Principiante'],[4,'Atento'],[7,'Buena memoria'],[10,'Memoria de elefante'],[13,'Memoria prodigiosa']];
var sesion = TYJ.Sesion(null,{}),e,ui,timers =[];
function esperar(ms,f){timers.push(setTimeout(f,ms));}
function limpiarTimers(){timers.forEach(clearTimeout);timers =[];}
function celdasDe(nivel){return Math.min(nivel + 2,18);}
function ladoDe(celdas){return celdas <= 5 ? 3 :(celdas <= 9 ? 4 :(celdas <= 14 ? 5 : 6));}
function inicio(){
limpiarTimers();
TYJ.vaciar(raiz);
var est = h('div');
raiz.appendChild(h('p',{class: 'mensaje'},'Memoriza las casillas que se iluminan y márcalas cuando se apaguen. Tienes 3 vidas.'));
raiz.appendChild(h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro',type: 'button',onclick: empezar},'Empezar')));
raiz.appendChild(est);sesion.montar(est);
}
function empezar(){
e ={nivel: 1,vidas: VIDAS,puntos: 0,fase: 'espera',patron:[],marcadas:{},lado: 3};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['nivel','Nivel',1],['vidas','Vidas',VIDAS],['puntos','Puntos',0]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
ui.tablero = h('div',{class: 'mv-tablero',role: 'group','aria-label': 'Casillas'});
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,ui.msg,ui.tablero,ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
nivel();
}
function nivel(){
var n = celdasDe(e.nivel),lado = ladoDe(n),total = lado * lado;
e.lado = lado;e.marcadas ={};e.aciertos = 0;
e.patron = U.muestra(Array.apply(null,{length: total}).map(function(_,i){return i;}),n);
ui.hud.poner('nivel',e.nivel);ui.hud.poner('vidas',e.vidas,e.vidas === 1);ui.hud.poner('puntos',e.puntos);
pintar();e.fase = 'mirar';
ui.msg.textContent = 'Memoriza ' + n + ' casillas…';
esperar(900,function(){
iluminar(true);
esperar(1000 + 250 * n,function(){iluminar(false);e.fase = 'jugar';ui.msg.textContent = 'Ahora márcalas: faltan ' + n + '.';TYJ.anunciar(ui.msg.textContent);});
});
}
function pintar(){
TYJ.vaciar(ui.tablero);
ui.tablero.style.gridTemplateColumns = 'repeat(' + e.lado + ', minmax(0, 1fr))';
ui.tablero.setAttribute('data-lado',e.lado);
for(var i = 0;i < e.lado * e.lado;i++){
(function(i){
ui.tablero.appendChild(h('button',{class: 'mv-celda',type: 'button','data-i': i,'aria-label': 'Casilla fila ' +(Math.floor(i / e.lado)+ 1)+ ', columna ' +(i % e.lado + 1),
onclick: function(){marcar(i);}}));
})(i);
}
}
function celda(i){return ui.tablero.children[i];}
function iluminar(si){e.patron.forEach(function(i){celda(i).classList.toggle('mv-celda--luz',si);});}
function marcar(i){
if(e.fase !== 'jugar' || e.marcadas[i])return;
var c = celda(i),acierto = e.patron.indexOf(i)>= 0;
e.marcadas[i]= true;
if(acierto){
c.classList.add('mv-celda--ok');e.aciertos++;
var faltan = e.patron.length - e.aciertos;
if(faltan === 0)return superado();
ui.msg.textContent = 'Faltan ' + faltan + '.';
}else{
c.classList.add('mv-celda--mal');e.vidas--;ui.hud.poner('vidas',e.vidas,e.vidas === 1);
e.fase = 'revisar';
e.patron.forEach(function(j){if(!e.marcadas[j])celda(j).classList.add('mv-celda--mostrar');});
TYJ.anunciar('Fallo. Te quedan ' + e.vidas + ' vidas.');
if(e.vidas <= 0){ui.msg.textContent = 'Fallo. Se acabaron las vidas.';esperar(1300,fin);return;}
ui.msg.textContent = 'Fallo. Mira dónde estaban: repites el nivel con otro patrón.';
esperar(1800,nivel);
}
}
function superado(){
e.fase = 'revisar';
e.puntos += 10 * e.patron.length;ui.hud.poner('puntos',e.puntos);
ui.msg.textContent = '¡Nivel ' + e.nivel + ' superado!';ui.msg.className = 'mensaje mensaje--ok';
TYJ.anunciar(ui.msg.textContent);
e.nivel++;
esperar(900,function(){ui.msg.className = 'mensaje';nivel();});
}
function fin(){
e.fase = 'fin';
var alcanzado = e.nivel - 1;
sesion.registrar(e.puntos);
Array.prototype.forEach.call(ui.tablero.children,function(b){b.disabled = true;});
ui.msg.textContent = '';
var cont = h('div');ui.final.appendChild(cont);
TYJ.final(cont,{titulo: 'Fin de la partida',puntos: e.puntos,unidad: 'puntos',nivel: U.nivel(alcanzado,NIVELES),
detalles:['Nivel más alto superado: ' + alcanzado],compartir: 'Memoria visual: he superado el nivel ' + alcanzado + ' y he sumado ' + e.puntos + ' puntos. ¿Me ganas?',
textoRepetir: 'Jugar otra vez',alRepetir: empezar});
ui.final.scrollIntoView({block: 'nearest'});
}
inicio();
})();
