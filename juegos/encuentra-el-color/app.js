(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('col');
if(!raiz)return;
var DURACION = 30,CASTIGO = 3;
var sesion = TYJ.Sesion(null,{victorias: false});
var t = null,ui = null,reloj = null;
function lado(ronda){return Math.min(8,2 + Math.floor(ronda / 2));}
function dif(ronda){return Math.max(3,18 - ronda * 1.1);}
function empezar(){
clearInterval(reloj);
t ={ronda: 0,fallos: 0,resto: DURACION,fin: false,ultimo: Date.now()};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda','1'],['tiempo','Tiempo',String(DURACION)],['fallos','Fallos','0']]);
ui.tablero = h('div',{class: 'col-tablero',role: 'group','aria-label': 'Casillas: pulsa la que tenga un tono distinto'});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'off',texto: 'Pulsa la casilla de otro tono.'});
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,ui.tablero,ui.msg,ui.final,ui.est].forEach(function(x){raiz.appendChild(x);});
sesion.montar(ui.est);
ronda();
reloj = setInterval(function(){
var ahora = Date.now();t.resto -=(ahora - t.ultimo)/ 1000;t.ultimo = ahora;
pintarTiempo();
if(t.resto <= 0)acabar();
},100);
}
function pintarTiempo(){ui.hud.poner('tiempo',Math.max(0,Math.ceil(t.resto)),t.resto <= 5);}
function ronda(){
var n = lado(t.ronda),tono = U.azar(360),sat = 55 + U.azar(25),luz = 45 + U.azar(15),d = dif(t.ronda),raro = U.azar(n * n);
var signo = luz + d > 92 ? -1 : 1;
TYJ.vaciar(ui.tablero);
ui.tablero.style.gridTemplateColumns = 'repeat(' + n + ', minmax(0, 1fr))';
ui.tablero.style.gridTemplateRows = 'repeat(' + n + ', minmax(0, 1fr))';
for(var i = 0;i < n * n;i++)(function(i){
var b = h('button',{class: 'col-celda',type: 'button','aria-label': 'Casilla ' +(i + 1)+ ' de ' + n * n,onclick: function(){pulsar(i === raro);}});
b.style.backgroundColor = 'hsl(' + tono + ', ' + sat + '%, ' +(i === raro ? luz + signo * d : luz)+ '%)';
ui.tablero.appendChild(b);
})(i);
ui.hud.poner('ronda',t.ronda + 1);
}
function pulsar(acierto){
if(t.fin)return;
if(acierto){t.ronda++;ronda();ui.msg.textContent = '';}
else{t.fallos++;t.resto -= CASTIGO;ui.hud.poner('fallos',t.fallos,true);pintarTiempo();ui.msg.textContent = 'Ese no es: −' + CASTIGO + ' segundos.';if(t.resto <= 0)acabar();}
}
function acabar(){
if(t.fin)return;
clearInterval(reloj);t.fin = true;t.resto = 0;pintarTiempo();
sesion.registrar(t.ronda,null);
TYJ.final(ui.final.appendChild(h('div')),{titulo: 'Se acabó el tiempo',puntos: t.ronda,unidad: t.ronda === 1 ? 'ronda superada' : 'rondas superadas',
detalles:['Fallos: ' + t.fallos + '.','Última cuadrícula: ' + lado(t.ronda)+ '×' + lado(t.ronda)+ '.'],
compartir: 'Test de colores: ' + t.ronda +(t.ronda === 1 ? ' ronda' : ' rondas')+ ' en 30 segundos con ' + t.fallos +(t.fallos === 1 ? ' fallo.' : ' fallos.'),
textoRepetir: 'Jugar otra vez',alRepetir: empezar});
ui.tablero.querySelectorAll('button').forEach(function(b){b.disabled = true;});
}
function inicio(){
clearInterval(reloj);
TYJ.vaciar(raiz);
var est = h('div');
raiz.appendChild(h('p',{class: 'mensaje',texto: 'Tienes ' + DURACION + ' segundos para encontrar la casilla de otro tono en cada cuadrícula. Cada fallo resta ' + CASTIGO + ' segundos.'}));
raiz.appendChild(h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro',type: 'button',onclick: empezar},'Empezar')));
raiz.appendChild(est);
sesion.montar(est);
}
inicio();
})();
