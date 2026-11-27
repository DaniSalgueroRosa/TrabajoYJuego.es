(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('pt');
if(!raiz)return;
var TOTAL = 10,DIVE = 260,ESPERA = 900,RESULTADO = 1100,CURVA_EN = 0.45;
var NOMBRES =['Arriba izquierda','Arriba centro','Arriba derecha','Abajo izquierda','Abajo centro','Abajo derecha'];
var TECLAS ={q: 0,w: 1,e: 2,a: 3,s: 4,d: 5},LETRAS =['Q','W','E','A','S','D'];
var RANGOS =[[0,'Manos de mantequilla'],[3,'Portero suplente'],[6,'Titular fiable'],[8,'Muro bajo palos'],[10,'Leyenda de la portería']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Más paradas: ',racha: false});
var ui = null,g = null,raf = 0,ultimaOrden = 0;
function centro(z){return[16.67 + 33.33 *(z % 3),z < 3 ? 17.5 : 52.5];}
function vuelo(i){return Math.max(700,Math.round(1300 - 67 * i));}
function inicio(){
cancelAnimationFrame(raf);g = null;
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'El portero'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Diez penaltis. Pulsa la zona de la portería a la que vaya el balón antes de que sea tarde.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Empezar')));
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
function jugar(){
cancelAnimationFrame(raf);
g ={i: -1,paradas: 0,racha: 0,mejorRacha: 0,fase: 'espera',hasta: performance.now()+ 800,pausa: 0,fin: false,pulsas:[]};
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['disparo','Disparo','0 / ' + TOTAL],['paradas','Paradas',0],['racha','Racha',0]]);
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Prepárate: el delantero va a lanzar.'});
ui.aviso = h('span',{class: 'pt-aviso','aria-hidden': 'true'});
ui.balon = h('span',{class: 'pt-balon','aria-hidden': 'true'});
ui.portero = h('span',{class: 'pt-portero','aria-hidden': 'true'});
ui.zonas = NOMBRES.map(function(n,z){
var b = h('button',{class: 'pt-zona',type: 'button','data-zona': String(z),'aria-pressed': 'false','aria-label': n + '. Tecla ' + LETRAS[z]+ '.','aria-keyshortcuts': LETRAS[z]},h('span',{'aria-hidden': 'true',texto: LETRAS[z]}));
b.addEventListener('pointerdown',function(ev){if(ev.pointerType === 'mouse' && ev.button !== 0)return;ultimaOrden = performance.now();pulsar(z);});
b.addEventListener('click',function(ev){if(ev.detail === 0 && performance.now()- ultimaOrden > 400)pulsar(z);});
return b;
});
ui.campo = h('div',{class: 'pt-campo','data-fase': 'espera'},
h('div',{class: 'pt-porteria',role: 'group','aria-label': 'Portería: elige a qué zona te lanzas'},ui.zonas),
h('span',{class: 'pt-punto','aria-hidden': 'true'}),ui.portero,ui.balon,ui.aviso);
raiz.appendChild(ui.hud.nodo);raiz.appendChild(ui.campo);raiz.appendChild(ui.msg);
colocarPortero(null);colocarBalon(50,96,0.5);
document.addEventListener('keydown',alTeclear);
document.addEventListener('visibilitychange',alVisibilidad);
raf = requestAnimationFrame(bucle);
}
function alTeclear(ev){
if(!g || g.fin || ev.ctrlKey || ev.metaKey || ev.altKey)return;
var z = TECLAS[String(ev.key).toLowerCase()];
if(z === undefined)return;
ev.preventDefault();
if(ev.repeat)return;
ultimaOrden = performance.now();pulsar(z);
}
function alVisibilidad(){
if(!g || g.fin)return;
if(document.hidden){g.pausa = performance.now();cancelAnimationFrame(raf);}
else if(g.pausa){var d = performance.now()- g.pausa;g.pausa = 0;g.hasta += d;if(g.t0)g.t0 += d;g.pulsas.forEach(function(x){x.t += d;});raf = requestAnimationFrame(bucle);}
}
function colocarBalon(x,y,s){
ui.campo.style.setProperty('--bx',x.toFixed(2));ui.campo.style.setProperty('--by',y.toFixed(2));ui.campo.style.setProperty('--s',s.toFixed(2));
}
function colocarPortero(z){
var c = z == null ?[50,40]: centro(z);
ui.campo.style.setProperty('--kx',c[0].toFixed(2));ui.campo.style.setProperty('--ky',c[1].toFixed(2));
ui.zonas.forEach(function(b,k){b.setAttribute('aria-pressed',k === z ? 'true' : 'false');});
}
function fase(f){g.fase = f;ui.campo.setAttribute('data-fase',f);}
function decir(t){ui.msg.textContent = t;ui.aviso.textContent = t;}
function lanzar(ahora){
g.i++;
var curva = g.i >= 2 && g.i <= 6 && Math.random()< 0.5;
var a = Math.floor(Math.random()* 6),b = a;
if(curva){var col = a % 3,fila = Math.floor(a / 3),nueva = col === 1 ?(Math.random()< 0.5 ? 0 : 2): 1;b = fila * 3 + nueva;}
g.a = a;g.b = b;g.flight = vuelo(g.i);g.t0 = ahora;g.pulsas =[];
ui.hud.poner('disparo',(g.i + 1)+ ' / ' + TOTAL);
ui.campo.setAttribute('data-destino',String(a));ui.campo.removeAttribute('data-res');
colocarPortero(null);ui.aviso.textContent = '';
ui.msg.textContent = 'Disparo ' +(g.i + 1)+ ' de ' + TOTAL + '. ¡Elige zona!';
fase('vuelo');
}
function bucle(){
if(!g || g.fin)return;
var ahora = performance.now();
if(g.fase === 'espera' && ahora >= g.hasta)lanzar(ahora);
if(g.fase === 'vuelo'){
var p = Math.min(1,(ahora - g.t0)/ g.flight),A = centro(g.a),B = centro(g.b),x,y;
if(g.a !== g.b && p >= CURVA_EN){
ui.campo.setAttribute('data-destino',String(g.b));
var xa = 50 +(A[0]- 50)* CURVA_EN,ya = 96 +(A[1]- 96)* CURVA_EN,q =(p - CURVA_EN)/(1 - CURVA_EN);
x = xa +(B[0]- xa)* q;y = ya +(B[1]- ya)* q;
}else{x = 50 +(A[0]- 50)* p;y = 96 +(A[1]- 96)* p;}
colocarBalon(x,y,0.5 + 0.5 * p);
if(p >= 1)resolver(ahora);
}else if(g.fase === 'resultado' && ahora >= g.hasta){
if(g.i + 1 >= TOTAL){terminar();return;}
colocarBalon(50,96,0.5);colocarPortero(null);ui.aviso.textContent = '';
ui.campo.removeAttribute('data-res');ui.campo.removeAttribute('data-destino');
ui.msg.textContent = 'Prepárate para el siguiente disparo.';
fase('espera');g.hasta = ahora + ESPERA;
}
raf = requestAnimationFrame(bucle);
}
function pulsar(z){
if(!g || g.fin || g.fase !== 'vuelo')return;
var ahora = performance.now();
g.pulsas.push({z: z,t: ahora});
colocarPortero(z);
}
function resolver(ahora){
var llegada = g.t0 + g.flight,destino = g.b,texto,valida = null,ultima = g.pulsas.length ? g.pulsas[g.pulsas.length - 1]: null;
g.pulsas.forEach(function(x){if(x.t <= llegada - DIVE)valida = x;});
var parada = !!valida && valida.z === destino;
if(parada){g.paradas++;g.racha++;if(g.racha > g.mejorRacha)g.mejorRacha = g.racha;texto = '¡Paradón!';}
else{
g.racha = 0;
if(!ultima)texto = '¡Gol! No te has movido.';
else if(ultima.z === destino)texto = '¡Gol! Elegiste bien, pero llegaste tarde.';
else texto = '¡Gol! El balón fue a ' + NOMBRES[destino].toLowerCase()+ '.';
}
ui.hud.poner('paradas',g.paradas);ui.hud.poner('racha',g.racha);
ui.campo.setAttribute('data-res',parada ? 'parada' : 'gol');
colocarPortero(valida ? valida.z :(ultima ? ultima.z : null));
decir(texto);
fase('resultado');g.hasta = ahora + RESULTADO;
}
function terminar(){
g.fin = true;cancelAnimationFrame(raf);
document.removeEventListener('keydown',alTeclear);document.removeEventListener('visibilitychange',alVisibilidad);
sesion.registrar(g.paradas);
var nivel = U.nivel(g.paradas,RANGOS);
TYJ.final(raiz,{titulo: 'Tanda terminada',puntos: g.paradas,unidad: g.paradas === 1 ? 'parada de ' + TOTAL : 'paradas de ' + TOTAL,nivel: nivel,
detalles:['Mejor racha de paradas: ' + g.mejorRacha,'Goles encajados: ' +(TOTAL - g.paradas)],
compartir: 'El portero · ' + g.paradas + ' paradas de ' + TOTAL + ' penaltis (' + nivel + ')',alRepetir: jugar});
var est = h('div');raiz.appendChild(est);sesion.montar(est);
}
inicio();
})();
