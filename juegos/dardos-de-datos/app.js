(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('dd');
if(!raiz)return;
var NS = 'http://www.w3.org/2000/svg';
var META = 301,DARDOS = 5,VISIBLES = 12,R = 170,C = 200;
var UMBRALES =[301,200,100,50,25,10];
var ETIQUETAS =[200,100,50,25,10];
var NIVELES =[[0,'Dardo suelto'],[40,'Aficionado'],[70,'Buen pulso'],[90,'Francotirador'],[100,'Diana']];
var reducido = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var sesion = TYJ.Sesion(null,{victorias: true,racha: true});
var cats = null,modo = 'dia',t = null,ui = null,timers =[];
var ICONOS ={
globo:['...######...','.##..##..##.','.#...##...#.','##...##...##','############','##...##...##','##...##...##','############','.#...##...#.','.##..##..##.','...######...'],
mapa:['...######...','..########..','.####..####.','.###....###.','.####..####.','..########..','...######...','....####....','.....##.....'],
montana:['............','.....#......','....###.....','...#####..#.','..#######.##','.###########','############'],
rio:['............','..##....##..','.#..#..#..#.','#....##....#','............','..##....##..','.#..#..#..#.','#....##....#'],
cine:['#.#.#.#.#.#.','############','#..........#','#...#......#','#...##.....#','#...###....#','#...##.....#','#...#......#','#..........#','############'],
matraz:['....####....','....#..#....','....#..#....','...#....#...','..#......#..','.#........#.','.#..####..#.','.#.######.#.','..########..'],
persona:['....####....','...######...','...######...','....####....','..########..','.##########.','############','############'],
torre:['.....##.....','.....##.....','....####....','....#..#....','....####....','....#..#....','...######...','...#.##.#...','..########..','..#.#..#.#..','.##########.','############'],
bombilla:['...######...','..########..','.##########.','.####..####.','.###.##.###.','.###.##.###.','..###..###..','...######...','....####....','....####....','....####....','.....##.....'],
disco:['...######...','..########..','.##########.','############','#####..#####','#####..#####','############','.##########.','..########..','...######...'],
trofeo:['############','#.########.#','#.########.#','.#.######.#.','..########..','...######...','....####....','.....##.....','.....##.....','....####....','...######...']
};
function iconoDe(nombre){
var k = /^Países por millones/.test(nombre)? 'globo' : /^Países por superficie/.test(nombre)? 'mapa' : /^Montañas/.test(nombre)? 'montana'
: /^Ríos/.test(nombre)? 'rio' : /^Películas/.test(nombre)? 'cine' : /^Elementos/.test(nombre)? 'matraz' : /^Personajes/.test(nombre)? 'persona'
: /^Edificios/.test(nombre)? 'torre' : /^Inventos/.test(nombre)? 'bombilla' : /^Álbumes/.test(nombre)? 'disco' : /^Deportistas/.test(nombre)? 'trofeo' : 'globo';
var filas = ICONOS[k],svg = sv('svg',{viewBox: '0 0 12 ' + filas.length,class: 'dd-icono-svg','aria-hidden': 'true',focusable: 'false'});
filas.forEach(function(fila,y){
var re = /#+/g,m;
while((m = re.exec(fila)))svg.appendChild(sv('rect',{x: m.index,y: y,width: m[0].length,height: 1}));
});
return svg;
}
function sv(tag,attrs){
var el = document.createElementNS(NS,tag);
Object.keys(attrs ||{}).forEach(function(k){if(attrs[k]!= null)el.setAttribute(k,String(attrs[k]));});
for(var i = 2;i < arguments.length;i++)if(arguments[i])el.appendChild(arguments[i]);
return el;
}
function radio(v){return R * Math.pow(Math.max(0,v)/ META,0.6);}
function polar(r,a){return[C + r * Math.cos(a),C + r * Math.sin(a)];}
function par(p){return p[0].toFixed(2)+ ' ' + p[1].toFixed(2);}
function sector(r1,r2,a1,a2){
return 'M' + par(polar(r2,a1))+ 'A' + r2.toFixed(2)+ ' ' + r2.toFixed(2)+ ' 0 0 1 ' + par(polar(r2,a2))+ 'L' + par(polar(r1,a2))+
'A' + r1.toFixed(2)+ ' ' + r1.toFixed(2)+ ' 0 0 0 ' + par(polar(r1,a1))+ 'Z';
}
function dibujarDiana(){
var svg = sv('svg',{viewBox: '0 0 400 400',class: 'dd-diana-svg',role: 'img','aria-label': 'Diana',focusable: 'false'});
svg.appendChild(sv('circle',{cx: C,cy: C,r: 197,class: 'dd-marco'}));
svg.appendChild(sv('circle',{cx: C,cy: C,r: 185,class: 'dd-aro'}));
var tablero = sv('g',{class: 'dd-tablero'});
for(var b = 0;b < UMBRALES.length - 1;b++){
var r1 = radio(UMBRALES[b + 1]),r2 = radio(UMBRALES[b]);
for(var s = 0;s < 20;s++){
var a1 =(-99 + s * 18)* Math.PI / 180,a2 = a1 + 18 * Math.PI / 180;
tablero.appendChild(sv('path',{d: sector(r1,r2,a1,a2),class: 'dd-seg dd-seg--' +(b % 2 === 0 ? 'a' : 'b')+(s % 2)}));
}
}
svg.appendChild(tablero);
svg.appendChild(sv('circle',{cx: C,cy: C,r: radio(10),class: 'dd-bull-ext'}));
svg.appendChild(sv('circle',{cx: C,cy: C,r: radio(10)* 0.45,class: 'dd-bull-int'}));
svg.appendChild(sv('circle',{cx: C,cy: C,r: 2.5,class: 'dd-centro'}));
var etq = sv('g',{class: 'dd-etiquetas','aria-hidden': 'true'});
ETIQUETAS.forEach(function(v){
var y = C - radio(v);
etq.appendChild(sv('rect',{x: C - 14,y: y - 8,width: 28,height: 16,class: 'dd-etq-fondo'}));
var tx = sv('text',{x: C,y: y + 1,class: 'dd-etq'});tx.textContent = String(v);
etq.appendChild(tx);
});
svg.appendChild(etq);
return svg;
}
function cuerpoDardo(alas){
return sv('g',{class: 'dd-dardo-cuerpo'},
sv('path',{d: 'M0 0L-2.4 -9H2.4Z',class: 'dd-d-punta'}),
sv('rect',{x: -2.8,y: -22,width: 5.6,height: 13,class: 'dd-d-barril'}),
sv('rect',{x: -1,y: -34,width: 2,height: 12,class: 'dd-d-eje'}),
sv('path',{d: 'M0 -25L-8.5 -41L-1.8 -36.5L0 -41L1.8 -36.5L8.5 -41Z',class: 'dd-d-alas dd-d-alas--' + alas}));
}
function dardoEnDiana(p,k,rot,clase){
var g = sv('g',{transform: 'translate(' + par(p)+ ') rotate(' + rot + ')',class: 'dd-dardo ' +(clase || '')});
g.appendChild(sv('g',{class: 'dd-dardo-vuelo'},cuerpoDardo(k % 2 ? 'tiza' : 'limon')));
return g;
}
function icono(alas){
return sv('svg',{viewBox: '-10 -42 20 44',class: 'dd-dardito','aria-hidden': 'true',focusable: 'false'},cuerpoDardo(alas || 'limon'));
}
function programar(fn,ms){timers.push(setTimeout(fn,ms));}
function limpiar(){timers.forEach(clearTimeout);timers =[];}
function anguloDe(k,extra){return t.angulo0 + k * 2.399963 +(extra || 0);}
function rotDe(k){return 28 +((k * 37)% 17)- 8;}
function quitar(n,ms){programar(function(){if(n.parentNode)n.parentNode.removeChild(n);},ms);}
function valor(cat,bruto){return Math.floor((bruto - cat.resta)/ cat.div + 0.5);}
function mostrar(cat,bruto){return cat.anio ? String(bruto): U.miles(bruto)+ cat.ud;}
function mejorCombinacion(vals){
var mejor = 9999,combos =[];
(function rec(desde,usados,suma,idx){
if(usados > 0){
var r = META - suma;
if(r < mejor){mejor = r;combos =[idx.slice()];}
else if(r === mejor && combos.length < 400)combos.push(idx.slice());
}
if(usados === DARDOS)return;
for(var i = desde;i < vals.length;i++){
if(suma + vals[i]> META)continue;
idx.push(i);rec(i + 1,usados + 1,suma + vals[i],idx);idx.pop();
}
})(0,0,0,[]);
return{resto: mejor,combos: combos};
}
function crear(semilla,numero){
var rnd = U.semilla(semilla),cat = cats[Math.floor(rnd()* cats.length)];
var pool = U.barajarCon(rnd,cat.items.map(function(it){return{n: it[0],b: it[1],v: valor(cat,it[1])};}));
var r = mejorCombinacion(pool.map(function(x){return x.v;})),largo = 0;
r.combos.forEach(function(c){if(c.length > largo)largo = c.length;});
var buenas = r.combos.filter(function(c){return c.length >= Math.min(4,largo);});
var sol = buenas[Math.floor(rnd()* buenas.length)];
var elegidos = sol.map(function(i){return pool[i];});
var otros = pool.filter(function(x,i){return sol.indexOf(i)< 0;});
elegidos = U.barajarCon(rnd,elegidos.concat(otros.slice(0,VISIBLES - elegidos.length)));
return{cat: cat,items: elegidos,resto: META,dardos: DARDOS,tiros:[],fin: false,numero: numero,mejorResto: r.resto,
solucion: sol.map(function(i){return pool[i];}),angulo0: rnd()* Math.PI * 2};
}
function nueva(){
var reto = U.retoDelDia('dardos-de-datos');
t = modo === 'dia' ? crear(reto.semilla,reto.numero): crear(Math.floor(Math.random()* 4294967296),0);
montar();
}
function montar(){
limpiar();
TYJ.vaciar(raiz);
ui ={};
ui.modos = h('div',{class: 'fila',role: 'group','aria-label': 'Modo de juego'});
[['dia','Reto de hoy'],['libre','Partida libre']].forEach(function(m){
ui.modos.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(m[0]=== modo),
onclick: function(){if(modo !== m[0]){modo = m[0];nueva();}}},m[1]));
});
ui.nota = h('p',{class: 'texto-suave',texto: modo === 'dia'
? 'Reto n.º ' + t.numero + ': el mismo para todos los jugadores hoy; cambia a medianoche (hora de Madrid).'
: 'Partida libre: categoría y elementos al azar.'});
ui.banner = h('div',{class: 'dd-banner'},
h('div',{class: 'dd-icono','aria-hidden': 'true'},iconoDe(t.cat.nombre)),
h('div',{class: 'dd-banner-texto'},
h('h3',{class: 'dd-categoria',texto: t.cat.nombre}),
h('p',{class: 'texto dd-regla',texto: t.cat.regla})));
ui.svg = dibujarDiana();
ui.dardosSvg = sv('g',{class: 'dd-dardos'});
ui.fantasmas = sv('g',{class: 'dd-fantasmas','aria-hidden': 'true'});
ui.efectos = sv('g',{class: 'dd-efectos','aria-hidden': 'true'});
ui.svg.appendChild(ui.fantasmas);ui.svg.appendChild(ui.dardosSvg);ui.svg.appendChild(ui.efectos);
ui.superior = h('div',{class: 'dd-superior','aria-hidden': 'true'});
ui.diana = h('div',{class: 'dd-diana'},ui.svg,ui.superior);
ui.hud = TYJ.hud([['resto','Te faltan',String(META)],['dardos','Dardos',String(DARDOS)]]);
ui.iconos =[];
ui.filaIconos = h('div',{class: 'dd-iconos','aria-hidden': 'true'});
for(var d = 0;d < DARDOS;d++){var ic = h('span',{class: 'dd-icono-dardo'},icono(d % 2 ? 'tiza' : 'limon'));ui.iconos.push(ic);ui.filaIconos.appendChild(ic);}
ui.marcador = h('div',{class: 'dd-marcador'},ui.hud.nodo,ui.filaIconos);
ui.izq = h('div',{class: 'dd-izq'},ui.diana,ui.marcador);
ui.items = h('div',{class: 'dd-items',role: 'group','aria-label': 'Elementos para lanzar un dardo'});
ui.botones = t.items.map(function(it,i){
var b = h('button',{class: 'dd-item',type: 'button',onclick: function(){lanzar(i);}},
icono(i % 2 ? 'tiza' : 'limon'),
h('span',{class: 'dd-nombre',texto: it.n}),h('span',{class: 'dd-valor',texto: 'valor oculto'}));
ui.items.appendChild(b);
return b;
});
ui.plantarse = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: function(){acabar();}},'Plantarme con este resto');
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Elige un elemento para lanzar tu primer dardo.'});
ui.hist = h('ol',{class: 'dd-hist','aria-label': 'Dardos lanzados'});
ui.mejor = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': 'false',onclick: alternarMejor},'Ver la mejor tirada en la diana');
ui.finAcciones = h('div',{class: 'dd-fin-acciones',hidden: true},ui.mejor);
ui.final = h('div');ui.est = h('div');
ui.der = h('div',{class: 'dd-der'},ui.items,h('div',{class: 'fila'},ui.plantarse),ui.msg,ui.hist,ui.finAcciones,ui.final);
ui.mesa = h('div',{class: 'dd-mesa'},ui.izq,ui.der);
[ui.modos,ui.nota,ui.banner,ui.mesa,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
pintar();
}
function pop(el){
if(reducido)return;
el.classList.remove('dd-pop');void el.offsetWidth;el.classList.add('dd-pop');
}
function pintar(){
ui.hud.poner('resto',t.resto,t.resto === 0 ||(t.resto <= 10 && !t.fin));
ui.hud.poner('dardos',t.dardos,t.dardos === 1 && !t.fin);
ui.iconos.forEach(function(ic,i){ic.classList.toggle('dd-icono-dardo--gastado',i >= t.dardos);});
ui.plantarse.disabled = t.fin || t.tiros.length === 0;
var clavados = t.tiros.filter(function(x){return !x.pasa;}).length;
ui.svg.setAttribute('aria-label','Diana: te faltan ' + t.resto + ' puntos para llegar al centro, con ' + clavados +(clavados === 1 ? ' dardo clavado.' : ' dardos clavados.'));
}
function efecto(clase,texto,ms){
var n = h('span',{class: clase,texto: texto});
ui.superior.appendChild(n);
quitar(n,ms);
}
function lanzar(i){
var it = t.items[i];
if(t.fin || it.usado)return;
it.usado = true;t.dardos--;
var pasa = it.v > t.resto,k = t.tiros.length,antes = t.resto;
if(!pasa)t.resto -= it.v;
t.tiros.push({n: it.n,b: it.b,v: it.v,pasa: pasa,resto: t.resto});
var b = ui.botones[i];
b.disabled = true;
b.classList.add(pasa ? 'mal' : 'ok','dd-item--lanzado');
b.querySelector('.dd-valor').textContent = textoValor(it)+(pasa ? ' · te pasas' : '');
var linea = 'Dardo ' + t.tiros.length + ' · ' + it.n + ': ' + textoValor(it)+(pasa ? '. Te pasas: el dardo no cuenta y siguen faltándote ' + t.resto + '.' : '. Te faltan ' + t.resto + '.');
ui.hist.appendChild(h('li',{class: pasa ? 'dd-hist--mal' : '',texto: linea}));
ui.msg.textContent = linea;
animar(k,pasa,antes,it);
if(!pasa)pop(ui.hud.nodo.querySelector('.hud-valor'));
pintar();
if(t.resto === 0 || t.dardos === 0)return acabar();
var cabe = t.items.some(function(x){return !x.usado && x.v <= t.resto;});
if(!cabe){ui.msg.textContent = linea + ' Ningún elemento libre cabe ya en lo que te falta.';acabar();}
}
function animar(k,pasa,antes,it){
var a = anguloDe(k),rot = rotDe(k);
if(pasa){
var d = dardoEnDiana(polar(R + 6,a),k,rot,'dd-dardo--rebote');
ui.dardosSvg.appendChild(d);quitar(d,reducido ? 50 : 1300);
efecto('dd-sello','¡Te pasas!',reducido ? 1400 : 1400);
return;
}
var p = polar(radio(t.resto),a),dardo = dardoEnDiana(p,k,rot,'');
ui.dardosSvg.appendChild(dardo);
var onda = sv('circle',{cx: p[0].toFixed(2),cy: p[1].toFixed(2),r: 7,class: 'dd-onda'});
ui.efectos.appendChild(onda);quitar(onda,1200);
if(!reducido){
ui.diana.classList.remove('dd-golpe');void ui.diana.offsetWidth;ui.diana.classList.add('dd-golpe');
programar(function(){ui.diana.classList.remove('dd-golpe');},1000);
}
efecto('dd-flota','−' + it.v,1500);
if(t.resto === 0){
ui.diana.classList.add('dd-diana--cero');
efecto('dd-flota dd-flota--cero','¡DIANA!',2200);
confeti();
}
}
function confeti(){
if(reducido)return;
var grupo = sv('g',{class: 'dd-confetis'}),clases =['limon','sandia','tiza'];
for(var i = 0;i < 34;i++){
var ang = Math.random()* Math.PI * 2,dist = 70 + Math.random()* 120,lado = 5 + Math.floor(Math.random()* 5);
var r = sv('rect',{x: C - lado / 2,y: C - lado / 2,width: lado,height: lado,class: 'dd-confeti dd-confeti--' + clases[i % 3]});
r.style.setProperty('--dx',(Math.cos(ang)* dist).toFixed(0)+ 'px');
r.style.setProperty('--dy',(Math.sin(ang)* dist + 30).toFixed(0)+ 'px');
r.style.setProperty('--rot',Math.floor(Math.random()* 720 - 360)+ 'deg');
r.style.animationDelay =(Math.random()* 0.25).toFixed(2)+ 's';
grupo.appendChild(r);
}
ui.efectos.appendChild(grupo);quitar(grupo,2000);
}
function textoValor(it){
var igual = t.cat.div === 1 && t.cat.resta === 0;
return igual ? 'resta ' + mostrar(t.cat,it.b): mostrar(t.cat,it.b)+ ' → resta ' + it.v;
}
function dibujarMejor(){
var orden = t.solucion.slice().sort(function(x,y){return y.v - x.v;}),resto = META;
TYJ.vaciar(ui.fantasmas);
orden.forEach(function(x,k){
resto -= x.v;
var p = polar(radio(resto),anguloDe(k,1.2));
var g = sv('g',{transform: 'translate(' + par(p)+ ') rotate(' +(rotDe(k)+ 14)+ ')',class: 'dd-dardo dd-dardo--fantasma'},cuerpoDardo('tiza'));
ui.fantasmas.appendChild(g);
var tx = sv('text',{x:(p[0]+ 12).toFixed(1),y:(p[1]+ 20).toFixed(1),class: 'dd-fantasma-txt'});tx.textContent = '−' + x.v;
ui.fantasmas.appendChild(tx);
});
}
function alternarMejor(){
var on = ui.mejor.getAttribute('aria-pressed')!== 'true';
ui.mejor.setAttribute('aria-pressed',String(on));
ui.mejor.textContent = on ? 'Ocultar la mejor tirada' : 'Ver la mejor tirada en la diana';
ui.diana.classList.toggle('dd-diana--mejor',on);
}
function acabar(){
if(t.fin)return;
t.fin = true;
var dianas = t.resto === 0,puntos = dianas ? 100 + 10 * t.dardos : Math.max(0,100 - t.resto);
ui.botones.forEach(function(b,i){
b.disabled = true;
if(!t.items[i].usado){b.classList.add('dd-item--libre');b.querySelector('.dd-valor').textContent = 'sin lanzar · ' + textoValor(t.items[i]);}
});
pintar();
dibujarMejor();
ui.finAcciones.hidden = false;
sesion.registrar(puntos,dianas);
var mejor = t.solucion.map(function(x){return x.n + ' (' + x.v + ')';}).join(' + ');
var detalles =[dianas ? 'Has llegado a cero con ' + t.tiros.length +(t.tiros.length === 1 ? ' dardo.' : ' dardos.'): 'Te quedas a ' + t.resto + ' de cero.',
(t.mejorResto === 0 ? 'Se podía llegar a cero con: ' : 'Lo más cerca que se podía llegar (a ' + t.mejorResto + ') era con: ')+ mejor + '.'];
var etiqueta = modo === 'dia' ? 'Reto n.º ' + t.numero : 'Partida libre';
TYJ.final(ui.final.appendChild(h('div')),{titulo: dianas ? '¡Diana! Has llegado a cero' : 'Te quedas a ' + t.resto,nivel: U.nivel(puntos,NIVELES),
puntos: puntos,unidad: 'puntos',detalles: detalles,
compartir: 'Dardos de datos · ' + etiqueta + ' (' + t.cat.nombre.toLowerCase()+ '): ' +(dianas ? 'he llegado a cero' : 'me he quedado a ' + t.resto)+ ' · ' + puntos + ' puntos.',
textoRepetir: modo === 'dia' ? 'Repetir el reto de hoy' : 'Otra partida',alRepetir: nueva});
}
function arrancar(){
TYJ.datos('dardos-de-datos/dardos.json').then(function(json){cats = json.categorias;nueva();}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
