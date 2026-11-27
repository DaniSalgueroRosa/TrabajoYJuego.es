(function(){
'use strict';
var TYJ = window.TYJ,h = TYJ.h;
var raiz = document.getElementById('fm');
if(!raiz)return;
var MEJORAS =[
{id: 'dedo',nombre: 'Dedo de oro',efecto: '+1 moneda por pulsación',base: 15,clic: 1,seg: 0},
{id: 'obrero',nombre: 'Obrero',efecto: '+1 moneda por segundo',base: 50,clic: 0,seg: 1},
{id: 'cinta',nombre: 'Cinta transportadora',efecto: '+8 por segundo',base: 400,clic: 0,seg: 8},
{id: 'fundicion',nombre: 'Fundición',efecto: '+50 por segundo',base: 3000,clic: 0,seg: 50},
{id: 'banco',nombre: 'Banco',efecto: '+300 por segundo',base: 25000,clic: 0,seg: 300},
{id: 'mina',nombre: 'Mina de oro',efecto: '+2.000 por segundo',base: 200000,clic: 0,seg: 2000}
];
var HITOS =[100,1000,10000,100000,1000000,10000000];
var CRECE = 1.15,FRENESI_CLICS = 6,FRENESI_VENTANA = 2000,FRENESI_DURA = 6000;
var ui = null,e = null,raf = 0,ultimo = 0,aviso = 0,reinicio = 0;
function fmt(n){
n = Math.floor(n);
if(n < 1e6)return TYJ.util.miles(n);
if(n < 1e9)return(n / 1e6).toFixed(2).replace('.',',')+ ' M';
return(n / 1e9).toFixed(2).replace('.',',')+ ' MM';
}
function coste(m){return Math.ceil(m.base * Math.pow(CRECE,e.cuenta[m.id]));}
function porClic(){return 1 + e.cuenta.dedo;}
function porSegundo(){var s = 0;MEJORAS.forEach(function(m){s += m.seg * e.cuenta[m.id];});return s;}
function factor(ahora){return ahora < e.frenesiHasta ? 2 : 1;}
function nuevo(){
var cuenta ={};MEJORAS.forEach(function(m){cuenta[m.id]= 0;});
return{monedas: 0,total: 0,cuenta: cuenta,clics:[],frenesiHasta: 0,hitos: 0,pulsaciones: 0};
}
function montar(){
cancelAnimationFrame(raf);clearTimeout(aviso);clearTimeout(reinicio);
e = nuevo();
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['monedas','Monedas',0],['seg','Por segundo',0],['clic','Por pulsación',1]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Pulsa la moneda para empezar.'});
ui.moneda = h('button',{class: 'fm-moneda',type: 'button','aria-label': 'Moneda: pulsa para ganar monedas'});
ui.flot = h('div',{class: 'fm-flotantes','aria-hidden': 'true'});
ui.relleno = h('span',{class: 'fm-frenesi-relleno'});
ui.fTexto = h('p',{class: 'fm-frenesi-texto',texto: 'Frenesí: pulsa 6 veces en 2 segundos'});
ui.frenesi = h('div',{class: 'fm-frenesi','data-activo': 'no'},ui.fTexto,h('div',{class: 'fm-frenesi-barra','aria-hidden': 'true'},ui.relleno));
ui.fabrica = h('div',{class: 'fm-fabrica'},ui.moneda,ui.frenesi,ui.flot);
ui.botones ={};
var lista = h('ul',{class: 'fm-mejoras'});
MEJORAS.forEach(function(m){
var precio = h('span',{class: 'fm-precio'}),cuenta = h('small');
var b = h('button',{class: 'fm-mejora',type: 'button','data-mejora': m.id},h('span',{},h('b',{texto: m.nombre}),h('small',{texto: m.efecto}),h('br'),cuenta),precio);
b.addEventListener('click',function(){comprar(m);});
ui.botones[m.id]={b: b,precio: precio,cuenta: cuenta,puede: null};
lista.appendChild(h('li',{},b));
});
ui.reiniciar = h('button',{class: 'boton-retro boton-retro--sec fm-reiniciar',type: 'button',onclick: pedirReinicio},'Empezar de cero');
var ultimaOrden = 0;
ui.moneda.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;ultimaOrden = performance.now();pulsar(ev);});
ui.moneda.addEventListener('keydown',function(ev){if(ev.key === ' ' || ev.key === 'Enter'){ev.preventDefault();if(!ev.repeat){ultimaOrden = performance.now();pulsar(null);}}});
ui.moneda.addEventListener('click',function(ev){if(ev.detail === 0 && performance.now()- ultimaOrden > 400)pulsar(null);});
raiz.appendChild(h('h2',{texto: 'Fábrica de monedas'}));
raiz.appendChild(ui.hud.nodo);
raiz.appendChild(h('div',{class: 'fm-zona'},ui.fabrica,lista));
raiz.appendChild(ui.msg);
raiz.appendChild(ui.reiniciar);
document.addEventListener('visibilitychange',alVisibilidad);
ultimo = performance.now();
pintar(ultimo);
raf = requestAnimationFrame(bucle);
}
function alVisibilidad(){
if(!e)return;
if(document.hidden)cancelAnimationFrame(raf);
else{ultimo = performance.now();raf = requestAnimationFrame(bucle);}
}
function ganar(n){
e.monedas += n;e.total += n;
while(e.hitos < HITOS.length && e.total >= HITOS[e.hitos]){
var t = '¡Hito! ' + TYJ.util.miles(HITOS[e.hitos])+ ' monedas ganadas.';
e.hitos++;ui.msg.textContent = t;TYJ.anunciar(t);
ui.fabrica.setAttribute('data-hito','si');clearTimeout(aviso);
aviso = setTimeout(function(){if(ui)ui.fabrica.setAttribute('data-hito','no');},700);
}
}
function pulsar(ev){
var ahora = performance.now();
e.pulsaciones++;
e.clics.push(ahora);
while(e.clics.length && ahora - e.clics[0]> FRENESI_VENTANA)e.clics.shift();
if(ahora >= e.frenesiHasta && e.clics.length >= FRENESI_CLICS){e.frenesiHasta = ahora + FRENESI_DURA;e.clics =[];ui.msg.textContent = '¡Frenesí! Todo vale el doble durante 6 segundos.';}
var ganancia = porClic()* factor(ahora);
ganar(ganancia);
flotante('+' + fmt(ganancia),ev);
pintar(ahora);
}
function flotante(texto,ev){
if(ui.flot.childNodes.length >= 14)ui.flot.removeChild(ui.flot.firstChild);
var caja = ui.fabrica.getBoundingClientRect(),x = 0.5 * caja.width,y = 0.3 * caja.height;
if(ev && typeof ev.clientX === 'number' && caja.width){x = ev.clientX - caja.left;y = ev.clientY - caja.top;}
var f = h('span',{class: 'fm-flotante',texto: texto,style: 'left:' + Math.round(Math.max(8,Math.min(caja.width - 60,x - 12)))+ 'px;top:' + Math.round(Math.max(8,y - 24))+ 'px'});
f.addEventListener('animationend',function(){if(f.parentNode)f.parentNode.removeChild(f);});
ui.flot.appendChild(f);
}
function comprar(m){
var c = coste(m);
if(e.monedas < c){ui.msg.textContent = 'Te faltan ' + fmt(c - e.monedas)+ ' monedas para ' + m.nombre.toLowerCase()+ '.';return;}
e.monedas -= c;e.cuenta[m.id]++;
ui.msg.textContent = 'Has comprado: ' + m.nombre.toLowerCase()+ ' (tienes ' + e.cuenta[m.id]+ ').';
pintar(performance.now());
}
function pintar(ahora){
ui.hud.poner('monedas',fmt(e.monedas));
ui.hud.poner('seg',fmt(porSegundo()* factor(ahora)));
ui.hud.poner('clic',fmt(porClic()* factor(ahora)));
MEJORAS.forEach(function(m){
var u = ui.botones[m.id],c = coste(m),puede = e.monedas >= c;
u.precio.textContent = fmt(c);u.cuenta.textContent = 'Tienes ' + e.cuenta[m.id];
if(u.puede !== puede){u.puede = puede;u.b.setAttribute('aria-disabled',puede ? 'false' : 'true');u.b.classList.toggle('fm-mejora--sin',!puede);u.b.disabled = !puede;}
});
var resta = e.frenesiHasta - ahora,activo = resta > 0;
ui.frenesi.setAttribute('data-activo',activo ? 'si' : 'no');
ui.relleno.style.width = activo ? Math.round(100 * resta / FRENESI_DURA)+ '%' : '0%';
ui.fTexto.textContent = activo ? 'Frenesí ×2: quedan ' + Math.ceil(resta / 1000)+ ' s' : 'Frenesí: pulsa 6 veces en 2 segundos';
}
function bucle(){
var ahora = performance.now(),dt = Math.min(0.5,Math.max(0,(ahora - ultimo)/ 1000));
ultimo = ahora;
var ps = porSegundo();
if(ps > 0)ganar(ps * factor(ahora)* dt);
pintar(ahora);
raf = requestAnimationFrame(bucle);
}
function pedirReinicio(){
if(ui.reiniciar.getAttribute('data-seguro')=== 'si'){montar();return;}
ui.reiniciar.setAttribute('data-seguro','si');ui.reiniciar.textContent = '¿Seguro? Pulsa otra vez para borrar tu fábrica';
clearTimeout(reinicio);
reinicio = setTimeout(function(){if(ui && ui.reiniciar){ui.reiniciar.removeAttribute('data-seguro');ui.reiniciar.textContent = 'Empezar de cero';}},4000);
}
montar();
})();
