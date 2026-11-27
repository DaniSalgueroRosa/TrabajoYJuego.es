(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('mb');
if(!raiz)return;
var VIDAS = 3,VERTICE = 0.82,ZONA = 0.45,G0 = 2.2,GMAX = 9,REBOTE = 0.7;
var RANGOS =[[0,'Pie de plomo'],[10,'Con buen toque'],[25,'Artista del balón'],[50,'Maestro del freestyle']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Más toques: '});
var ui = null,g = null,raf = 0,aviso = 0,ultimaOrden = 0;
function gravedad(toques){return Math.min(GMAX,G0 * Math.pow(1.06,Math.floor(toques / 3)));}
function altura(t,grav){var v0 = Math.sqrt(2 * grav * VERTICE);return v0 * t - 0.5 * grav * t * t;}
function duracion(grav){return 2 * Math.sqrt(2 * VERTICE / grav);}
function inicio(){
cancelAnimationFrame(raf);clearTimeout(aviso);g = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Malabares con el balón'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Dale un toque al balón cuando baje a la franja de tus pies. Tres vidas y cada vez más rápido.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Empezar')));
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function jugar(){
cancelAnimationFrame(raf);clearTimeout(aviso);
g ={toques: 0,vidas: VIDAS,t0: performance.now()+ 400,grav: G0,pausa: 0,fin: false,dentro: false,bloqueo: 0};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['toques','Toques',0],['vidas','Vidas',VIDAS]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Pulsa cuando el balón esté en la franja y baje.'});
ui.aviso = h('span',{class: 'mb-aviso','aria-hidden': 'true'});
ui.campo = h('button',{class: 'mb-campo',type: 'button','aria-label': 'Campo de juego. Pulsa o usa la barra espaciadora para dar un toque cuando el balón baje a la franja de los pies.','aria-keyshortcuts': 'Space Enter'},
h('span',{class: 'mb-zona','aria-hidden': 'true'}),h('span',{class: 'mb-pie','aria-hidden': 'true'}),h('span',{class: 'mb-balon','aria-hidden': 'true'}),ui.aviso);
ui.campo.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;ultimaOrden = performance.now();toque();});
ui.campo.addEventListener('keydown',function(ev){if(ev.key === ' ' || ev.key === 'Enter'){ev.preventDefault();if(!ev.repeat){ultimaOrden = performance.now();toque();}}});
ui.campo.addEventListener('click',function(ev){if(ev.detail === 0 && performance.now()- ultimaOrden > 400)toque();});
raiz.appendChild(ui.hud.nodo);raiz.appendChild(ui.campo);raiz.appendChild(ui.msg);
ui.campo.focus({preventScroll: true});
document.addEventListener('visibilitychange',alVisibilidad);
pintar(0);
raf = requestAnimationFrame(bucle);
}
function alVisibilidad(){
if(!g || g.fin)return;
if(document.hidden){g.pausa = performance.now();cancelAnimationFrame(raf);}
else if(g.pausa){g.t0 += performance.now()- g.pausa;g.pausa = 0;raf = requestAnimationFrame(bucle);}
}
function pintar(altu){
var t = performance.now()/ 1000;
ui.campo.style.setProperty('--h',altu.toFixed(3));
ui.campo.style.setProperty('--x',Math.sin(g.toques * 1.7 + t * 0.9).toFixed(2));
ui.campo.setAttribute('data-altura',altu.toFixed(3));
}
function decir(texto,ms){
ui.msg.textContent = texto;ui.aviso.textContent = texto;
clearTimeout(aviso);aviso = setTimeout(function(){if(ui)ui.aviso.textContent = '';},ms || 700);
}
function bucle(){
if(!g || g.fin)return;
var t =(performance.now()- g.t0)/ 1000;
if(t < 0){pintar(0);raf = requestAnimationFrame(bucle);return;}
var altu = altura(t,g.grav);
if(t > duracion(g.grav)){fallo('¡Se ha caído!');if(g.fin)return;t = 0;altu = 0;}
var dentro = t > duracion(g.grav)/ 2 && altu <= ZONA;
if(dentro !== g.dentro){g.dentro = dentro;ui.campo.setAttribute('data-dentro',dentro ? 'si' : 'no');}
pintar(Math.max(0,altu));
raf = requestAnimationFrame(bucle);
}
function toque(){
if(!g || g.fin)return;
var ahora = performance.now(),t =(ahora - g.t0)/ 1000;
if(t < 0 || ahora < g.bloqueo)return;
if(t > duracion(g.grav)){fallo('¡Se ha caído!');return;}
var altu = altura(t,g.grav),baja = t > duracion(g.grav)/ 2;
if(baja && altu <= ZONA){
g.toques++;g.grav = gravedad(g.toques);g.t0 = ahora;g.bloqueo = ahora + 120;
ui.hud.poner('toques',g.toques);
ui.campo.setAttribute('data-patada','si');setTimeout(function(){if(ui)ui.campo.setAttribute('data-patada','no');},120);
decir('¡Toque ' + g.toques + '!',500);
}else{
fallo('¡Demasiado pronto!');
}
}
function fallo(texto){
g.vidas--;ui.hud.poner('vidas',Math.max(0,g.vidas),g.vidas <= 1);
g.t0 = performance.now()+ 500;g.bloqueo = 0;g.dentro = false;ui.campo.setAttribute('data-dentro','no');
if(g.vidas <= 0){terminar();return;}
decir(texto + ' Te quedan ' + g.vidas +(g.vidas === 1 ? ' vida.' : ' vidas.'),900);
}
function terminar(){
g.fin = true;cancelAnimationFrame(raf);clearTimeout(aviso);
document.removeEventListener('visibilitychange',alVisibilidad);
sesion.registrar(g.toques);
var nivel = U.nivel(g.toques,RANGOS);
TYJ.final(raiz,{titulo: 'Se te ha caído el balón',puntos: g.toques,unidad: g.toques === 1 ? 'toque' : 'toques',nivel: nivel,
compartir: 'Malabares con el balón · ' + g.toques + ' toques seguidos (' + nivel + ')',alRepetir: jugar});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();
