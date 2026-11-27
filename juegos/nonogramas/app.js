(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('ng');
if(!raiz)return;
var TAMANOS ={5: 'Fácil · 5×5',8: 'Media · 8×8',10: 'Difícil · 10×10'};
var sesion = TYJ.Sesion(null,{victorias: true,mejor: true,etiquetaMejor: 'Mejor puntuación: ',racha: false});
var tam = 5,modo = 'pintar',g = null,ui = null,reloj = null;
function pistasDe(linea){
var r =[],n = 0;
for(var i = 0;i < linea.length;i++){if(linea[i])n++;else if(n){r.push(n);n = 0;}}
if(n)r.push(n);
return r.length ? r :[0];
}
function iguales(a,b){return a.length === b.length && a.every(function(x,i){return x === b[i];});}
function colocaciones(pistas,linea){
var n = linea.length,sol =[],actual =[];
var bloques = pistas[0]=== 0 ?[]: pistas;
function ok(desde,hasta,valor){for(var i = desde;i < hasta;i++)if(linea[i]!== -1 && linea[i]!== valor)return false;return true;}
function poner(k,pos){
if(k === bloques.length){
if(ok(pos,n,0))sol.push(actual.concat(new Array(n - pos).fill(0)));
return;
}
var resto = 0;
for(var j = k + 1;j < bloques.length;j++)resto += bloques[j]+ 1;
for(var ini = pos;ini + bloques[k]+ resto <= n;ini++){
if(!ok(pos,ini,0)|| !ok(ini,ini + bloques[k],1)){if(!ok(pos,ini,0))break;continue;}
var fin = ini + bloques[k],sepa = k < bloques.length - 1 ? 1 : 0;
if(sepa && !ok(fin,fin + 1,0))continue;
var antes = actual.length;
for(var a = pos;a < ini;a++)actual.push(0);
for(var b = ini;b < fin;b++)actual.push(1);
if(sepa)actual.push(0);
poner(k + 1,fin + sepa);
actual.length = antes;
}
}
poner(0,0);
return sol;
}
function resolver(filas,columnas,n){
var m =[];for(var i = 0;i < n * n;i++)m.push(-1);
var cambio = true;
while(cambio){
cambio = false;
for(var d = 0;d < 2;d++){
for(var k = 0;k < n;k++){
var linea =[],idx =[];
for(var j = 0;j < n;j++){var c = d === 0 ? k * n + j : j * n + k;idx.push(c);linea.push(m[c]);}
var sol = colocaciones(d === 0 ? filas[k]: columnas[k],linea);
if(!sol.length)return null;
for(var q = 0;q < n;q++){
if(linea[q]!== -1)continue;
var v = sol[0][q],igual = sol.every(function(s){return s[q]=== v;});
if(igual){m[idx[q]]= v;cambio = true;}
}
}
}
}
return m.indexOf(-1)< 0 ? m : null;
}
function generar(n){
var intentos = 0,mejor = null;
while(intentos < 400){
intentos++;
var dens = 0.5 + Math.random()* 0.15,cel =[];
for(var i = 0;i < n * n;i++)cel.push(Math.random()< dens ? 1 : 0);
var filas =[],cols =[];
for(var k = 0;k < n;k++){
var f =[],c =[];
for(var j = 0;j < n;j++){f.push(cel[k * n + j]);c.push(cel[j * n + k]);}
filas.push(pistasDe(f));cols.push(pistasDe(c));
}
var llenas = cel.reduce(function(a,b){return a + b;},0);
if(llenas < n * n * 0.4 || filas.some(function(p){return p[0]=== 0;})|| cols.some(function(p){return p[0]=== 0;}))continue;
mejor ={cel: cel,filas: filas,cols: cols};
var s = resolver(filas,cols,n);
if(s)return mejor;
}
return mejor;
}
function nueva(){
detener();
var p = generar(tam);
g ={n: tam,sol: p.cel,filas: p.filas,cols: p.cols,est: p.cel.map(function(){return 0;}),inicio: 0,seg: 0,ayudas: 0,fin: false};
montar();arrancarReloj();
}
function detener(){if(reloj){clearInterval(reloj);reloj = null;}}
function arrancarReloj(){
g.inicio = performance.now();
reloj = setInterval(function(){g.seg = Math.floor((performance.now()- g.inicio)/ 1000);ui.hud.poner('tiempo',g.seg + ' s');},500);
}
function lineaPintada(k,fila){
var l =[];
for(var j = 0;j < g.n;j++)l.push(g.est[fila ? k * g.n + j : j * g.n + k]=== 1 ? 1 : 0);
return l;
}
function pintarPistas(){
for(var k = 0;k < g.n;k++){
ui.pistasFila[k].classList.toggle('ng-pista--hecha',iguales(pistasDe(lineaPintada(k,true)),g.filas[k]));
ui.pistasCol[k].classList.toggle('ng-pista--hecha',iguales(pistasDe(lineaPintada(k,false)),g.cols[k]));
}
}
function pintarCelda(i){
var b = ui.celdas[i],e = g.est[i];
b.className = 'ng-celda' +(e === 1 ? ' ng-celda--llena' : e === 2 ? ' ng-celda--cruz' : '');
b.textContent = e === 2 ? '✕' : '';
b.setAttribute('aria-label','Fila ' +(Math.floor(i / g.n)+ 1)+ ', columna ' +(i % g.n + 1)+ ': ' +(e === 1 ? 'pintada' : e === 2 ? 'marcada vacía' : 'sin marcar'));
b.setAttribute('aria-pressed',String(e === 1));
}
function completo(){
for(var k = 0;k < g.n;k++){
if(!iguales(pistasDe(lineaPintada(k,true)),g.filas[k]))return false;
if(!iguales(pistasDe(lineaPintada(k,false)),g.cols[k]))return false;
}
return true;
}
function alPulsar(i){
if(g.fin)return;
var deseado = modo === 'pintar' ? 1 : 2;
g.est[i]= g.est[i]=== deseado ? 0 : deseado;
pintarCelda(i);pintarPistas();
if(completo())terminar();
}
function comprobar(){
if(g.fin)return;
var mal = 0;
for(var i = 0;i < g.est.length;i++)if(g.est[i]=== 1 && !g.sol[i]){mal++;ui.celdas[i].classList.add('ng-celda--error');}
g.ayudas++;
ui.msg.textContent = mal ? 'Hay ' + mal +(mal === 1 ? ' casilla pintada que no debería estarlo (en rosa).' : ' casillas pintadas que no deberían estarlo (en rosa).'): 'Todo lo que has pintado es correcto.';
TYJ.anunciar(ui.msg.textContent);
}
function pista(){
if(g.fin)return;
var cand =[];
for(var i = 0;i < g.est.length;i++)if((g.est[i]=== 1)!==(g.sol[i]=== 1))cand.push(i);
if(!cand.length)return;
var i2 = cand[U.entre(0,cand.length - 1)];
g.est[i2]= g.sol[i2]? 1 : 2;g.ayudas++;
pintarCelda(i2);pintarPistas();
ui.msg.textContent = 'Pista: la casilla de la fila ' +(Math.floor(i2 / g.n)+ 1)+ ' y columna ' +(i2 % g.n + 1)+(g.sol[i2]? ' va pintada.' : ' va vacía.');
TYJ.anunciar(ui.msg.textContent);
if(completo())terminar();
}
function terminar(){
g.fin = true;detener();
g.seg = Math.floor((performance.now()- g.inicio)/ 1000);
ui.hud.poner('tiempo',g.seg + ' s');
var puntos = Math.max(10,g.n * g.n * 10 - 2 * g.seg - 50 * g.ayudas);
ui.celdas.forEach(function(b){b.disabled = true;});
sesion.registrar(puntos,true);
ui.msg.textContent = '';
TYJ.final(ui.final.appendChild(h('div')),{titulo: '¡Puzle resuelto!',puntos: puntos,unidad: 'puntos',nivel: TAMANOS[g.n],
detalles:['Tiempo: ' + g.seg + ' s','Ayudas usadas: ' + g.ayudas],
compartir: 'Nonogramas ' + g.n + '×' + g.n + ': resuelto en ' + g.seg + ' s con ' + g.ayudas +(g.ayudas === 1 ? ' ayuda' : ' ayudas')+ ' (' + puntos + ' puntos).',textoRepetir: 'Otro puzle',alRepetir: nueva});
}
function grupo(etiqueta,valores,actual,alElegir){
var gr = h('div',{class: 'fila',role: 'group','aria-label': etiqueta});
valores.forEach(function(v){
gr.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(String(v[0])=== String(actual)),onclick: function(ev){
alElegir(v[0]);
gr.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b === ev.currentTarget));});
}},v[1]));
});
return gr;
}
function montar(){
TYJ.vaciar(raiz);ui ={};
ui.hud = TYJ.hud([['tiempo','Tiempo','0 s'],['ayudas','Ayudas','0']]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Pinta las casillas según los números de cada fila y de cada columna.'});
ui.pistasFila =[];ui.pistasCol =[];ui.celdas =[];
var n = g.n,cuadricula = h('div',{class: 'ng-cuadricula',role: 'group','aria-label': 'Nonograma de ' + n + ' por ' + n});
cuadricula.style.setProperty('--n',String(n));
cuadricula.appendChild(h('span',{class: 'ng-esquina'}));
for(var c = 0;c < n;c++){
var pc = h('span',{class: 'ng-pista ng-pista--col','aria-label': 'Columna ' +(c + 1)+ ': ' + g.cols[c].join(', ')},g.cols[c].map(function(x){return h('span',{texto: String(x)});}));
ui.pistasCol.push(pc);cuadricula.appendChild(pc);
}
for(var f = 0;f < n;f++){
var pf = h('span',{class: 'ng-pista ng-pista--fila','aria-label': 'Fila ' +(f + 1)+ ': ' + g.filas[f].join(', ')},g.filas[f].map(function(x){return h('span',{texto: String(x)});}));
ui.pistasFila.push(pf);cuadricula.appendChild(pf);
for(var cc = 0;cc < n;cc++){
(function(i){
var b = h('button',{class: 'ng-celda',type: 'button','data-i': String(i),tabindex: i === 0 ? '0' : '-1',onclick: function(){alPulsar(i);},onkeydown: function(ev){flechas(ev,i);}});
if(cc % 5 === 4 && cc < n - 1)b.classList.add('ng-borde-d');
if(f % 5 === 4 && f < n - 1)b.classList.add('ng-borde-b');
ui.celdas.push(b);cuadricula.appendChild(b);
})(f * n + cc);
}
}
ui.final = h('div');ui.est = h('div');
var controles = h('div',{class: 'ng-controles'},
grupo('Tamaño',Object.keys(TAMANOS).map(function(k){return[k,TAMANOS[k]];}),tam,function(k){tam = Number(k);nueva();}),
grupo('Qué haces al pulsar',[['pintar','Pintar'],['cruz','Marcar vacía (✕)']],modo,function(m){modo = m;}),
h('div',{class: 'fila'},
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){comprobar();ui.hud.poner('ayudas',g.ayudas);}},'Comprobar (−50)'),
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){pista();ui.hud.poner('ayudas',g.ayudas);}},'Pista (−50)'),
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: nueva},'Otro puzle')));
[controles,ui.hud.nodo,h('div',{class: 'ng-zona'},cuadricula),ui.msg,ui.final,ui.est].forEach(function(x){raiz.appendChild(x);});
sesion.montar(ui.est);
ui.celdas.forEach(function(b,i){pintarCelda(i);});
pintarPistas();
}
function flechas(ev,i){
var n = g.n,x = i % n,y = Math.floor(i / n),j = null;
if(ev.key === 'ArrowLeft' && x > 0)j = i - 1;else if(ev.key === 'ArrowRight' && x < n - 1)j = i + 1;
else if(ev.key === 'ArrowUp' && y > 0)j = i - n;else if(ev.key === 'ArrowDown' && y < n - 1)j = i + n;
if(j === null)return;
ev.preventDefault();
ui.celdas.forEach(function(b){b.setAttribute('tabindex','-1');});
ui.celdas[j].setAttribute('tabindex','0');ui.celdas[j].focus();
}
nueva();
})();
