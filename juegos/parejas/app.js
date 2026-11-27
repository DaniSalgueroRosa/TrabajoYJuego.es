(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('pj');
if(!raiz)return;
var NS = 'http://www.w3.org/2000/svg';
var NIVELES ={facil:{nombre: 'Fácil (6 parejas)',pares: 6},medio:{nombre: 'Medio (8 parejas)',pares: 8},dificil:{nombre: 'Difícil (12 parejas)',pares: 12}};
function estrella(cx,cy,R){
var pts =[];
for(var i = 0;i < 10;i++){var a =(-90 + i * 36)* Math.PI / 180,r = i % 2 ? R * 0.4 : R;pts.push((cx + r * Math.cos(a)).toFixed(2)+ ',' +(cy + r * Math.sin(a)).toFixed(2));}
return pts.join(' ');
}
var FIGURAS =[
{n: 'círculo',c: '#E6F14A',t: 'circle',a:{cx: 12,cy: 12,r: 9}},
{n: 'cuadrado',c: '#FF5A7D',t: 'rect',a:{x: 4,y: 4,width: 16,height: 16}},
{n: 'triángulo',c: '#6EC1FF',t: 'polygon',a:{points: '12,3 22,21 2,21'}},
{n: 'rombo',c: '#8FD694',t: 'polygon',a:{points: '12,2 22,12 12,22 2,12'}},
{n: 'estrella',c: '#FFB86B',t: 'polygon',a:{points: estrella(12,12.5,10.5)}},
{n: 'cruz',c: '#B9A0F5',t: 'polygon',a:{points: '9,2 15,2 15,9 22,9 22,15 15,15 15,22 9,22 9,15 2,15 2,9 9,9'}},
{n: 'corazón',c: '#FF8A8A',t: 'path',a:{d: 'M12 21C3 14 2 9 5 6C8 3 11 5 12 8C13 5 16 3 19 6C22 9 21 14 12 21Z'}},
{n: 'hexágono',c: '#5ED6D0',t: 'polygon',a:{points: '12,2 20.7,7 20.7,17 12,22 3.3,17 3.3,7'}},
{n: 'luna',c: '#FFD25A',t: 'path',a:{d: 'M15 3A9.5 9.5 0 1 0 21 16A7.5 7.5 0 0 1 15 3Z'}},
{n: 'rayo',c: '#F28CC0',t: 'polygon',a:{points: '14,2 5,13 11,13 9,22 19,10 13,10'}},
{n: 'gota',c: '#C6E86B',t: 'path',a:{d: 'M12 2C12 2 5 10 5 15A7 7 0 0 0 19 15C19 10 12 2 12 2Z'}},
{n: 'flecha',c: '#EAF2EE',t: 'polygon',a:{points: '12,3 21,12 15,12 15,21 9,21 9,12 3,12'}}
];
var sesion = TYJ.Sesion(null,{victorias: true,etiquetaMejor: 'Mejor puntuación: '});
var nivel = 'medio',g = null,ui = null,reloj = null,espera = null;
function figura(f){
var s = document.createElementNS(NS,'svg');
s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');s.setAttribute('class','pj-figura');
var e = document.createElementNS(NS,f.t);
Object.keys(f.a).forEach(function(k){e.setAttribute(k,f.a[k]);});
e.setAttribute('fill',f.c);s.appendChild(e);
return s;
}
function formato(s){return Math.floor(s / 60)+ ':' +('0' +(s % 60)).slice(-2);}
function nueva(){
clearInterval(reloj);clearTimeout(espera);
var n = NIVELES[nivel].pares,elegidas = U.muestra(FIGURAS,n),mazo = U.barajar(elegidas.concat(elegidas));
g ={cartas: mazo.map(function(f){return{f: f,estado: 0};}),abiertas:[],bloqueo: false,movs: 0,pares: 0,total: n,t0: 0,segundos: 0,fin: false};
montar();pintar();
TYJ.anunciar('Nueva partida con ' + n + ' parejas. ' +(2 * n)+ ' cartas boca abajo.');
}
function montar(){
TYJ.vaciar(raiz);
ui ={cartas:[]};
ui.niveles = h('div',{class: 'fila',role: 'group','aria-label': 'Tamaño del tablero'});
Object.keys(NIVELES).forEach(function(k){
ui.niveles.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(k === nivel),onclick: function(){nivel = k;nueva();}},NIVELES[k].nombre));
});
ui.hud = TYJ.hud([['movs','Intentos',0],['pares','Parejas','0 / ' + g.total],['tiempo','Tiempo','0:00']]);
ui.tablero = h('div',{class: 'pj-tablero',role: 'group','aria-label': 'Cartas'});
g.cartas.forEach(function(_,i){
var b = h('button',{class: 'pj-carta',type: 'button',onclick: function(){girar(i);}});
ui.cartas.push(b);ui.tablero.appendChild(b);
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
ui.final = h('div');ui.est = h('div');
[ui.niveles,ui.hud.nodo,ui.tablero,ui.msg,h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro boton-retro--chico',type: 'button',onclick: nueva},'Barajar de nuevo')),ui.final,ui.est]
.forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function pintar(){
g.cartas.forEach(function(c,i){
var b = ui.cartas[i];
TYJ.vaciar(b);
b.className = 'pj-carta' +(c.estado === 1 ? ' pj-abierta' : '')+(c.estado === 2 ? ' pj-par' : '');
b.setAttribute('data-estado',String(c.estado));
if(c.estado === 0){b.setAttribute('aria-label','Carta ' +(i + 1)+ ', boca abajo');b.appendChild(h('span',{class: 'pj-dorso','aria-hidden': 'true'}));}
else{b.setAttribute('aria-label','Carta ' +(i + 1)+ ': ' + c.f.n +(c.estado === 2 ? ', pareja encontrada' : ''));b.appendChild(figura(c.f));}
b.disabled = c.estado === 2;
});
ui.hud.poner('movs',g.movs);ui.hud.poner('pares',g.pares + ' / ' + g.total);
}
function girar(i){
var c = g.cartas[i];
if(g.bloqueo || g.fin || c.estado !== 0)return;
if(!g.t0){
g.t0 = performance.now();
reloj = setInterval(function(){g.segundos = Math.floor((performance.now()- g.t0)/ 1000);ui.hud.poner('tiempo',formato(g.segundos));},500);
}
c.estado = 1;g.abiertas.push(i);
if(g.abiertas.length < 2){pintar();return;}
g.movs++;
var a = g.cartas[g.abiertas[0]],b = g.cartas[g.abiertas[1]];
if(a.f === b.f){
a.estado = 2;b.estado = 2;g.pares++;g.abiertas =[];
pintar();
ui.msg.textContent = '¡Pareja de ' + a.f.n + 's!';ui.msg.className = 'mensaje mensaje--ok';
TYJ.anunciar('Pareja de ' + a.f.n + 's. ' + g.pares + ' de ' + g.total + '.');
if(g.pares === g.total)ganar();
}else{
g.bloqueo = true;pintar();
ui.msg.textContent = 'No coinciden: ' + a.f.n + ' y ' + b.f.n + '.';ui.msg.className = 'mensaje';
espera = setTimeout(function(){a.estado = 0;b.estado = 0;g.abiertas =[];g.bloqueo = false;pintar();},850);
}
}
function ganar(){
g.fin = true;clearInterval(reloj);
g.segundos = Math.floor((performance.now()- g.t0)/ 1000);ui.hud.poner('tiempo',formato(g.segundos));
var puntos = Math.max(100,g.total * 200 -(g.movs - g.total)* 25 - g.segundos * 2);
sesion.registrar(puntos,true);
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Todas las parejas!',puntos: puntos,unidad: 'puntos',nivel: NIVELES[nivel].nombre,
detalles:['Intentos: ' + g.movs + ' (el mínimo posible es ' + g.total + ')','Tiempo: ' + formato(g.segundos)],
compartir: 'Parejas (' + g.total + ' parejas): ' + g.movs + ' intentos en ' + formato(g.segundos)+ '.',textoRepetir: 'Otra partida',alRepetir: nueva});
}
nueva();
})();
