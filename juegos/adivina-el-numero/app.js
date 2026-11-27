(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('an');
if(!raiz)return;
var NIVELES ={facil:{nombre: 'Fácil (1 a 50)',max: 50},medio:{nombre: 'Medio (1 a 100)',max: 100},dificil:{nombre: 'Difícil (1 a 1000)',max: 1000}};
var sesion = TYJ.Sesion(null,{victorias: true,racha: true,mejor: false});
var nivel = 'medio',t = null,ui = null;
function limite(max){return Math.ceil(Math.log(max)/ Math.LN2)+ 1;}
function nueva(){
var n = NIVELES[nivel];
t ={max: n.max,secreto: U.entre(1,n.max),tope: limite(n.max),intentos:[],bajo: 1,alto: n.max,fin: false};
montar();pintar();
}
function montar(){
TYJ.vaciar(raiz);
ui ={};
ui.niveles = h('div',{class: 'fila',role: 'group','aria-label': 'Nivel'});
Object.keys(NIVELES).forEach(function(k){
ui.niveles.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(k === nivel),onclick: function(){nivel = k;nueva();}},NIVELES[k].nombre));
});
ui.hud = TYJ.hud([['intentos','Intentos','0'],['quedan','Te quedan','0'],['margen','Margen','']]);
ui.zona = h('span',{class: 'an-zona'});
ui.marcas = h('span',{class: 'an-marcas'});
ui.recta = h('div',{class: 'an-recta','aria-hidden': 'true'},ui.zona,ui.marcas,
h('span',{class: 'an-extremo an-extremo--1',texto: '1'}),h('span',{class: 'an-extremo an-extremo--2',texto: String(t.max)}));
ui.campo = h('input',{class: 'an-campo',id: 'an-campo',type: 'number',inputmode: 'numeric',min: '1',max: String(t.max),step: '1',autocomplete: 'off'});
ui.boton = h('button',{class: 'boton-retro',type: 'submit'},'Probar');
ui.form = h('form',{class: 'an-form',novalidate: 'novalidate'},h('label',{for: 'an-campo'},'Tu número',ui.campo),ui.boton);
ui.form.addEventListener('submit',function(e){e.preventDefault();probar();});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'He pensado un número entre 1 y ' + t.max + '. ¿Cuál es?'});
ui.hist = h('ul',{class: 'an-hist','aria-label': 'Intentos hechos'});
ui.final = h('div');ui.est = h('div');
[ui.niveles,ui.hud.nodo,ui.recta,ui.form,ui.msg,ui.hist,ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function pintar(){
ui.hud.poner('intentos',t.intentos.length);
ui.hud.poner('quedan',t.tope - t.intentos.length,t.tope - t.intentos.length <= 1 && !t.fin);
ui.hud.poner('margen',t.bajo + '–' + t.alto);
ui.campo.disabled = ui.boton.disabled = t.fin;
ui.zona.style.left =((t.bajo - 1)* 100 / t.max)+ '%';
ui.zona.style.width =(Math.max(0,t.alto - t.bajo + 1)* 100 / t.max)+ '%';
TYJ.vaciar(ui.marcas);
t.intentos.forEach(function(v){
var m = h('span',{class: 'an-marca' +(t.fin && v === t.secreto ? ' an-marca--acierto' : '')});
m.style.left =((v - 0.5)* 100 / t.max)+ '%';
ui.marcas.appendChild(m);
});
if(t.fin && t.intentos.indexOf(t.secreto)< 0){
var s = h('span',{class: 'an-marca an-marca--secreto'});s.style.left =((t.secreto - 0.5)* 100 / t.max)+ '%';ui.marcas.appendChild(s);
}
}
function probar(){
if(t.fin)return;
var txt = String(ui.campo.value).trim(),v = Number(txt);
if(!txt || !isFinite(v)|| Math.floor(v)!== v || v < 1 || v > t.max){ui.msg.textContent = 'Escribe un número entero entre 1 y ' + t.max + '.';return;}
if(t.intentos.indexOf(v)>= 0){ui.msg.textContent = 'Ya has probado el ' + v + '. Prueba otro.';return;}
t.intentos.push(v);
var pista;
if(v === t.secreto){pista = 'El ' + v + ' es correcto.';}
else if(v < t.secreto){pista = v + ': el número es más alto.';t.bajo = Math.max(t.bajo,v + 1);}
else{pista = v + ': el número es más bajo.';t.alto = Math.min(t.alto,v - 1);}
ui.hist.insertBefore(h('li',{texto: 'Intento ' + t.intentos.length + ' · ' + pista}),ui.hist.firstChild);
ui.msg.textContent = pista;
ui.campo.value = '';
if(v === t.secreto){t.fin = true;pintar();return acabar(true);}
if(t.intentos.length >= t.tope){t.fin = true;pintar();return acabar(false);}
pintar();ui.campo.focus();
}
function acabar(gano){
var n = t.intentos.length;
ui.msg.textContent = '';
sesion.registrar(0,gano);
TYJ.final(ui.final.appendChild(h('div')),{titulo: gano ? '¡Lo has adivinado!' : 'Se acabaron los intentos',nivel: NIVELES[nivel].nombre,
puntos: gano ? n : null,unidad: n === 1 ? 'intento' : 'intentos',
detalles:[gano ? 'Con la búsqueda por mitades basta con ' +(limite(t.max)- 1)+ ' intentos como máximo.' : 'El número era el ' + t.secreto + '.'],
compartir: 'Adivina el número (' + NIVELES[nivel].nombre.toLowerCase()+ '): ' +(gano ? 'lo he adivinado en ' + n +(n === 1 ? ' intento' : ' intentos'): 'no lo he conseguido')+ '.',
textoRepetir: 'Otro número',alRepetir: nueva});
}
nueva();
})();
