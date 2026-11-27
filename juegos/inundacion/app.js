(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('inu');
if(!raiz)return;
var TAMANOS ={8:{nombre: 'Pequeño 8×8',colores: 5,limite: 16},10:{nombre: 'Mediano 10×10',colores: 6,limite: 22},12:{nombre: 'Grande 12×12',colores: 6,limite: 27}};
var sesion = TYJ.Sesion(null,{victorias: true,racha: true,mejor: false});
var lado = 10,t = null,ui = null;
function vecinos(p,n){
var x = p % n,y =(p - x)/ n,r =[];
if(x > 0)r.push(p - 1);if(x < n - 1)r.push(p + 1);if(y > 0)r.push(p - n);if(y < n - 1)r.push(p + n);
return r;
}
function region(g,n){
var c = g[0],vistas ={},pila =[0],lista =[];
vistas[0]= true;
while(pila.length){
var p = pila.pop();lista.push(p);
vecinos(p,n).forEach(function(q){if(!vistas[q]&& g[q]=== c){vistas[q]= true;pila.push(q);}});
}
return lista;
}
function generar(n,k){
var g,i;
do{g =[];for(i = 0;i < n * n;i++)g.push(U.azar(k));}while(region(g,n).length > n * n / 4);
return g;
}
function nueva(){
var d = TAMANOS[lado];
t ={n: lado,k: d.colores,limite: d.limite,g: generar(lado,d.colores),mov: 0,fin: false};
montar();pintar();
}
function montar(){
TYJ.vaciar(raiz);
ui ={celdas:[],botones:[]};
ui.tam = h('div',{class: 'fila',role: 'group','aria-label': 'Tamaño del tablero'});
Object.keys(TAMANOS).forEach(function(k){
ui.tam.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(+k === lado),onclick: function(){lado = +k;nueva();}},TAMANOS[k].nombre));
});
ui.hud = TYJ.hud([['mov','Movimientos','0'],['limite','Límite',String(t.limite)],['area','Tu territorio','']]);
ui.tablero = h('div',{class: 'inu-tablero',role: 'img'});
ui.tablero.style.gridTemplateColumns = 'repeat(' + t.n + ', minmax(0, 1fr))';
for(var i = 0;i < t.n * t.n;i++){var c = h('span',{class: 'inu-celda'});ui.celdas.push(c);ui.tablero.appendChild(c);}
ui.colores = h('div',{class: 'inu-colores',role: 'group','aria-label': 'Elige un color (teclas 1 a ' + t.k + ')'});
for(var j = 0;j < t.k;j++)(function(j){
var b = h('button',{class: 'inu-color inu-c' + j,type: 'button','data-color': String(j),'aria-label': 'Color ' +(j + 1),onclick: function(){mover(j);}},String(j + 1));
ui.botones.push(b);ui.colores.appendChild(b);
})(j);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Elige un color para ampliar tu territorio desde la esquina superior izquierda.'});
ui.final = h('div');ui.est = h('div');
[ui.tam,ui.hud.nodo,ui.tablero,ui.colores,ui.msg,h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: nueva},'Otro tablero')),ui.final,ui.est]
.forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function pintar(){
var area = region(t.g,t.n).length;
t.g.forEach(function(c,i){ui.celdas[i].className = 'inu-celda inu-c' + c;ui.celdas[i].textContent = String(c + 1);});
ui.tablero.setAttribute('aria-label','Tablero de ' + t.n + ' por ' + t.n + '. Tu territorio ocupa ' + area + ' de ' + t.n * t.n + ' casillas y es del color ' +(t.g[0]+ 1)+ '.');
ui.hud.poner('mov',t.mov,t.limite - t.mov <= 2 && !t.fin);
ui.hud.poner('area',area + ' / ' + t.n * t.n);
ui.botones.forEach(function(b,j){b.disabled = t.fin || j === t.g[0];});
return area;
}
function mover(c){
if(t.fin || c === t.g[0]|| c < 0 || c >= t.k)return;
region(t.g,t.n).forEach(function(p){t.g[p]= c;});
t.mov++;
var area = pintar();
ui.msg.textContent = 'Movimiento ' + t.mov + ' de ' + t.limite + ': color ' +(c + 1)+ '. Tu territorio: ' + area + ' casillas.';
if(area === t.n * t.n){t.fin = true;pintar();return acabar(true);}
if(t.mov >= t.limite){t.fin = true;pintar();return acabar(false);}
}
function acabar(gano){
ui.msg.textContent = '';
sesion.registrar(0,gano);
TYJ.final(ui.final.appendChild(h('div')),{titulo: gano ? '¡Tablero inundado!' : 'Te has quedado sin movimientos',nivel: TAMANOS[lado].nombre,
puntos: gano ? t.mov : null,unidad: 'movimientos',
detalles:[gano ? 'Límite del tablero: ' + t.limite + ' movimientos.' : 'Tu territorio llegó a ' + region(t.g,t.n).length + ' de ' + t.n * t.n + ' casillas.'],
compartir: 'Inundación (' + TAMANOS[lado].nombre.toLowerCase()+ '): ' +(gano ? 'lo he llenado en ' + t.mov + ' de ' + t.limite + ' movimientos' : 'me he quedado a ' +(t.n * t.n - region(t.g,t.n).length)+ ' casillas')+ '.',
textoRepetir: 'Otro tablero',alRepetir: nueva});
}
document.addEventListener('keydown',function(e){
if(!t || t.fin || e.ctrlKey || e.metaKey || e.altKey)return;
var n = parseInt(e.key,10);
if(n >= 1 && n <= t.k && raiz.isConnected)mover(n - 1);
});
nueva();
})();
