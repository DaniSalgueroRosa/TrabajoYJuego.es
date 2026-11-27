(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('c24');
if(!raiz)return;
var OPS =[['+','+','más'],['-','−','menos'],['*','×','por'],['/','÷','entre']];
var sesion = TYJ.Sesion(null,{victorias: true,racha: true,mejor: false});
var t = null,ui = null;
function mcd(a,b){a = Math.abs(a);b = Math.abs(b);while(b){var r = a % b;a = b;b = r;}return a || 1;}
function fr(n,d){var g = mcd(n,d);if(d < 0){n = -n;d = -d;}return{n: n / g,d: d / g};}
function aplicar(op,a,b){
if(op === '+')return fr(a.n * b.d + b.n * a.d,a.d * b.d);
if(op === '-')return fr(a.n * b.d - b.n * a.d,a.d * b.d);
if(op === '*')return fr(a.n * b.n,a.d * b.d);
if(b.n === 0)return null;
return fr(a.n * b.d,a.d * b.n);
}
function texto(x){return x.d === 1 ? String(x.n): x.n + '/' + x.d;}
function simbolo(op){return OPS.filter(function(o){return o[0]=== op;})[0][1];}
function resolver(cartas){
if(cartas.length === 1)return cartas[0].v.n === 24 && cartas[0].v.d === 1 ? cartas[0].e : null;
for(var i = 0;i < cartas.length;i++)for(var j = 0;j < cartas.length;j++){
if(i === j)continue;
for(var k = 0;k < 4;k++){
var op = OPS[k][0];
if((op === '+' || op === '*')&& j < i)continue;
var r = aplicar(op,cartas[i].v,cartas[j].v);
if(!r)continue;
var resto = cartas.filter(function(_,x){return x !== i && x !== j;});
resto.push({v: r,e: '(' + cartas[i].e + ' ' + simbolo(op)+ ' ' + cartas[j].e + ')'});
var s = resolver(resto);
if(s)return s;
}
}
return null;
}
function nueva(){
var nums,cartas;
do{
nums =[U.entre(1,13),U.entre(1,13),U.entre(1,13),U.entre(1,13)];
cartas = nums.map(function(n){return{v:{n: n,d: 1},e: String(n)};});
}while(!resolver(cartas));
t ={inicio: cartas,cartas: cartas,historia:[],sel: null,op: null,pistas: 0,pasos: 0,fin: false};
montar();pintar();
}
function montar(){
TYJ.vaciar(raiz);
ui ={ops:[]};
ui.cartas = h('div',{class: 'c24-cartas',role: 'group','aria-label': 'Cartas'});
ui.opsNodo = h('div',{class: 'c24-ops',role: 'group','aria-label': 'Operación'});
OPS.forEach(function(o){
var b = h('button',{class: 'boton-retro boton-retro--sec',type: 'button','aria-pressed': 'false','aria-label': o[2],'data-op': o[0],onclick: function(){elegirOp(o[0]);}},o[1]);
ui.ops.push(b);ui.opsNodo.appendChild(b);
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Pulsa un número, una operación y otro número para llegar a 24.'});
ui.final = h('div');ui.est = h('div');
function boton(txt,f,sec){return h('button',{class: 'boton-retro boton-retro--chico' +(sec === false ? '' : ' boton-retro--sec'),type: 'button',onclick: f},txt);}
ui.acciones = h('div',{class: 'fila'},boton('Deshacer',deshacer),boton('Reiniciar',reiniciar),boton('Pista',pista),boton('Otro puzle',nueva));
[ui.cartas,ui.opsNodo,ui.msg,ui.acciones,ui.final,ui.est].forEach(function(x){raiz.appendChild(x);});
sesion.montar(ui.est);
}
function pintar(){
TYJ.vaciar(ui.cartas);
t.cartas.forEach(function(c,i){
ui.cartas.appendChild(h('button',{class: 'c24-carta',type: 'button','data-i': String(i),'aria-pressed': String(t.sel === i),onclick: function(){elegirCarta(i);}},texto(c.v)));
});
ui.ops.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-op')=== t.op));});
}
function elegirOp(op){
if(t.fin)return;
if(t.sel === null){ui.msg.textContent = 'Primero pulsa un número.';return;}
t.op = t.op === op ? null : op;pintar();
}
function elegirCarta(i){
if(t.fin)return;
if(t.sel === null){t.sel = i;t.op = null;ui.msg.textContent = 'Ahora elige una operación.';return pintar();}
if(i === t.sel){t.sel = null;t.op = null;return pintar();}
if(!t.op){t.sel = i;return pintar();}
var a = t.cartas[t.sel],b = t.cartas[i],r = aplicar(t.op,a.v,b.v);
if(!r){ui.msg.textContent = 'No se puede dividir entre cero.';return;}
t.historia.push(t.cartas);
var resto = t.cartas.filter(function(_,x){return x !== t.sel && x !== i;});
resto.push({v: r,e: '(' + a.e + ' ' + simbolo(t.op)+ ' ' + b.e + ')'});
ui.msg.textContent = texto(a.v)+ ' ' + simbolo(t.op)+ ' ' + texto(b.v)+ ' = ' + texto(r);
t.cartas = resto;t.sel = null;t.op = null;t.pasos++;
pintar();
if(resto.length === 1){
if(r.n === 24 && r.d === 1)return acabar();
ui.msg.textContent = 'Has llegado a ' + texto(r)+ ', no a 24. Pulsa «Deshacer» o «Reiniciar» para probar otro camino.';
}
}
function deshacer(){if(t.fin || !t.historia.length)return;t.cartas = t.historia.pop();t.sel = t.op = null;ui.msg.textContent = 'Paso deshecho.';pintar();}
function reiniciar(){if(t.fin)return;t.cartas = t.inicio;t.historia =[];t.sel = t.op = null;ui.msg.textContent = 'Puzle reiniciado.';pintar();}
function pista(){if(t.fin)return;t.pistas++;ui.msg.textContent = 'Una solución: ' + resolver(t.inicio)+ ' = 24';}
function acabar(){
t.fin = true;ui.msg.textContent = '';
sesion.registrar(0,true);
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Has llegado a 24!',nivel: t.inicio.map(function(c){return c.v.n;}).join(' · '),
detalles:[t.pistas ? 'Pistas usadas: ' + t.pistas + '.' : 'Sin pistas.','Operaciones hechas: ' + t.pasos + '.'],
compartir: 'Calcula 24 con ' + t.inicio.map(function(c){return c.v.n;}).join(', ')+ ': resuelto' +(t.pistas ? ' con ' + t.pistas +(t.pistas === 1 ? ' pista.' : ' pistas.'): ' sin pistas.'),
textoRepetir: 'Otro puzle',alRepetir: nueva});
}
nueva();
})();
