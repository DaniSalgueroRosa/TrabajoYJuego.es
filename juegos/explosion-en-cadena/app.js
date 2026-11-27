(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('ec');
if(!raiz)return;
var N = 6,TOQUES = 12,ONDA_MS = 150,ONDA_RAPIDA_MS = 70,LENTAS = 12;
var RANGOS =[[0,'Chispa'],[300,'Mecha corta'],[1000,'Artificiero'],[2500,'Maestro de la demolición'],[5000,'Reacción en cadena']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var ui = null,g = null,temporizador = 0;
function carga(){var r = Math.random();return r < 0.15 ? 0 : r < 0.35 ? 1 : r < 0.65 ? 2 : 3;}
function inicio(){
clearTimeout(temporizador);g = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Explosión en cadena'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Cada toque suma una carga. A la cuarta, la casilla revienta y reparte una a cada vecina. Tienes doce toques.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Empezar')));
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function jugar(){
clearTimeout(temporizador);
g ={v:[],toques: TOQUES,puntos: 0,mejor: 0,ocupado: false,fin: false};
for(var i = 0;i < N * N;i++)g.v.push(carga());
TYJ.vaciar(raiz);
ui ={celdas:[]};
ui.hud = TYJ.hud([['toques','Toques',TOQUES],['puntos','Puntos',0],['cadena','Mejor cadena',0]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Toca una casilla para sumarle una carga.'});
ui.tablero = h('div',{class: 'ec-tablero',role: 'group','aria-label': 'Tablero de 6 por 6 casillas','data-ocupado': 'no'});
for(var k = 0;k < N * N;k++)(function(k){
var b = h('button',{class: 'ec-celda',type: 'button','data-i': String(k)});
b.addEventListener('click',function(){tocar(k);});
b.addEventListener('keydown',function(ev){mover(ev,k);});
ui.celdas.push(b);ui.tablero.appendChild(b);
})(k);
raiz.appendChild(ui.hud.nodo);raiz.appendChild(ui.tablero);raiz.appendChild(ui.msg);
pintar();
}
function mover(ev,k){
var f = Math.floor(k / N),c = k % N,d = null;
if(ev.key === 'ArrowLeft')d = c > 0 ? k - 1 : null;else if(ev.key === 'ArrowRight')d = c < N - 1 ? k + 1 : null;
else if(ev.key === 'ArrowUp')d = f > 0 ? k - N : null;else if(ev.key === 'ArrowDown')d = f < N - 1 ? k + N : null;else return;
ev.preventDefault();
if(d !== null)ui.celdas[d].focus();
}
function pintar(){
g.v.forEach(function(x,k){
var b = ui.celdas[k];
b.setAttribute('data-valor',String(x));b.textContent = x ? String(x): '';
b.setAttribute('aria-label','Fila ' +(Math.floor(k / N)+ 1)+ ', columna ' +(k % N + 1)+ ', carga ' + x);
});
}
function tocar(k){
if(!g || g.fin || g.ocupado || g.toques <= 0)return;
g.toques--;g.v[k]++;
ui.hud.poner('toques',g.toques,g.toques <= 2);
var enfocada = document.activeElement === ui.celdas[k];
g.ocupado = true;ui.tablero.setAttribute('data-ocupado','si');
pintar();
if(enfocada)ui.celdas[k].focus({preventScroll: true});
oleada(0,0);
}
function oleada(total,n){
var reventar =[];
g.v.forEach(function(x,k){if(x >= 4)reventar.push(k);});
if(!reventar.length || n > 2000){acabar(total);return;}
reventar.forEach(function(k){
var f = Math.floor(k / N),c = k % N;
g.v[k]-= 4;
if(f > 0)g.v[k - N]++;if(f < N - 1)g.v[k + N]++;if(c > 0)g.v[k - 1]++;if(c < N - 1)g.v[k + 1]++;
});
pintar();
reventar.forEach(function(k){ui.celdas[k].setAttribute('data-boom','si');});
temporizador = setTimeout(function(){reventar.forEach(function(k){ui.celdas[k].removeAttribute('data-boom');});oleada(total + reventar.length,n + 1);},n < LENTAS ? ONDA_MS : ONDA_RAPIDA_MS);
}
function acabar(total){
var ganado = 10 * total * total;
g.puntos += ganado;if(total > g.mejor)g.mejor = total;
ui.hud.poner('puntos',U.miles(g.puntos));ui.hud.poner('cadena',g.mejor);
ui.msg.textContent = total ? '¡Cadena de ' + total + '! +' + U.miles(ganado)+ ' puntos.' : 'Sin explosiones. Prepara el terreno para el siguiente toque.';
g.ocupado = false;ui.tablero.setAttribute('data-ocupado','no');
if(g.toques <= 0){temporizador = setTimeout(terminar,500);}
}
function terminar(){
g.fin = true;
sesion.registrar(g.puntos);
var nivel = U.nivel(g.puntos,RANGOS);
TYJ.final(raiz,{titulo: 'Se acabaron los toques',puntos: g.puntos,unidad: 'puntos',nivel: nivel,
detalles:['Cadena más larga: ' + g.mejor +(g.mejor === 1 ? ' casilla' : ' casillas')],
compartir: 'Explosión en cadena · ' + U.miles(g.puntos)+ ' puntos, cadena de ' + g.mejor + ' (' + nivel + ')',alRepetir: jugar});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();
