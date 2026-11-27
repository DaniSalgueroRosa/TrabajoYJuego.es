(function(){
'use strict';
var TYJ = window.TYJ,h = TYJ.h;
var raiz = document.getElementById('mc');
if(!raiz)return;
var PASO_MS = 110,CPU_ESPERA = 600,PROFUNDIDAD = 7;
var NIVELES ={facil: 'Fácil',dificil: 'Difícil'};
var ui = null,g = null,temporizadores =[];
function inicial(){var b =[];for(var i = 0;i < 14;i++)b.push(i === 6 || i === 13 ? 0 : 4);return b;}
function almacen(j){return j === 0 ? 6 : 13;}
function hoyosDe(j){return j === 0 ?[0,1,2,3,4,5]:[7,8,9,10,11,12];}
function mover(b0,pit,j){
var b = b0.slice(),n = b[pit],i = pit,pasos =[],suyo = almacen(1 - j),mio = almacen(j);
b[pit]= 0;
while(n > 0){i =(i + 1)% 14;if(i === suyo)continue;b[i]++;n--;pasos.push(i);}
var extra = i === mio,captura = null,enMiFila = j === 0 ? i <= 5 :(i >= 7 && i <= 12);
if(!extra && enMiFila && b[i]=== 1 && b[12 - i]> 0){
captura ={desde: 12 - i,en: i,n: b[12 - i]+ 1};
b[mio]+= captura.n;b[i]= 0;b[12 - i]= 0;
}
return{b: b,pasos: pasos,extra: extra,captura: captura};
}
function ladoVacio(b,j){return hoyosDe(j).every(function(p){return b[p]=== 0;});}
function cerrar(b){
var f = b.slice();
[0,1].forEach(function(j){hoyosDe(j).forEach(function(p){f[almacen(j)]+= f[p];f[p]= 0;});});
return f;
}
function terminada(b){return ladoVacio(b,0)|| ladoVacio(b,1);}
function legales(b,j){return hoyosDe(j).filter(function(p){return b[p]> 0;});}
function valor(b){var f = terminada(b)? cerrar(b): b;return f[13]- f[6];}
function buscar(b,j,prof,alfa,beta){
if(prof === 0 || terminada(b))return valor(b);
var ms = legales(b,j),mejor = j === 1 ? -1e9 : 1e9;
for(var k = 0;k < ms.length;k++){
var r = mover(b,ms[k],j),v = buscar(r.b,r.extra ? j : 1 - j,prof - 1,alfa,beta);
if(j === 1){if(v > mejor)mejor = v;if(v > alfa)alfa = v;}else{if(v < mejor)mejor = v;if(v < beta)beta = v;}
if(beta <= alfa)break;
}
return mejor;
}
function elegirCpu(b,nivel){
var ms = legales(b,1);
if(nivel === 'facil'){
if(Math.random()< 0.25)return ms[Math.floor(Math.random()* ms.length)];
var mejorV = -1e9,mejores =[];
ms.forEach(function(p){var r = mover(b,p,1),v = r.b[13]- b[13]+(r.extra ? 2 : 0);if(v > mejorV){mejorV = v;mejores =[p];}else if(v === mejorV)mejores.push(p);});
return mejores[Math.floor(Math.random()* mejores.length)];
}
var mejor = ms[0],mv = -1e9;
ms.forEach(function(p){var r = mover(b,p,1),v = buscar(r.b,r.extra ? 1 : 0,PROFUNDIDAD - 1,-1e9,1e9);if(v > mv){mv = v;mejor = p;}});
return mejor;
}
function limpiar(){temporizadores.forEach(clearTimeout);temporizadores =[];}
function esperar(ms,f){temporizadores.push(setTimeout(f,ms));}
function inicio(){
limpiar();g = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Mancala'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Siembra semillas por tus hoyos, encadena turnos extra y captura las del rival. Gana quien más semillas guarde en su almacén.'}));
var modos = h('div',{class: 'mc-modos',role: 'group','aria-label': 'Elige cómo jugar'});
modos.appendChild(h('button',{class: 'mc-modo',type: 'button','data-modo': '2j',onclick: function(){empezar('2j');}},h('b',{texto: 'Dos jugadores'}),h('small',{texto: 'En este mismo dispositivo, por turnos.'})));
Object.keys(NIVELES).forEach(function(k){
modos.appendChild(h('button',{class: 'mc-modo',type: 'button','data-modo': k,onclick: function(){empezar(k);}},h('b',{texto: 'Contra el ordenador · ' + NIVELES[k]}),
h('small',{texto: k === 'facil' ? 'Piensa una jugada por delante y a veces falla.' : 'Calcula varias jugadas por delante.'})));
});
raiz.appendChild(modos);
}
function empezar(modo){
limpiar();
g ={modo: modo,cpu: modo !== '2j',b: inicial(),turno: 0,ocupado: false,fin: false,n1: modo === '2j' ? 'Jugador 1' : 'Tú',n2: modo === '2j' ? 'Jugador 2' : 'Ordenador'};
TYJ.vaciar(raiz);
ui ={hoyos:[],alm:[]};
ui.hud = TYJ.hud([['turno','Turno',g.n1],['a',g.n1,0],['b',g.n2,0]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Empieza ' + g.n1.toLowerCase()+ '. Elige uno de tus hoyos (fila de abajo).'});
ui.tablero = h('div',{class: 'mc-tablero',role: 'group','aria-label': 'Tablero de mancala','data-ocupado': 'no','data-turno': '0'});
ui.alm[1]= h('div',{class: 'mc-almacen mc-almacen--2','data-i': '13',role: 'img','aria-label': 'Almacén de ' + g.n2},h('small',{texto: g.n2}),h('span',{class: 'mc-n'}));
ui.alm[0]= h('div',{class: 'mc-almacen mc-almacen--1','data-i': '6',role: 'img','aria-label': 'Almacén de ' + g.n1},h('small',{texto: g.n1}),h('span',{class: 'mc-n'}));
ui.tablero.appendChild(ui.alm[1]);
for(var i = 12;i >= 7;i--)ui.tablero.appendChild(hoyo(i,2,13 - i));
for(var k = 0;k <= 5;k++)ui.tablero.appendChild(hoyo(k,1,k + 1));
ui.tablero.appendChild(ui.alm[0]);
raiz.appendChild(h('h2',{texto: 'Mancala'}));
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('p',{class: 'texto',texto: g.n2 + ' juega los hoyos de arriba; ' + g.n1.toLowerCase()+ ', los de abajo.'}));
raiz.appendChild(ui.tablero);raiz.appendChild(ui.msg);
pintar();
}
function hoyo(i,fila,col){
var b = h('button',{class: 'mc-hoyo mc-hoyo--' + fila,type: 'button','data-i': String(i)},h('span',{class: 'mc-n'}));
b.style.setProperty('--col',String(col));
b.addEventListener('click',function(){jugar(i);});
ui.hoyos[i]= b;return b;
}
function pintar(){
var b = g.b;
ui.hoyos.forEach(function(el,i){
var j = i < 6 ? 0 : 1,n = b[i];
el.setAttribute('data-n',String(n));el.firstChild.textContent = String(n);
el.setAttribute('aria-label',(j === 0 ? g.n1 : g.n2)+ ', hoyo ' +(j === 0 ? i + 1 : i - 6)+ ', ' + n +(n === 1 ? ' semilla' : ' semillas'));
el.disabled = g.fin || g.ocupado || g.turno !== j || n === 0 ||(g.cpu && j === 1);
});
[0,1].forEach(function(j){var n = b[almacen(j)];ui.alm[j].setAttribute('data-n',String(n));ui.alm[j].querySelector('.mc-n').textContent = String(n);ui.alm[j].setAttribute('aria-label','Almacén de ' +(j === 0 ? g.n1 : g.n2)+ ': ' + n +(n === 1 ? ' semilla' : ' semillas'));});
ui.hud.poner('a',b[6]);ui.hud.poner('b',b[13]);
ui.hud.poner('turno',g.fin ? '—' :(g.turno === 0 ? g.n1 : g.n2));
ui.tablero.setAttribute('data-turno',String(g.turno));ui.tablero.setAttribute('data-ocupado',g.ocupado ? 'si' : 'no');
}
function jugar(pit){
if(!g || g.fin || g.ocupado)return;
var j = g.turno;
if(hoyosDe(j).indexOf(pit)< 0 || g.b[pit]=== 0)return;
var r = mover(g.b,pit,j),vivo = g.b.slice();
g.ocupado = true;
vivo[pit]= 0;g.b = vivo;pintar();
var k = 0;
(function paso(){
if(k < r.pasos.length){
var d = r.pasos[k++];g.b[d]++;pintar();ui.hoyos[d]? ui.hoyos[d].setAttribute('data-brillo','si'): ui.alm[d === 6 ? 0 : 1].setAttribute('data-brillo','si');
(function(dd){esperar(PASO_MS - 10,function(){var el = ui.hoyos[dd]|| ui.alm[dd === 6 ? 0 : 1];if(el)el.removeAttribute('data-brillo');});})(d);
esperar(PASO_MS,paso);return;
}
acabarJugada(r,j);
})();
}
function acabarJugada(r,j){
var texto = '';
g.b = r.b.slice();
if(r.captura)texto =(j === 0 ? g.n1 : g.n2)+ ' captura ' + r.captura.n + ' semillas.';
if(terminada(g.b)){g.b = cerrar(g.b);g.ocupado = false;g.fin = true;pintar();terminar();return;}
var siguiente = r.extra ? j : 1 - j;
g.turno = siguiente;g.ocupado = false;
var quien = siguiente === 0 ? g.n1 : g.n2;
ui.msg.textContent =(texto ? texto + ' ' : '')+(r.extra ? '¡Turno extra! Vuelve a jugar ' + quien.toLowerCase()+ '.' : 'Turno de ' + quien.toLowerCase()+ '.');
pintar();
if(g.cpu && siguiente === 1){
g.ocupado = true;pintar();
esperar(CPU_ESPERA,function(){g.ocupado = false;jugar(elegirCpu(g.b,g.modo));});
}
}
function terminar(){
var a = g.b[6],b = g.b[13],titulo;
if(a === b)titulo = 'Empate a ' + a + ' semillas';
else if(g.cpu)titulo = a > b ? '¡Has ganado!' : 'Gana el ordenador';
else titulo = 'Gana el jugador ' +(a > b ? 1 : 2);
var modo = g.modo;
TYJ.final(raiz,{titulo: titulo,puntos: g.cpu ? a : null,unidad: 'semillas en tu almacén',
detalles:[g.n1 + ': ' + a + ' semillas',g.n2 + ': ' + b + ' semillas'],
compartir: 'Mancala · ' + g.n1 + ' ' + a + ' - ' + b + ' ' + g.n2,alRepetir: function(){empezar(modo);},textoRepetir: 'Revancha'});
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: inicio},'Cambiar de modo')));
}
inicio();
})();
