(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('lab');
if(!raiz)return;
var N = 1,E = 2,S = 4,O = 8,DX ={1: 0,2: 1,4: 0,8: -1},DY ={1: -1,2: 0,4: 1,8: 0},OPUESTO ={1: 4,2: 8,4: 1,8: 2};
var CLASE ={1: 'lab-n',2: 'lab-e',4: 'lab-s',8: 'lab-o'};
var TAMANOS ={8: 'Fácil 8×8',12: 'Medio 12×12',16: 'Difícil 16×16',20: 'Experto 20×20',28: 'Maestro 28×28'};
var LUZ = 2,FRACCION_BUCLES = 0.12;
var sesion = TYJ.Sesion(null,{victorias: true,mejor: false});
var lado = 12,niebla = false,bucles = false,t = null,ui = null,reloj = null;
function generar(n,conBucles){
var m =[],vis ={},pila =[0],i;
for(i = 0;i < n * n;i++)m.push(0);
vis[0]= true;
while(pila.length){
var p = pila[pila.length - 1],x = p % n,y =(p - x)/ n,op =[];
[N,E,S,O].forEach(function(d){var nx = x + DX[d],ny = y + DY[d];if(nx >= 0 && ny >= 0 && nx < n && ny < n && !vis[ny * n + nx])op.push(d);});
if(!op.length){pila.pop();continue;}
var d = U.elegir(op),q =(y + DY[d])* n + x + DX[d];
m[p]|= d;m[q]|= OPUESTO[d];vis[q]= true;pila.push(q);
}
if(conBucles){
var cerradas =[];
for(i = 0;i < n * n;i++){
var cx = i % n,cy =(i - cx)/ n;
if(cx < n - 1 && !(m[i]& E))cerradas.push([i,E,i + 1]);
if(cy < n - 1 && !(m[i]& S))cerradas.push([i,S,i + n]);
}
U.muestra(cerradas,Math.round(n * n * FRACCION_BUCLES)).forEach(function(c){m[c[0]]|= c[1];m[c[2]]|= OPUESTO[c[1]];});
}
return m;
}
function camino(m,n){
var dist ={0: 0},cola =[0];
while(cola.length){
var p = cola.shift(),x = p % n,y =(p - x)/ n;
if(p === n * n - 1)return dist[p];
[N,E,S,O].forEach(function(d){if(m[p]& d){var q =(y + DY[d])* n + x + DX[d];if(dist[q]== null){dist[q]= dist[p]+ 1;cola.push(q);}}});
}
return 0;
}
function nueva(){
clearInterval(reloj);
t ={n: lado,niebla: niebla,bucles: bucles,m: generar(lado,bucles),pos: 0,pasos: 0,ini: null,fin: false,vistas:{0: true},luz:{}};
revelar();
montar();pintar();
}
function revelar(){
var x = t.pos % t.n,y =(t.pos - x)/ t.n;
for(var dy = -LUZ;dy <= LUZ;dy++)for(var dx = -LUZ;dx <= LUZ;dx++){
var nx = x + dx,ny = y + dy;
if(nx >= 0 && ny >= 0 && nx < t.n && ny < t.n)t.luz[ny * t.n + nx]= true;
}
}
function nivelTexto(){return TAMANOS[t.n]+(t.niebla ? ' · niebla' : '')+(t.bucles ? ' · con bucles' : '');}
function montar(){
TYJ.vaciar(raiz);
ui ={celdas:[]};
ui.tam = h('div',{class: 'fila',role: 'group','aria-label': 'Tamaño del laberinto'});
Object.keys(TAMANOS).forEach(function(k){
ui.tam.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(+k === lado),onclick: function(){lado = +k;nueva();}},TAMANOS[k]));
});
ui.modos = h('div',{class: 'fila',role: 'group','aria-label': 'Opciones de dificultad'},
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','data-modo': 'niebla','aria-pressed': String(niebla),onclick: function(){niebla = !niebla;nueva();}},'Niebla'),
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','data-modo': 'bucles','aria-pressed': String(bucles),onclick: function(){bucles = !bucles;nueva();}},'Con bucles'));
ui.hud = TYJ.hud([['pasos','Pasos','0'],['tiempo','Tiempo','0:00']]);
ui.tablero = h('div',{class: 'lab-tablero' +(t.n >= 20 ? ' lab-denso' : ''),tabindex: '0',role: 'application',
'aria-label': 'Laberinto de ' + t.n + ' por ' + t.n +(t.niebla ? ', con niebla: solo se ven las casillas cercanas' : '')+(t.bucles ? ', con bucles' : '')+ '. Muévete con las flechas del teclado.'});
ui.tablero.style.gridTemplateColumns = 'repeat(' + t.n + ', minmax(0, 1fr))';
t.m.forEach(function(v,i){
var c = h('span',{class: 'lab-celda' +[N,E,S,O].map(function(d){return v & d ? ' ' + CLASE[d]: '';}).join('')});
ui.celdas.push(c);ui.tablero.appendChild(c);
});
ui.tablero.addEventListener('keydown',function(e){
var d ={ArrowUp: N,ArrowRight: E,ArrowDown: S,ArrowLeft: O,w: N,W: N,d: E,D: E,s: S,S: S,a: O,A: O}[e.key];
if(d){e.preventDefault();mover(d);}
});
ui.mando = h('div',{class: 'lab-mando',role: 'group','aria-label': 'Botones de movimiento'});
[['lab-arriba',N,'↑','Subir'],['lab-izq',O,'←','Ir a la izquierda'],['lab-abajo',S,'↓','Bajar'],['lab-der',E,'→','Ir a la derecha']].forEach(function(b){
ui.mando.appendChild(h('button',{class: 'boton-retro boton-retro--sec lab-boton ' + b[0],type: 'button','aria-label': b[3],'data-dir': String(b[1]),onclick: function(){mover(b[1]);}},b[2]));
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Llega al cuadrado de la esquina inferior derecha.' +(t.niebla ? ' Con niebla solo ves lo que tienes cerca.' : '')});
ui.final = h('div');ui.est = h('div');
[ui.tam,ui.modos,ui.hud.nodo,ui.tablero,ui.mando,ui.msg,h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: nueva},'Otro laberinto')),ui.final,ui.est]
.forEach(function(x){raiz.appendChild(x);});
sesion.montar(ui.est);
}
function pintar(){
var px = t.pos % t.n,py =(t.pos - px)/ t.n;
ui.celdas.forEach(function(c,i){
var vel = '';
if(t.niebla)vel = !t.luz[i]? ' lab-oculta' :(Math.abs(i % t.n - px)> LUZ || Math.abs(Math.floor(i / t.n)- py)> LUZ ? ' lab-recuerdo' : '');
c.className = c.className.replace(/ lab-(paso|yo|meta|oculta|recuerdo)/g,'')+(t.vistas[i]? ' lab-paso' : '')+(i === t.pos ? ' lab-yo' : '')+(i === t.n * t.n - 1 ? ' lab-meta' : '')+ vel;
});
ui.hud.poner('pasos',t.pasos);
}
function mover(d){
if(t.fin || !(t.m[t.pos]& d))return;
if(!t.ini){t.ini = Date.now();reloj = setInterval(function(){ui.hud.poner('tiempo',U.tiempo((Date.now()- t.ini)/ 1000 - 0.999));},500);}
var x = t.pos % t.n,y =(t.pos - x)/ t.n;
t.pos =(y + DY[d])* t.n + x + DX[d];t.pasos++;t.vistas[t.pos]= true;
revelar();pintar();
if(t.pos === t.n * t.n - 1)acabar();
}
function acabar(){
clearInterval(reloj);t.fin = true;
var seg = Math.round((Date.now()- t.ini)/ 1000),corto = camino(t.m,t.n);
sesion.registrar(0,true);
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Has llegado a la salida!',nivel: nivelTexto(),puntos: t.pasos,unidad: 'pasos',
detalles:['Camino más corto posible: ' + corto + ' pasos.','Tiempo: ' + U.tiempo(seg)+ '.'],
compartir: 'Laberinto ' + nivelTexto()+ ': he salido en ' + t.pasos + ' pasos (el mínimo era ' + corto + ') y ' + U.tiempo(seg)+ '.',
textoRepetir: 'Otro laberinto',alRepetir: nueva});
}
nueva();
})();
