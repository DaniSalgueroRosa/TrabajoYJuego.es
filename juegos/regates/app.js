(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('rg');
if(!raiz)return;
var W = 192,H = 256,CARRILES = 5,ANCHO = 32,X0 = 16,YJ = 206;
var NIVELES =[[0,'Cantera'],[150,'Regateador'],[350,'Extremo'],[600,'Crack'],[900,'Pelotero de leyenda']];
var C ={tinta: '#14201C',hondo: '#0B1512',linea: '#3A5249',pizarra: '#2F6B5C',pizarra2: '#28604F',tiza: '#EAF2EE',suave: '#AFC4BB',sandia: '#FF5A7D',limon: '#E6F14A',piel: '#E7B98F',naranja: '#FFB86B'};
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var reducido = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var ui = null,ctx = null,g = null,bucle = false,ultimoTs = 0,alTecla = null;
function carrilX(c){return X0 + c * ANCHO + ANCHO / 2;}
function R(c,x,y,w,hh){ctx.fillStyle = c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(hh)));}
function campo(){
var k,off = reducido ? 0 : g.desplazo % 64;
for(k = -1;k < 5;k++)R(k % 2 ? C.pizarra2 : C.pizarra,0,k * 64 + off,W,64);
R(C.tiza,X0 - 2,0,2,H);R(C.tiza,X0 + CARRILES * ANCHO,0,2,H);
var yy =(reducido ? 0 : g.desplazo * 1)% 64 - 64;
for(;yy < H;yy += 64){R(C.suave,X0 + ANCHO * 1.5,yy + 20,1,8);R(C.suave,X0 + ANCHO * 2.5,yy + 20,1,8);R(C.suave,X0 + ANCHO * 3.5,yy + 20,1,8);}
}
function figura(x,yPies,camisa,pelo,mira){
R(C.hondo,x - 6,yPies - 1,12,2);
R(C.tinta,x - 4,yPies - 7,3,7);R(C.tinta,x + 1,yPies - 7,3,7);
R(C.tinta,x - 5,yPies - 12,11,6);
R(camisa,x - 5,yPies - 20,11,9);R(C.tiza,x - 5,yPies - 17,11,1);
R(C.piel,x - 3,yPies - 26,7,6);R(pelo,x - 3,yPies -(mira ? 27 : 26),7,mira ? 3 : 2);
}
function balon(x,y){R(C.hondo,x - 4,y - 4,8,8);R(C.tiza,x - 3,y - 3,6,6);R(C.tinta,x - 1,y - 1,2,2);}
function dibujar(){
var parpadea = g.invulnerable > 0 && Math.floor(g.invulnerable * 12)% 2 === 0;
campo();
g.defensas.forEach(function(e){
var x = carrilX(e.x);
if(e.aviso > 0 && Math.floor(e.aviso * 14)% 2 === 0)R(C.sandia,x - 3,e.y - 40,6,6);
figura(x,e.y,C.sandia,C.tinta,false);
});
if(!parpadea){figura(carrilX(g.xVista),YJ,C.limon,C.tinta,true);balon(carrilX(g.xVista),YJ + 4);}
for(var v = 0;v < 3;v++){R(v < g.vidas ? C.sandia : C.linea,6 + v * 10,6,7,7);}
}
function empezar(){
g ={x: 2,xVista: 2,vidas: 3,defensas:[],t: 0,metros: 0,regates: 0,puntos: 0,proxima: 0.8,invulnerable: 0,desplazo: 0,pausa: false,fin: false};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['m','Metros','0'],['r','Regates','0'],['pts','Puntos','0'],['v','Vidas','3']]);
ui.lienzo = h('canvas',{class: 'rg-lienzo',width: String(W),height: String(H),role: 'img','aria-label': 'Campo visto desde arriba: tu jugador abajo y los defensas bajando por cinco carriles. Muévete con las flechas, A y D, tocando los lados o con los botones.'});
ctx = ui.lienzo.getContext('2d');
ui.izq = h('button',{class: 'boton-retro rg-boton',type: 'button',id: 'rg-izq','aria-label': 'Mover a la izquierda'},'◀');
ui.der = h('button',{class: 'boton-retro rg-boton',type: 'button',id: 'rg-der','aria-label': 'Mover a la derecha'},'▶');
ui.pausa = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',id: 'rg-pausa'},'Pausa');
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('div',{class: 'rg-escena'},ui.lienzo));
raiz.appendChild(h('div',{class: 'rg-mandos'},ui.izq,ui.pausa,ui.der));
raiz.appendChild(ui.msg);
raiz.appendChild(h('p',{class: 'texto-suave',texto: 'Flechas ← → o A y D; en el móvil, toca la mitad izquierda o derecha del campo. P pausa el juego.'}));
ui.izq.addEventListener('click',function(){mover(-1);});
ui.der.addEventListener('click',function(){mover(1);});
ui.pausa.addEventListener('click',alternarPausa);
ui.lienzo.addEventListener('pointerdown',function(e){var r = ui.lienzo.getBoundingClientRect();mover(e.clientX < r.left + r.width / 2 ? -1 : 1);});
if(alTecla)document.removeEventListener('keydown',alTecla);
alTecla = function(ev){
if(!g || g.fin || !ui.lienzo.isConnected || ev.ctrlKey || ev.metaKey || ev.altKey)return;
var t = ev.target;
if(t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
var k = ev.key;
if(k === 'ArrowLeft' || k === 'a' || k === 'A'){ev.preventDefault();mover(-1);}
else if(k === 'ArrowRight' || k === 'd' || k === 'D'){ev.preventDefault();mover(1);}
else if(k === 'p' || k === 'P'){ev.preventDefault();alternarPausa();}
};
document.addEventListener('keydown',alTecla);
ui.msg.textContent = '¡Adelante! Esquiva a los defensas.';
arrancarBucle();
}
function mover(d){if(!g || g.fin || g.pausa)return;g.x = Math.max(0,Math.min(CARRILES - 1,g.x + d));}
function alternarPausa(){
if(!g || g.fin)return;
g.pausa = !g.pausa;ui.pausa.textContent = g.pausa ? 'Seguir' : 'Pausa';ui.msg.textContent = g.pausa ? 'Juego en pausa.' : '¡Adelante!';
TYJ.anunciar(ui.msg.textContent);
}
function velocidad(){return Math.min(210,78 + g.t * 3.2);}
function actualizar(dt){
g.t += dt;g.desplazo += velocidad()* dt;
g.xVista +=(g.x - g.xVista)* Math.min(1,dt * 18);
if(Math.abs(g.xVista - g.x)< 0.02)g.xVista = g.x;
if(g.invulnerable > 0)g.invulnerable = Math.max(0,g.invulnerable - dt);
var m = Math.floor(g.t * 5);
if(m !== g.metros){g.metros = m;g.puntos = g.metros + g.regates * 10;}
g.proxima -= dt;
if(g.proxima <= 0){
g.defensas.push({x: U.azar(CARRILES),y: -14,zig: g.t > 12 && Math.random()< 0.35,giro: false,aviso: 0});
g.proxima = Math.max(0.42,1.05 - g.t * 0.012);
}
g.defensas.forEach(function(e){
e.y += velocidad()* dt *(e.giro ? 1.05 : 1);
if(e.zig && !e.giro && e.y > 70 && e.y < 74 && !e.avisado){e.avisado = true;e.aviso = 0.5;}
if(e.aviso > 0){e.aviso -= dt;if(e.aviso <= 0){e.x = Math.max(0,Math.min(CARRILES - 1,e.x +(g.x > e.x ? 1 :(g.x < e.x ? -1 :(e.x < 2 ? 1 : -1)))));e.giro = true;}}
if(!e.golpeo && e.x === g.x && Math.abs(e.y - YJ)< 20){
e.golpeo = true;
if(g.invulnerable <= 0){g.vidas--;g.invulnerable = 1.2;ui.msg.textContent = '¡Te han quitado el balón! Te quedan ' + g.vidas +(g.vidas === 1 ? ' vida.' : ' vidas.');TYJ.anunciar(ui.msg.textContent);}
}
if(!e.pasado && e.y > YJ + 22){
e.pasado = true;
if(!e.golpeo && Math.abs(e.x - g.x)=== 1){g.regates++;g.puntos = g.metros + g.regates * 10;ui.msg.textContent = '¡Regate!';}
}
});
g.defensas = g.defensas.filter(function(e){return e.y < H + 30;});
ui.hud.poner('m',U.miles(g.metros));ui.hud.poner('r',String(g.regates));ui.hud.poner('pts',U.miles(g.puntos));ui.hud.poner('v',String(g.vidas),g.vidas <= 1);
if(g.vidas <= 0)terminar();
}
function terminar(){
g.fin = true;bucle = false;
if(alTecla){document.removeEventListener('keydown',alTecla);alTecla = null;}
dibujar();
var total = g.puntos,nivel = U.nivel(total,NIVELES);
sesion.registrar(total);
var cont = h('div');TYJ.vaciar(raiz).appendChild(cont);
TYJ.final(cont,{titulo: 'Fin del partido: ' + nivel,puntos: total,nivel: null,detalles:[U.miles(g.metros)+ ' metros con el balón',g.regates +(g.regates === 1 ? ' regate' : ' regates')],
textoRepetir: 'Jugar otra vez',alRepetir: empezar,compartir: 'Regates · ' + U.miles(total)+ ' puntos · ' + g.metros + ' metros y ' + g.regates + ' regates · ' + nivel});
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function paso(ts){
if(!bucle)return;
var dt = ultimoTs ? Math.min(0.05,(ts - ultimoTs)/ 1000): 0.016;ultimoTs = ts;
if(g && ui.lienzo.isConnected && !g.fin){if(!g.pausa && !document.hidden)actualizar(dt);if(!g.fin)dibujar();}
window.requestAnimationFrame(paso);
}
function arrancarBucle(){if(!bucle){bucle = true;ultimoTs = 0;window.requestAnimationFrame(paso);}}
function inicio(){
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Regates'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Llevas el balón hacia la portería rival y los defensas bajan por cinco carriles. Muévete de un carril a otro para esquivarlos: sumas un metro cada 0,2 segundos y 10 puntos por cada regate. Tienes tres vidas y el juego se acelera.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',id: 'rg-empezar',onclick: empezar},'Empezar')));
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
inicio();
})();
