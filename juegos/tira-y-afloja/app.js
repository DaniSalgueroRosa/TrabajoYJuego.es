(function(){
'use strict';
var TYJ = window.TYJ,h = TYJ.h;
var raiz = document.getElementById('ty');
if(!raiz)return;
var META = 10,PARA_GANAR = 2,PASO = 700;
var NIVELES ={facil:{nombre: 'Fácil',ritmo: 4.5},medio:{nombre: 'Medio',ritmo: 6.5},dificil:{nombre: 'Difícil',ritmo: 8.5}};
var marcador ={j1: 0,j2: 0,tu: 0,cpu: 0};
var ui = null,g = null,raf = 0,ultimaOrden =[0,0];
function inicio(){
cancelAnimationFrame(raf);g = null;
document.removeEventListener('keydown',alTeclear);document.removeEventListener('visibilitychange',alVisibilidad);
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Tira y afloja'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Pulsa más rápido que tu rival para llevar el nudo a tu lado. Gana quien consiga dos rondas.'}));
var modos = h('div',{class: 'ty-modos',role: 'group','aria-label': 'Elige cómo jugar'});
modos.appendChild(h('button',{class: 'ty-modo',type: 'button','data-modo': '2j',onclick: function(){empezar('2j');}},h('b',{texto: 'Dos jugadores'}),h('small',{texto: 'En este mismo dispositivo: botones lado a lado o teclas A y L.'})));
Object.keys(NIVELES).forEach(function(k){
modos.appendChild(h('button',{class: 'ty-modo',type: 'button','data-modo': k,onclick: function(){empezar(k);}},
h('b',{texto: 'Contra el ordenador · ' + NIVELES[k].nombre}),h('small',{texto: 'Pulsa unas ' + String(NIVELES[k].ritmo).replace('.',',')+ ' veces por segundo.'})));
});
raiz.appendChild(modos);
if(marcador.j1 + marcador.j2 + marcador.tu + marcador.cpu)raiz.appendChild(h('p',{class: 'texto',texto: 'Marcador de esta sesión: jugador 1 ' + marcador.j1 + ', jugador 2 ' + marcador.j2 + ', tú contra el ordenador ' + marcador.tu + ' a ' + marcador.cpu + '.'}));
}
function empezar(modo){
g ={modo: modo,cpu: modo !== '2j',pos: 0,ronda: 1,v1: 0,v2: 0,fase: 'cuenta',t0: performance.now(),sigCpu: 0,pausa: 0,toques:[0,0],total:[0,0],fin: false};
var n1 = g.cpu ? 'Tú' : 'Jugador 1',n2 = g.cpu ? 'Ordenador' : 'Jugador 2';
g.n1 = n1;g.n2 = n2;
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda',1],['v1',n1,0],['v2',n2,0]]);
ui.cuenta = h('p',{class: 'ty-cuenta','aria-hidden': 'true'});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Prepárate…'});
ui.nudo = h('span',{class: 'ty-nudo','aria-hidden': 'true'});
ui.cuerda = h('div',{class: 'ty-cuerda','aria-hidden': 'true'},h('span',{class: 'ty-meta ty-meta--1'}),h('span',{class: 'ty-meta ty-meta--2'}),h('span',{class: 'ty-centro'}),ui.nudo);
ui.b1 = h('button',{class: 'ty-boton ty-boton--1',type: 'button','data-jugador': '1','aria-keyshortcuts': 'A'},g.cpu ? 'Pulsa aquí' : 'Jugador 1',h('small',{texto: g.cpu ? 'Tecla A o barra espaciadora' : 'Tecla A'}));
ui.b1.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;ultimaOrden[0]= performance.now();tocar(1);});
ui.b1.addEventListener('click',function(ev){if(ev.detail === 0 && performance.now()- ultimaOrden[0]> 400)tocar(1);});
var lado2;
if(g.cpu)lado2 = h('div',{class: 'ty-panel-cpu','aria-hidden': 'true'},'Ordenador · ' + NIVELES[modo].nombre);
else{
lado2 = h('button',{class: 'ty-boton ty-boton--2',type: 'button','data-jugador': '2','aria-keyshortcuts': 'L'},'Jugador 2',h('small',{texto: 'Tecla L'}));
lado2.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;ultimaOrden[1]= performance.now();tocar(2);});
lado2.addEventListener('click',function(ev){if(ev.detail === 0 && performance.now()- ultimaOrden[1]> 400)tocar(2);});
}
ui.botones = h('div',{class: 'ty-botones'},ui.b1,lado2);
ui.zonaSiguiente = h('div',{class: 'fila'});
raiz.appendChild(h('h2',{texto: 'Tira y afloja'}));
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(ui.cuenta);
raiz.appendChild(ui.cuerda);
raiz.appendChild(h('p',{class: 'ty-etiquetas','aria-hidden': 'true'},h('span',{texto: '◀ ' + n1}),h('span',{texto: n2 + ' ▶'})));
raiz.appendChild(ui.botones);
raiz.appendChild(ui.msg);
raiz.appendChild(ui.zonaSiguiente);
document.addEventListener('keydown',alTeclear);
document.addEventListener('visibilitychange',alVisibilidad);
colocar();
raf = requestAnimationFrame(bucle);
}
function alTeclear(ev){
if(!g || g.fin || ev.ctrlKey || ev.metaKey || ev.altKey)return;
var jugador = ev.code === 'KeyA' ? 1 : ev.code === 'KeyL' && !g.cpu ? 2 :(g.cpu && ev.code === 'Space' ? 1 : 0);
if(!jugador)return;
ev.preventDefault();
if(ev.repeat)return;
ultimaOrden[jugador - 1]= performance.now();
tocar(jugador);
}
function alVisibilidad(){
if(!g || g.fin)return;
if(document.hidden){g.pausa = performance.now();cancelAnimationFrame(raf);}
else if(g.pausa){var d = performance.now()- g.pausa;g.pausa = 0;g.t0 += d;if(g.sigCpu)g.sigCpu += d;raf = requestAnimationFrame(bucle);}
}
function colocar(){ui.cuerda.style.setProperty('--p',String(g.pos));ui.cuerda.setAttribute('data-pos',String(g.pos));}
function empezarRonda(){
g.pos = 0;g.fase = 'cuenta';g.t0 = performance.now();g.sigCpu = 0;g.toques =[0,0];
TYJ.vaciar(ui.zonaSiguiente);
ui.msg.textContent = 'Ronda ' + g.ronda + '. Prepárate…';
ui.hud.poner('ronda',g.ronda);
colocar();
raf = requestAnimationFrame(bucle);
}
function intervaloCpu(){return(1000 / NIVELES[g.modo].ritmo)*(0.7 + 0.6 * Math.random());}
function bucle(){
if(!g || g.fin)return;
var ahora = performance.now();
if(g.fase === 'cuenta'){
var k = Math.floor((ahora - g.t0)/ PASO);
if(k >= 3){
g.fase = 'tira';ui.cuenta.textContent = '¡TIRA!';ui.msg.textContent = '¡Tira!';
if(g.cpu)g.sigCpu = ahora + intervaloCpu();
}else{ui.cuenta.textContent = String(3 - k);}
}else if(g.fase === 'tira' && g.cpu){
var guardia = 0;
while(g.fase === 'tira' && ahora >= g.sigCpu && guardia++ < 50){g.sigCpu += intervaloCpu();tocar(2);}
}
if(g.fase === 'cuenta' || g.fase === 'tira')raf = requestAnimationFrame(bucle);
}
function tocar(jugador){
if(!g || g.fin)return;
if(g.fase !== 'tira'){if(g.fase === 'cuenta')ui.msg.textContent = '¡Espera a la señal!';return;}
g.toques[jugador - 1]++;g.total[jugador - 1]++;
g.pos += jugador === 1 ? -1 : 1;
colocar();
if(g.pos <= -META)ganarRonda(1);else if(g.pos >= META)ganarRonda(2);
}
function ganarRonda(j){
g.fase = 'entre';cancelAnimationFrame(raf);ui.cuenta.textContent = '';
if(j === 1)g.v1++;else g.v2++;
ui.hud.poner('v1',g.v1);ui.hud.poner('v2',g.v2);
var quien = j === 1 ? g.n1 : g.n2;
if(g.v1 >= PARA_GANAR || g.v2 >= PARA_GANAR){terminar(j);return;}
ui.msg.textContent =(g.cpu ?(j === 1 ? '¡Ganas la ronda ' : 'El ordenador gana la ronda '): quien + ' gana la ronda ')+ g.ronda + '.';
g.ronda++;
var b = h('button',{class: 'boton-retro',type: 'button',onclick: empezarRonda},'Siguiente ronda');
TYJ.vaciar(ui.zonaSiguiente);ui.zonaSiguiente.appendChild(b);b.focus({preventScroll: true});
}
function terminar(j){
g.fin = true;
document.removeEventListener('keydown',alTeclear);document.removeEventListener('visibilitychange',alVisibilidad);
var titulo;
if(g.cpu){if(j === 1){marcador.tu++;titulo = '¡Has ganado el pulso!';}else{marcador.cpu++;titulo = 'El ordenador gana el pulso';}}
else{if(j === 1)marcador.j1++;else marcador.j2++;titulo = 'Gana el jugador ' + j;}
var detalles =['Rondas: ' + g.v1 + ' a ' + g.v2,'Pulsaciones totales: ' + g.n1 + ' ' + g.total[0]+ ' · ' + g.n2 + ' ' + g.total[1]];
detalles.push(g.cpu ? 'Marcador de la sesión contra el ordenador: ' + marcador.tu + ' a ' + marcador.cpu : 'Marcador de la sesión: jugador 1 ' + marcador.j1 + ', jugador 2 ' + marcador.j2);
var modo = g.modo;
TYJ.final(raiz,{titulo: titulo,detalles: detalles,compartir: g.cpu ? 'Tira y afloja · ' +(j === 1 ? 'gané' : 'perdí')+ ' contra el ordenador (' + NIVELES[modo].nombre.toLowerCase()+ ')' : 'Tira y afloja · ' + titulo.toLowerCase(),
alRepetir: function(){empezar(modo);},textoRepetir: 'Revancha'});
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: inicio},'Cambiar de modo')));
}
inicio();
})();
