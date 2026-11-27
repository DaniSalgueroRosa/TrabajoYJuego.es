(function(){
'use strict';
var TYJ = window.TYJ,h = TYJ.h;
var raiz = document.getElementById('rq');
if(!raiz)return;
var W = 480,H = 300,PW = 10,PH = 60,BS = 10,XJ = 16,XC = W - 16 - PW,META = 7,PASO = 1 / 120,V0 = 250,VMAX = 520,VJ = 380;
var NIVELES ={1:['Fácil',170,45],2:['Normal',230,25],3:['Difícil',300,10]};
var sesion = TYJ.Sesion(null,{victorias: true,mejor: true,etiquetaMejor: 'Mejor puntuación: ',racha: false});
var nivel = 2,g = null,ui = null,ctx = null,raf = 0,ultimo = 0,tec ={arriba: false,abajo: false,botArriba: false,botAbajo: false};
function limita(v,a,b){return Math.max(a,Math.min(b,v));}
function nueva(){
if(raf)cancelAnimationFrame(raf);
g ={estado: 'espera',yj: H / 2 - PH / 2,yc: H / 2 - PH / 2,b:{x: W / 2 - BS / 2,y: H / 2 - BS / 2,vx: 0,vy: 0,v: V0},pj: 0,pc: 0,acc: 0,error: 0,golpes: 0,espera: 0,hacia: 1,previo: 'juego'};
montar();dibujar();datos();
ultimo = 0;raf = requestAnimationFrame(bucle);
}
function sacar(haciaCpu){
var ang =(Math.random()- 0.5)* 0.8;
g.b.v = V0;g.b.x = W / 2 - BS / 2;g.b.y = H / 2 - BS / 2 +(Math.random()- 0.5)* 80;
g.b.vx =(haciaCpu ? 1 : -1)* Math.cos(ang)* V0;g.b.vy = Math.sin(ang)* V0;
g.error =(Math.random()- 0.5)* 2 * NIVELES[nivel][2];
g.estado = 'juego';
}
function empezar(){
if(g.estado === 'espera'){sacar(true);ui.msg.textContent = '';ui.pausa.textContent = 'Pausa';}
else if(g.estado === 'pausa'){g.estado = 'juego';ui.msg.textContent = '';ui.pausa.textContent = 'Pausa';}
ui.zona.focus({preventScroll: true});
}
function pausar(){
if(g.estado === 'juego'){g.estado = 'pausa';ui.pausa.textContent = 'Seguir';ui.msg.textContent = 'En pausa.';}
else empezar();
}
function bucle(t){
raf = requestAnimationFrame(bucle);
if(!ultimo)ultimo = t;
var dt = Math.min(0.05,(t - ultimo)/ 1000);ultimo = t;
if(g.estado === 'juego'){
g.acc += dt;
while(g.acc >= PASO){paso(PASO);g.acc -= PASO;if(g.estado !== 'juego')break;}
}else if(g.estado === 'saque'){
g.espera -= dt;
if(g.espera <= 0)sacar(g.hacia === 1);
}
dibujar();datos();
}
function rebote(x,yPala,signo){
var b = g.b,rel = limita(((b.y + BS / 2)-(yPala + PH / 2))/(PH / 2),-1,1),ang = rel * 0.85;
b.x = x;b.v = Math.min(VMAX,b.v * 1.06);
b.vx = signo * Math.cos(ang)* b.v;b.vy = Math.sin(ang)* b.v;
if(signo === 1){g.golpes++;g.error =(Math.random()- 0.5)* 2 * NIVELES[nivel][2];}
}
function paso(dt){
var b = g.b,dir =(tec.arriba || tec.botArriba ? -1 : 0)+(tec.abajo || tec.botAbajo ? 1 : 0);
if(dir)g.yj = limita(g.yj + dir * VJ * dt,0,H - PH);
var objetivo = b.vx > 0 ? b.y + BS / 2 + g.error - PH / 2 : H / 2 - PH / 2,d = objetivo - g.yc,m = NIVELES[nivel][1]* dt;
g.yc = limita(g.yc +(Math.abs(d)< m ? d : d > 0 ? m : -m),0,H - PH);
b.x += b.vx * dt;b.y += b.vy * dt;
if(b.y < 0){b.y = 0;b.vy = -b.vy;}
if(b.y > H - BS){b.y = H - BS;b.vy = -b.vy;}
if(b.vx < 0 && b.x <= XJ + PW && b.x + BS >= XJ && b.y + BS >= g.yj && b.y <= g.yj + PH)rebote(XJ + PW,g.yj,1);
else if(b.vx > 0 && b.x + BS >= XC && b.x <= XC + PW && b.y + BS >= g.yc && b.y <= g.yc + PH)rebote(XC - BS,g.yc,-1);
if(b.x + BS < 0)punto(false);else if(b.x > W)punto(true);
}
function punto(yo){
if(yo)g.pj++;else g.pc++;
ui.hud.poner('yo',g.pj);ui.hud.poner('cpu',g.pc);
g.b.vx = 0;g.b.vy = 0;g.b.x = W / 2 - BS / 2;g.b.y = H / 2 - BS / 2;
var t = yo ? 'Punto para ti.' : 'Punto del ordenador.';
if(g.pj >= META || g.pc >= META)return terminar();
t += ' Marcador: ' + g.pj + ' a ' + g.pc + '.';
ui.msg.textContent = t;TYJ.anunciar(t);
g.estado = 'saque';g.espera = 0.9;g.hacia = yo ? 1 : -1;
}
function terminar(){
g.estado = 'fin';
var gana = g.pj > g.pc,puntos =(g.pj * 100 +(gana ? 300 : 0))* nivel;
ui.pausa.disabled = true;ui.empezar.disabled = true;
sesion.registrar(puntos,gana);
ui.msg.textContent = '';
TYJ.final(ui.final.appendChild(h('div')),{titulo: gana ? '¡Has ganado ' + g.pj + ' a ' + g.pc + '!' : 'Ha ganado el ordenador ' + g.pc + ' a ' + g.pj,puntos: puntos,unidad: 'puntos',nivel: 'Nivel ' + NIVELES[nivel][0],
detalles:['Marcador final: ' + g.pj + ' – ' + g.pc,'Golpes a la bola: ' + g.golpes],
compartir: 'Raquetas (' + NIVELES[nivel][0].toLowerCase()+ '): ' +(gana ? 'gané ' : 'perdí ')+ g.pj + ' a ' + g.pc + ' (' + puntos + ' puntos).',textoRepetir: 'Otra partida',alRepetir: nueva});
}
function dibujar(){
var b = g.b;
ctx.fillStyle = '#14201C';ctx.fillRect(0,0,W,H);
ctx.fillStyle = '#3A5249';
for(var y = 0;y < H;y += 20)ctx.fillRect(W / 2 - 2,y + 4,4,12);
ctx.font = 'bold 40px monospace';ctx.textAlign = 'center';ctx.fillStyle = 'rgba(234, 242, 238, 0.3)';
ctx.fillText(String(g.pj),W / 2 - 56,48);ctx.fillText(String(g.pc),W / 2 + 56,48);
ctx.fillStyle = '#E6F14A';ctx.fillRect(XJ,Math.round(g.yj),PW,PH);
ctx.fillStyle = '#EAF2EE';ctx.fillRect(XC,Math.round(g.yc),PW,PH);
ctx.fillStyle = '#FF5A7D';ctx.fillRect(Math.round(b.x),Math.round(b.y),BS,BS);
if(g.estado === 'espera' || g.estado === 'pausa'){
ctx.fillStyle = 'rgba(20, 32, 28, 0.7)';ctx.fillRect(0,H / 2 - 28,W,56);
ctx.fillStyle = '#EAF2EE';ctx.font = 'bold 18px monospace';
ctx.fillText(g.estado === 'espera' ? 'Pulsa «Empezar» o la barra espaciadora' : 'En pausa',W / 2,H / 2 + 6);
}
}
function datos(){
var l = ui.lienzo;
l.setAttribute('data-estado',g.estado);
l.setAttribute('data-marcador',g.pj + ',' + g.pc);
l.setAttribute('data-bola',Math.round(g.b.x)+ ',' + Math.round(g.b.y));
l.setAttribute('data-pala',String(Math.round(g.yj)));
l.setAttribute('data-pala-rival',String(Math.round(g.yc)));
}
function montar(){
TYJ.vaciar(raiz);ui ={};
var niveles = h('div',{class: 'fila',role: 'group','aria-label': 'Nivel del ordenador'});
[1,2,3].forEach(function(n){
niveles.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(n === nivel),onclick: function(){if(n !== nivel){nivel = n;nueva();}}},NIVELES[n][0]));
});
ui.hud = TYJ.hud([['yo','Tú','0'],['cpu','Ordenador','0']]);
ui.lienzo = h('canvas',{class: 'rq-lienzo',width: String(W),height: String(H),role: 'img','aria-label': 'Campo de juego: tu pala a la izquierda, la del ordenador a la derecha'});
ctx = ui.lienzo.getContext('2d');
ui.zona = h('div',{class: 'rq-zona',tabindex: '0',role: 'group','aria-label': 'Zona de juego. Mueve tu pala con las flechas arriba y abajo o con las teclas W y S.'},ui.lienzo);
function mover(ev){
var r = ui.lienzo.getBoundingClientRect();
g.yj = limita((ev.clientY - r.top)* H / r.height - PH / 2,0,H - PH);
}
ui.zona.addEventListener('pointermove',mover);
ui.zona.addEventListener('pointerdown',function(ev){mover(ev);ui.zona.focus({preventScroll: true});});
ui.zona.addEventListener('keydown',function(ev){
if(ev.ctrlKey || ev.metaKey || ev.altKey)return;
var k = ev.key;
if(k === 'ArrowUp' || k === 'w' || k === 'W'){ev.preventDefault();tec.arriba = true;}
else if(k === 'ArrowDown' || k === 's' || k === 'S'){ev.preventDefault();tec.abajo = true;}
else if((k === ' ' || k === 'p' || k === 'P')&& !ev.repeat){ev.preventDefault();if(g.estado === 'espera')empezar();else pausar();}
});
ui.zona.addEventListener('keyup',function(ev){
var k = ev.key;
if(k === 'ArrowUp' || k === 'w' || k === 'W')tec.arriba = false;
else if(k === 'ArrowDown' || k === 's' || k === 'S')tec.abajo = false;
});
ui.zona.addEventListener('blur',function(){tec.arriba = false;tec.abajo = false;});
function boton(txt,clave,nombre){
var b = h('button',{class: 'boton-retro boton-retro--sec rq-mando',type: 'button','aria-label': nombre + ' la pala (mantén pulsado)'},txt);
function sube(){tec[clave]= false;}
b.addEventListener('pointerdown',function(ev){ev.preventDefault();tec[clave]= true;});
b.addEventListener('pointerup',sube);b.addEventListener('pointerleave',sube);b.addEventListener('pointercancel',sube);
b.addEventListener('keydown',function(ev){if(ev.key === 'Enter' || ev.key === ' '){ev.preventDefault();tec[clave]= true;}});
b.addEventListener('keyup',function(ev){if(ev.key === 'Enter' || ev.key === ' ')sube();});
b.addEventListener('blur',sube);
return b;
}
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'El primero en llegar a ' + META + ' puntos gana.'});
ui.empezar = h('button',{class: 'boton-retro',type: 'button',onclick: empezar},'Empezar');
ui.pausa = h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: function(){pausar();}},'Pausa');
ui.final = h('div');ui.est = h('div');
[niveles,ui.hud.nodo,ui.zona,ui.msg,
h('div',{class: 'fila fila--centro'},boton('▲ Subir','botArriba','Subir'),boton('▼ Bajar','botAbajo','Bajar')),
h('div',{class: 'fila fila--centro'},ui.empezar,ui.pausa,h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: nueva},'Reiniciar')),
ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
document.addEventListener('visibilitychange',function(){if(document.hidden && g && g.estado === 'juego')pausar();});
nueva();
})();
