(function(){
'use strict';
var TYJ = window.TYJ,h = TYJ.h;
var raiz = document.getElementById('pi');
if(!raiz)return;
var FORMAS ={
rectangulo:{nombre: 'Rectángulo',filas:['######','######','######','######','######','######','######']},
corazon:{nombre: 'Corazón',filas:['.#..#.','######','######','.####.','..##..']},
circulo:{nombre: 'Círculo',filas:['..##..','.####.','######','######','.####.','..##..']}
};
var COLORES =['#FF5A7D','#FFB347','#E6F14A','#9ADB74','#7CC8F5','#C79BFF'];
var VENTANA_COMBO = 450;
var ui = null,g = null,audio = null,sonido = true,mejores ={},tableros = 0,mejorCombo = 0;
function tono(combo){
if(!sonido)return;
try{
if(!audio){var C = window.AudioContext || window.webkitAudioContext;if(!C)return;audio = new C();}
if(audio.state === 'suspended' && audio.resume)audio.resume();
var t = audio.currentTime,o = audio.createOscillator(),v = audio.createGain(),f = 330 * Math.pow(2,Math.min(combo - 1,12)/ 12);
o.type = 'sine';o.frequency.setValueAtTime(f,t);
v.gain.setValueAtTime(0.0001,t);v.gain.linearRampToValueAtTime(0.18,t + 0.008);v.gain.exponentialRampToValueAtTime(0.0001,t + 0.09);
o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t + 0.1);
}catch(e){}
}
function montar(forma){
TYJ.vaciar(raiz);
var def = FORMAS[forma],cols = def.filas[0].length,total = 0;
g ={forma: forma,total: 0,hechas: 0,combo: 0,ultimo: -1e9,t0: 0,fin: false,pulsando: false,burbujas:[]};
ui ={};
ui.hud = TYJ.hud([['hechas','Reventadas','0 / 0'],['combo','Mejor combo',mejorCombo],['tableros','Tableros completos',tableros]]);
ui.formas = h('ul',{class: 'pi-formas'});
Object.keys(FORMAS).forEach(function(k){
var b = h('button',{class: 'pi-forma',type: 'button','data-forma': k,'aria-pressed': k === forma ? 'true' : 'false',onclick: function(){montar(k);}},FORMAS[k].nombre);
ui.formas.appendChild(h('li',{},b));
});
ui.sonido = h('button',{class: 'pi-sonido',type: 'button','aria-pressed': sonido ? 'true' : 'false',onclick: function(){sonido = !sonido;ui.sonido.setAttribute('aria-pressed',sonido ? 'true' : 'false');ui.sonido.textContent = sonido ? 'Sonido: sí' : 'Sonido: no';}},sonido ? 'Sonido: sí' : 'Sonido: no');
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Toca las burbujas o arrastra el dedo por encima.'});
ui.tablero = h('div',{class: 'pi-tablero',role: 'group','aria-label': 'Tablero de burbujas: ' + def.nombre.toLowerCase(),'data-vuelta': 'no'});
ui.tablero.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
def.filas.forEach(function(fila,r){
for(var c = 0;c < cols;c++){
if(fila.charAt(c)!== '#'){ui.tablero.appendChild(h('span',{class: 'pi-hueco','aria-hidden': 'true'}));continue;}
var b = h('button',{class: 'pi-burbuja',type: 'button','aria-pressed': 'false','data-f': String(r),'data-c': String(c),'aria-label': 'Burbuja fila ' +(r + 1)+ ', columna ' +(c + 1)});
b.style.setProperty('--c',COLORES[r % COLORES.length]);
b.addEventListener('keydown',function(ev){navegar(ev);});
b.addEventListener('click',function(ev){reventar(ev.currentTarget);});
g.burbujas.push(b);ui.tablero.appendChild(b);total++;
}
});
g.total = total;
ui.tablero.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;g.pulsando = true;sobre(ev);});
ui.tablero.addEventListener('pointermove',function(ev){if(g.pulsando)sobre(ev);});
['pointerup','pointercancel','pointerleave'].forEach(function(n){ui.tablero.addEventListener(n,function(){g.pulsando = false;});});
ui.vuelta = h('button',{class: 'boton-retro',type: 'button',onclick: function(){darVuelta(true);}},'Dar la vuelta al tablero');
raiz.appendChild(h('h2',{texto: 'Pop it'}));
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('div',{class: 'pi-controles'},ui.formas,ui.sonido));
raiz.appendChild(ui.tablero);
raiz.appendChild(ui.msg);
raiz.appendChild(h('div',{class: 'pi-acciones'},ui.vuelta));
pintar();
}
function sobre(ev){
var el = document.elementFromPoint(ev.clientX,ev.clientY);
if(el && el.classList && el.classList.contains('pi-burbuja')&& ui.tablero.contains(el))reventar(el);
}
function reventar(b){
if(!g || g.fin || b.getAttribute('aria-pressed')=== 'true')return;
var ahora = performance.now();
b.setAttribute('aria-pressed','true');
if(!g.hechas)g.t0 = ahora;
g.hechas++;
g.combo = ahora - g.ultimo <= VENTANA_COMBO ? g.combo + 1 : 1;
g.ultimo = ahora;
if(g.combo > mejorCombo)mejorCombo = g.combo;
tono(g.combo);
pintar();
if(g.hechas >= g.total)completar(ahora);
}
function pintar(){
ui.hud.poner('hechas',g.hechas + ' / ' + g.total);ui.hud.poner('combo',mejorCombo);ui.hud.poner('tableros',tableros);
}
function completar(ahora){
g.fin = true;tableros++;
var seg =(ahora - g.t0)/ 1000,mejor = mejores[g.forma]=== undefined || seg < mejores[g.forma];
if(mejor)mejores[g.forma]= seg;
ui.msg.textContent = '¡Tablero completo en ' + seg.toFixed(1).replace('.',',')+ ' s!' +(mejor ? ' Es tu mejor marca de esta sesión en este tablero.' : ' Tu mejor marca aquí es ' + mejores[g.forma].toFixed(1).replace('.',',')+ ' s.')+ ' Dale la vuelta para reventarlas otra vez.';
pintar();ui.vuelta.focus({preventScroll: true});
}
function darVuelta(manual){
g.burbujas.forEach(function(b){b.setAttribute('aria-pressed','false');});
g.hechas = 0;g.combo = 0;g.ultimo = -1e9;g.fin = false;
ui.tablero.setAttribute('data-vuelta','si');
setTimeout(function(){if(ui)ui.tablero.setAttribute('data-vuelta','no');},420);
ui.msg.textContent = 'Tablero dado la vuelta. ¡A reventar!';
pintar();
}
function navegar(ev){
var b = ev.currentTarget,f = +b.getAttribute('data-f'),c = +b.getAttribute('data-c'),df = 0,dc = 0;
if(ev.key === 'ArrowLeft')dc = -1;else if(ev.key === 'ArrowRight')dc = 1;else if(ev.key === 'ArrowUp')df = -1;else if(ev.key === 'ArrowDown')df = 1;else return;
ev.preventDefault();
var destino = null;
for(var paso = 1;paso < 10 && !destino;paso++){
destino = g.burbujas.filter(function(x){return +x.getAttribute('data-f')=== f + df * paso && +x.getAttribute('data-c')=== c + dc * paso;})[0]|| null;
}
if(destino)destino.focus();
}
montar('rectangulo');
})();
