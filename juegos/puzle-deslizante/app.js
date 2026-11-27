(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('pd');
if(!raiz)return;
var NIVELES ={
facil:{nombre: 'Fácil (3×3)',n: 3,mezcla: 60,base: 800,k: 6},
medio:{nombre: 'Medio (4×4)',n: 4,mezcla: 200,base: 2000,k: 6},
dificil:{nombre: 'Difícil (5×5)',n: 5,mezcla: 400,base: 4000,k: 8}
};
var NIVELES_FINAL =[[0,'Aprendiz'],[300,'Ordenado'],[700,'Paciente'],[1200,'Maestro del puzle'],[2000,'Gran maestro']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var nivel = 'medio',g = null,ui = null,reloj = null;
function resuelto(c){for(var i = 0;i < c.length - 1;i++)if(c[i]!== i + 1)return false;return true;}
function mezclar(n,pasos){
var c =[];for(var i = 1;i < n * n;i++)c.push(i);c.push(0);
var hueco = n * n - 1,anterior = -1;
for(var k = 0;k < pasos;k++){
var r = Math.floor(hueco / n),col = hueco % n,opciones =[];
if(r > 0)opciones.push(hueco - n);if(r < n - 1)opciones.push(hueco + n);if(col > 0)opciones.push(hueco - 1);if(col < n - 1)opciones.push(hueco + 1);
opciones = opciones.filter(function(o){return o !== anterior;});
var o = U.elegir(opciones);
c[hueco]= c[o];c[o]= 0;anterior = hueco;hueco = o;
}
return c;
}
function nueva(){
clearInterval(reloj);
var cfg = NIVELES[nivel],c;
do{c = mezclar(cfg.n,cfg.mezcla);}while(resuelto(c));
g ={cfg: cfg,n: cfg.n,c: c,movs: 0,t0: 0,segundos: 0,fin: false};
montar();pintar();
TYJ.anunciar('Nuevo puzle de ' + g.n + ' por ' + g.n + '. Ordena las fichas del 1 al ' +(g.n * g.n - 1)+ '.');
}
function arrancarReloj(){
if(g.t0)return;
g.t0 = performance.now();
reloj = setInterval(function(){g.segundos = Math.floor((performance.now()- g.t0)/ 1000);ui.hud.poner('tiempo',U.tiempo(g.segundos));},500);
}
function deslizar(pos){
if(g.fin)return;
var n = g.n,hueco = g.c.indexOf(0),r = Math.floor(pos / n),c = pos % n,hr = Math.floor(hueco / n),hc = hueco % n;
if(pos === hueco ||(r !== hr && c !== hc))return;
arrancarReloj();
var paso = r === hr ?(c < hc ? 1 : -1):(r < hr ? n : -n),cur = hueco;
while(cur !== pos){g.c[cur]= g.c[cur - paso];cur -= paso;g.movs++;}
g.c[pos]= 0;
pintar();
if(resuelto(g.c))ganar();
}
function flecha(dx,dy){
var n = g.n,hueco = g.c.indexOf(0),r = Math.floor(hueco / n)- dy,c = hueco % n - dx;
if(r < 0 || r >= n || c < 0 || c >= n)return;
deslizar(r * n + c);
}
function ganar(){
g.fin = true;clearInterval(reloj);
g.segundos = Math.floor((performance.now()- g.t0)/ 1000);
var puntos = Math.max(100,g.cfg.base - g.movs * g.cfg.k - g.segundos);
sesion.registrar(puntos,true);
var nv = U.nivel(puntos,NIVELES_FINAL);
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Puzle ordenado!',puntos: puntos,unidad: 'puntos',nivel: nv,
detalles:['Movimientos: ' + g.movs,'Tiempo: ' + U.tiempo(g.segundos),'Tamaño: ' + g.n + '×' + g.n],
compartir: 'Puzle deslizante (' + g.n + '×' + g.n + '): ' + g.movs + ' movimientos en ' + U.tiempo(g.segundos)+ '.',textoRepetir: 'Otro puzle',alRepetir: nueva});
ui.msg.textContent = '';
}
function montar(){
TYJ.vaciar(raiz);
ui ={fichas:{}};
ui.niveles = h('div',{class: 'fila',role: 'group','aria-label': 'Tamaño del puzle'});
Object.keys(NIVELES).forEach(function(k){
ui.niveles.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(k === nivel),onclick: function(){nivel = k;nueva();}},NIVELES[k].nombre));
});
ui.hud = TYJ.hud([['movs','Movimientos',0],['bien','En su sitio','0 / ' +(g.n * g.n - 1)],['tiempo','Tiempo','0:00']]);
ui.tablero = h('div',{class: 'pd-tablero',role: 'group','aria-label': 'Puzle deslizante de ' + g.n + ' por ' + g.n,style: '--n:' + g.n});
for(var v = 1;v < g.n * g.n;v++)(function(v){
var b = h('button',{class: 'pd-ficha',type: 'button',onclick: function(){deslizar(g.c.indexOf(v));}},String(v));
ui.fichas[v]= b;ui.tablero.appendChild(b);
})(v);
ui.tablero.addEventListener('keydown',function(ev){
var d ={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[ev.key];
if(!d || ev.ctrlKey || ev.metaKey || ev.altKey)return;
ev.preventDefault();flecha(d[0],d[1]);
});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'},'Toca una ficha para deslizarla hacia el hueco. Ordénalas del 1 al ' +(g.n * g.n - 1)+ ', con el hueco abajo a la derecha.');
ui.final = h('div');ui.est = h('div');
[ui.niveles,ui.hud.nodo,ui.tablero,ui.msg,
h('div',{class: 'fila fila--centro'},h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: nueva},'Mezclar de nuevo')),
ui.final,ui.est].forEach(function(x){raiz.appendChild(x);});
sesion.montar(ui.est);
}
function pintar(){
var n = g.n,bien = 0;
g.c.forEach(function(v,i){
if(!v)return;
var b = ui.fichas[v],r = Math.floor(i / n),c = i % n,enSitio = v === i + 1;
if(enSitio)bien++;
b.style.setProperty('--x',String(c));b.style.setProperty('--y',String(r));
b.className = 'pd-ficha' +(enSitio ? ' pd-sitio' : '');
b.setAttribute('aria-label','Ficha ' + v + ', fila ' +(r + 1)+ ', columna ' +(c + 1)+(enSitio ? ', en su sitio' : ''));
});
ui.hud.poner('movs',g.movs);ui.hud.poner('bien',bien + ' / ' +(n * n - 1));
ui.tablero.setAttribute('data-tablero',g.c.join(','));
ui.tablero.setAttribute('data-movs',String(g.movs));
}
nueva();
})();
