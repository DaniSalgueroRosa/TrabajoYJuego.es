(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('rn');
if(!raiz)return;
var MODOS ={tranquilo:{nombre: 'Tranquilo',k: 1.4},normal:{nombre: 'Normal',k: 1},rapido:{nombre: 'Rápido',k: 0.7}};
var NIVELES =[[0,'Despistado'],[5,'Atento'],[7,'Memoria media'],[9,'Memoria brillante'],[12,'Memoria prodigiosa']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var modo = 'normal',g = null,ui = null,temporizador = null;
function nuevoNumero(n){
var s = String(U.entre(1,9));
for(var i = 1;i < n;i++)s += U.azar(10);
return s;
}
function tiempoDeLectura(n){return Math.round((900 + 500 * n)* MODOS[modo].k);}
function nueva(){
clearTimeout(temporizador);
g ={fase: 'espera',n: 3,numero: '',vidas: 3,puntos: 0,mejor: 0};
montar();datos();
TYJ.anunciar('Nueva partida. Pulsa Empezar.');
}
function ronda(){
g.numero = nuevoNumero(g.n);g.fase = 'ver';datos();
var ms = tiempoDeLectura(g.n);
ui.cifras.textContent = g.numero;ui.cifras.classList.remove('rn-oculto');
ui.entrada.value = '';ui.entrada.disabled = true;ui.comprobar.disabled = true;ui.continuar.hidden = true;
ui.barra.style.setProperty('--dur',ms + 'ms');ui.barra.classList.remove('rn-corre');void ui.barra.offsetWidth;ui.barra.classList.add('rn-corre');
ui.msg.textContent = 'Memoriza el número de ' + g.n + ' cifras.';ui.msg.className = 'mensaje';
ui.hud.poner('cifras',g.n);
TYJ.anunciar('Número de ' + g.n + ' cifras: ' + g.numero.split('').join(', '));
temporizador = setTimeout(ocultar,ms);
}
function ocultar(){
g.fase = 'teclear';datos();
ui.cifras.textContent = '?'.repeat(g.n);ui.cifras.classList.add('rn-oculto');
ui.entrada.disabled = false;ui.comprobar.disabled = false;ui.entrada.focus();
ui.msg.textContent = 'Escribe el número que has visto y pulsa Comprobar (o Intro).';
}
function comprobar(){
if(g.fase !== 'teclear')return;
var dado = ui.entrada.value.replace(/\D/g,'');
if(!dado){ui.msg.textContent = 'Escribe primero las cifras que recuerdas.';ui.msg.className = 'mensaje mensaje--mal';return;}
g.fase = 'resultado';ui.entrada.disabled = true;ui.comprobar.disabled = true;datos();
ui.cifras.textContent = g.numero;ui.cifras.classList.remove('rn-oculto');
if(dado === g.numero){
g.puntos += g.n * 10;g.mejor = Math.max(g.mejor,g.n);g.n++;datos();
ui.hud.poner('puntos',g.puntos);
ui.msg.textContent = '¡Correcto! Ahora, ' + g.n + ' cifras.';ui.msg.className = 'mensaje mensaje--ok';
TYJ.anunciar('Correcto. Ahora ' + g.n + ' cifras.');
temporizador = setTimeout(ronda,1100);
}else{
g.vidas--;ui.hud.poner('vidas',g.vidas);
ui.msg.textContent = 'Era ' + g.numero + '. Tú has escrito ' + dado + '.';ui.msg.className = 'mensaje mensaje--mal';
TYJ.anunciar('Incorrecto. Era ' + g.numero.split('').join(', ')+ '.');
if(g.vidas <= 0)return terminar();
ui.continuar.hidden = false;ui.continuar.focus();
}
}
function terminar(){
g.fase = 'fin';datos();
sesion.registrar(g.puntos);
var nivel = U.nivel(g.mejor,NIVELES);
TYJ.final(ui.final.appendChild(h('div')),{titulo: g.mejor ? 'Has recordado hasta ' + g.mejor + ' cifras' : 'No has recordado ningún número',puntos: g.puntos,unidad: 'puntos',nivel: nivel,
detalles:['Velocidad: ' + MODOS[modo].nombre],
compartir: 'Recuerda el número (' + MODOS[modo].nombre.toLowerCase()+ '): ' + g.mejor + ' cifras, ' + g.puntos + ' puntos · ' + nivel + '.',textoRepetir: 'Otra partida',alRepetir: nueva});
}
function montar(){
TYJ.vaciar(raiz);
ui ={};
ui.modos = h('div',{class: 'fila',role: 'group','aria-label': 'Velocidad'});
Object.keys(MODOS).forEach(function(k){
ui.modos.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(k === modo),onclick: function(ev){
if(g.fase !== 'espera')return;
modo = k;ui.modos.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b === ev.currentTarget));});
}},MODOS[k].nombre));
});
ui.hud = TYJ.hud([['cifras','Cifras',g.n],['vidas','Vidas',g.vidas],['puntos','Puntos',0]]);
ui.cifras = h('p',{class: 'rn-cifras','aria-hidden': 'true'},'···');
ui.barra = h('div',{class: 'rn-barra','aria-hidden': 'true'},h('span'));
ui.entrada = h('input',{class: 'rn-entrada',type: 'text',inputmode: 'numeric',autocomplete: 'off',maxlength: '24',disabled: true,'aria-label': 'Número que recuerdas'});
ui.entrada.addEventListener('keydown',function(ev){if(ev.key === 'Enter'){ev.preventDefault();comprobar();}});
ui.comprobar = h('button',{class: 'boton-retro',type: 'button',disabled: true,onclick: comprobar},'Comprobar');
ui.continuar = h('button',{class: 'boton-retro',type: 'button',hidden: true,onclick: function(){ui.continuar.hidden = true;ronda();}},'Otro número');
ui.empezar = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(g.fase !== 'espera')return;ui.empezar.hidden = true;ronda();}},'Empezar');
ui.msg = h('p',{class: 'mensaje',role: 'status'},'Se mostrará un número durante unos segundos. Cuando desaparezca, escríbelo.');
ui.final = h('div');ui.est = h('div');
[ui.modos,ui.hud.nodo,h('div',{class: 'rn-caja'},ui.cifras,ui.barra),ui.msg,
h('div',{class: 'fila fila--centro'},ui.entrada,ui.comprobar),h('div',{class: 'fila fila--centro'},ui.empezar,ui.continuar,
h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: nueva},'Reiniciar')),ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function datos(){
raiz.setAttribute('data-fase',g.fase);
raiz.setAttribute('data-numero',g.numero);
raiz.setAttribute('data-cifras',String(g.n));
}
nueva();
})();
