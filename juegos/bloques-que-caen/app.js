(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('bq');
if(!raiz)return;
var C = 10,F = 20,P = 24;
var NIVELES =[[0,'Aprendiz'],[1000,'Peón'],[3000,'Albañil'],[6000,'Arquitecto'],[10000,'Maestro de obras'],[20000,'Constructor legendario']];
var BASE ={
I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
O:[[1,1],[1,1]],
T:[[0,1,0],[1,1,1],[0,0,0]],
S:[[0,1,1],[1,1,0],[0,0,0]],
Z:[[1,1,0],[0,1,1],[0,0,0]],
J:[[1,0,0],[1,1,1],[0,0,0]],
L:[[0,0,1],[1,1,1],[0,0,0]]
};
var COLOR ={I: '#6EC1FF',O: '#E6F14A',T: '#B9A0F5',S: '#8FD694',Z: '#FF5A7D',J: '#FFB86B',L: '#5ED6D0'};
var ROT ={};
Object.keys(BASE).forEach(function(t){
var m = BASE[t],n = m.length,r =[m];
for(var k = 1;k < 4;k++){
var a = r[k - 1],b =[];
for(var i = 0;i < n;i++){b.push([]);for(var j = 0;j < n;j++)b[i].push(a[n - 1 - j][i]);}
r.push(b);
}
ROT[t]= r;
});
var PUNTOS_LINEAS =[0,100,300,500,800];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var g = null,ui = null,reloj = null,repeticion = null;
function celdas(p){
var m = ROT[p.t][p.r],r =[];
for(var i = 0;i < m.length;i++)for(var j = 0;j < m.length;j++)if(m[i][j])r.push([p.y + i,p.x + j]);
return r;
}
function choca(p){
return celdas(p).some(function(c){return c[1]< 0 || c[1]>= C || c[0]>= F ||(c[0]>= 0 && g.tab[c[0]* C + c[1]]);});
}
function siguienteDeLaBolsa(){
if(!g.bolsa.length)g.bolsa = U.barajar(Object.keys(BASE));
return g.bolsa.pop();
}
function nuevaPieza(t){
var m = ROT[t][0],primera = 0;
while(!m[primera].some(Boolean))primera++;
return{t: t,r: 0,x: Math.floor((C - m.length)/ 2),y: -primera};
}
function nueva(){
clearInterval(reloj);parar();
g ={tab: new Array(C * F).fill(''),bolsa:[],puntos: 0,lineas: 0,nivel: 1,estado: 'espera',pieza: null,sig: null};
g.sig = siguienteDeLaBolsa();
aparecer(true);
montar();dibujar();datos();
TYJ.anunciar('Nueva partida. Pulsa Empezar o la barra espaciadora.');
}
function aparecer(sinFin){
g.pieza = nuevaPieza(g.sig);g.sig = siguienteDeLaBolsa();
if(!sinFin && choca(g.pieza))terminar('Los bloques han llegado arriba');
}
function intervalo(){return Math.max(90,820 -(g.nivel - 1)* 75);}
function empezar(){
if(g.estado !== 'espera' && g.estado !== 'pausa')return;
g.estado = 'juego';ui.pausa.textContent = 'Pausa';ui.msg.textContent = '';
clearInterval(reloj);reloj = setInterval(paso,intervalo());
datos();
}
function pausar(){
if(g.estado === 'juego'){g.estado = 'pausa';clearInterval(reloj);ui.pausa.textContent = 'Seguir';ui.msg.textContent = 'En pausa.';datos();}
else empezar();
}
function intentar(p){if(choca(p))return false;g.pieza = p;return true;}
function mover(dx){
if(g.estado !== 'juego')return false;
var ok = intentar({t: g.pieza.t,r: g.pieza.r,x: g.pieza.x + dx,y: g.pieza.y});
if(ok){dibujar();datos();}
return ok;
}
function girar(sentido){
if(g.estado !== 'juego' || g.pieza.t === 'O')return;
var r =(g.pieza.r + sentido + 4)% 4,desvios =[0,-1,1,-2,2];
for(var i = 0;i < desvios.length;i++){
if(intentar({t: g.pieza.t,r: r,x: g.pieza.x + desvios[i],y: g.pieza.y})){dibujar();datos();return;}
}
for(var k = 0;k < desvios.length;k++){
if(intentar({t: g.pieza.t,r: r,x: g.pieza.x + desvios[k],y: g.pieza.y - 1})){dibujar();datos();return;}
}
}
function paso(){
if(g.estado !== 'juego')return;
if(!intentar({t: g.pieza.t,r: g.pieza.r,x: g.pieza.x,y: g.pieza.y + 1}))fijar();
else{dibujar();datos();}
}
function bajarBlando(){
if(g.estado !== 'juego')return;
if(intentar({t: g.pieza.t,r: g.pieza.r,x: g.pieza.x,y: g.pieza.y + 1})){g.puntos += 1;ui.hud.poner('puntos',g.puntos);dibujar();datos();}
else fijar();
}
function caer(){
if(g.estado !== 'juego')return;
var n = 0;
while(intentar({t: g.pieza.t,r: g.pieza.r,x: g.pieza.x,y: g.pieza.y + 1}))n++;
g.puntos += 2 * n;
fijar();
}
function fijar(){
var arriba = false;
celdas(g.pieza).forEach(function(c){if(c[0]< 0)arriba = true;else g.tab[c[0]* C + c[1]]= g.pieza.t;});
if(arriba){g.pieza = null;return terminar('Los bloques han llegado arriba');}
var llenas = 0;
for(var f = F - 1;f >= 0;f--){
var completa = true;
for(var c = 0;c < C;c++)if(!g.tab[f * C + c]){completa = false;break;}
if(completa){
llenas++;
for(var ff = f;ff > 0;ff--)for(var cc = 0;cc < C;cc++)g.tab[ff * C + cc]= g.tab[(ff - 1)* C + cc];
for(var c0 = 0;c0 < C;c0++)g.tab[c0]= '';
f++;
}
}
if(llenas){
g.puntos += PUNTOS_LINEAS[llenas]* g.nivel;g.lineas += llenas;
var nuevo = Math.floor(g.lineas / 10)+ 1;
if(nuevo !== g.nivel){g.nivel = nuevo;clearInterval(reloj);reloj = setInterval(paso,intervalo());TYJ.anunciar('Nivel ' + g.nivel + '.');}
TYJ.anunciar(llenas === 4 ? '¡Cuatro líneas a la vez! ' + g.puntos + ' puntos.' : llenas +(llenas === 1 ? ' línea' : ' líneas')+ '. ' + g.puntos + ' puntos.');
}
ui.hud.poner('puntos',g.puntos);ui.hud.poner('lineas',g.lineas);ui.hud.poner('nivel',g.nivel);
aparecer(false);
dibujar();datos();
}
function terminar(motivo){
clearInterval(reloj);parar();g.estado = 'fin';
dibujar();datos();
sesion.registrar(g.puntos);
ui.msg.textContent = '';
var nivel = U.nivel(g.puntos,NIVELES);
TYJ.final(ui.final.appendChild(h('div')),{titulo: motivo,puntos: g.puntos,unidad: 'puntos',nivel: nivel,
detalles:['Líneas completadas: ' + g.lineas,'Nivel alcanzado: ' + g.nivel],
compartir: 'Bloques que caen: ' + g.puntos + ' puntos y ' + g.lineas + ' líneas · ' + nivel + '.',textoRepetir: 'Jugar otra vez',alRepetir: nueva});
}
function parar(){clearTimeout(repeticion);clearInterval(repeticion);repeticion = null;}
function boton(txt,nombre,accion,repite){
var b = h('button',{class: 'boton-retro boton-retro--chico bq-btn',type: 'button','aria-label': nombre,onclick: function(ev){if(ev.detail === 0)accion();}},txt);
b.addEventListener('pointerdown',function(ev){
ev.preventDefault();accion();parar();
if(repite)repeticion = setTimeout(function(){repeticion = setInterval(accion,85);},240);
});
['pointerup','pointercancel','pointerleave'].forEach(function(e){b.addEventListener(e,parar);});
return b;
}
function arrancando(f){return function(){if(g.estado === 'espera')empezar();else f();};}
function montar(){
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['puntos','Puntos',0],['lineas','Líneas',0],['nivel','Nivel',1]]);
ui.lienzo = h('canvas',{class: 'bq-lienzo',width: String(C * P),height: String(F * P),role: 'img','aria-label': 'Tablero de bloques que caen'});
ui.zona = h('div',{class: 'bq-zona',tabindex: '0',role: 'group','aria-label': 'Zona de juego. Flechas para mover, arriba o X para girar, espacio para dejar caer, P para pausar.'},ui.lienzo);
ui.zona.addEventListener('keydown',teclas);
ui.zona.addEventListener('pointerdown',function(){ui.zona.focus({preventScroll: true});});
ui.sigLienzo = h('canvas',{class: 'bq-sig-lienzo',width: '96',height: '96',role: 'img','aria-label': 'Siguiente pieza'});
ui.lado = h('div',{class: 'bq-lado'},h('p',{class: 'bq-etiqueta'},'Siguiente'),ui.sigLienzo);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'},'Pulsa Empezar o la barra espaciadora.');
ui.pad = h('div',{class: 'bq-pad'},
boton('←','Mover a la izquierda',arrancando(function(){mover(-1);}),true),
boton('↻','Girar la pieza',arrancando(function(){girar(1);}),false),
boton('→','Mover a la derecha',arrancando(function(){mover(1);}),true),
boton('↓','Bajar más rápido',arrancando(bajarBlando),true),
boton('⤓','Dejar caer del todo',arrancando(caer),false));
ui.pausa = h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: function(){pausar();ui.zona.focus({preventScroll: true});}},'Empezar');
ui.final = h('div');ui.est = h('div');
[ui.hud.nodo,h('div',{class: 'bq-area'},ui.zona,ui.lado),ui.msg,ui.pad,
h('div',{class: 'fila fila--centro'},ui.pausa,h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: nueva},'Nueva partida')),
ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function teclas(ev){
if(ev.ctrlKey || ev.metaKey || ev.altKey)return;
var k = ev.key,acciones ={
ArrowLeft: function(){mover(-1);},a: function(){mover(-1);},A: function(){mover(-1);},
ArrowRight: function(){mover(1);},d: function(){mover(1);},D: function(){mover(1);},
ArrowUp: function(){girar(1);},x: function(){girar(1);},X: function(){girar(1);},w: function(){girar(1);},W: function(){girar(1);},
z: function(){girar(-1);},Z: function(){girar(-1);},
ArrowDown: bajarBlando,s: bajarBlando,S: bajarBlando
};
if(k === ' '){ev.preventDefault();if(ev.repeat)return;if(g.estado === 'espera' || g.estado === 'pausa')empezar();else caer();}
else if(k === 'p' || k === 'P'){ev.preventDefault();if(!ev.repeat && g.estado !== 'espera')pausar();}
else if(acciones[k]){ev.preventDefault();if(g.estado === 'espera')empezar();acciones[k]();}
}
function cuadrado(ctx,x,y,tam,color,tenue){
ctx.fillStyle = color;ctx.globalAlpha = tenue ? 0.28 : 1;
ctx.fillRect(x + 1,y + 1,tam - 2,tam - 2);
if(!tenue){ctx.fillStyle = 'rgba(255,255,255,0.38)';ctx.fillRect(x + 1,y + 1,tam - 2,3);ctx.fillRect(x + 1,y + 1,3,tam - 2);ctx.fillStyle = 'rgba(0,0,0,0.28)';ctx.fillRect(x + 1,y + tam - 4,tam - 2,3);ctx.fillRect(x + tam - 4,y + 1,3,tam - 2);}
ctx.globalAlpha = 1;
}
function dibujar(){
var ctx = ui.lienzo.getContext('2d');
ctx.fillStyle = '#14201C';ctx.fillRect(0,0,C * P,F * P);
ctx.fillStyle = '#1E2E29';
for(var y = 0;y < F;y++)for(var x = 0;x < C;x++)if((x + y)% 2 === 0)ctx.fillRect(x * P,y * P,P,P);
for(var i = 0;i < g.tab.length;i++)if(g.tab[i])cuadrado(ctx,(i % C)* P,Math.floor(i / C)* P,P,COLOR[g.tab[i]],false);
if(g.pieza && g.estado !== 'fin'){
var sombra ={t: g.pieza.t,r: g.pieza.r,x: g.pieza.x,y: g.pieza.y};
while(!choca({t: sombra.t,r: sombra.r,x: sombra.x,y: sombra.y + 1}))sombra.y++;
celdas(sombra).forEach(function(c){if(c[0]>= 0)cuadrado(ctx,c[1]* P,c[0]* P,P,COLOR[sombra.t],true);});
celdas(g.pieza).forEach(function(c){if(c[0]>= 0)cuadrado(ctx,c[1]* P,c[0]* P,P,COLOR[g.pieza.t],false);});
}
ctx.strokeStyle = '#3A5249';ctx.lineWidth = 2;ctx.strokeRect(1,1,C * P - 2,F * P - 2);
var s = ui.sigLienzo.getContext('2d'),m = ROT[g.sig][0],n = m.length,q = 24,desde =[];
s.fillStyle = '#14201C';s.fillRect(0,0,96,96);
for(var a = 0;a < n;a++)for(var b = 0;b < n;b++)if(m[a][b])desde.push([a,b]);
var minA = Math.min.apply(null,desde.map(function(c){return c[0];})),maxA = Math.max.apply(null,desde.map(function(c){return c[0];}));
var minB = Math.min.apply(null,desde.map(function(c){return c[1];})),maxB = Math.max.apply(null,desde.map(function(c){return c[1];}));
var ox =(96 -(maxB - minB + 1)* q)/ 2,oy =(96 -(maxA - minA + 1)* q)/ 2;
desde.forEach(function(c){cuadrado(s,ox +(c[1]- minB)* q,oy +(c[0]- minA)* q,q,COLOR[g.sig],false);});
ui.sigLienzo.setAttribute('aria-label','Siguiente pieza: ' + g.sig);
}
function datos(){
var l = ui.lienzo;
l.setAttribute('data-estado',g.estado);
l.setAttribute('data-puntos',String(g.puntos));
l.setAttribute('data-lineas',String(g.lineas));
l.setAttribute('data-tablero',g.tab.map(function(v){return v ? '1' : '0';}).join(''));
l.setAttribute('data-pieza',g.pieza ? g.pieza.t : '');
l.setAttribute('data-celdas',g.pieza ? celdas(g.pieza).map(function(c){return c.join(',');}).join(';'): '');
l.setAttribute('aria-label','Tablero de bloques que caen. ' + g.puntos + ' puntos, ' + g.lineas + ' líneas, nivel ' + g.nivel +(g.estado === 'fin' ? '. Partida terminada' : ''));
}
document.addEventListener('visibilitychange',function(){if(document.hidden && g && g.estado === 'juego')pausar();});
nueva();
})();
