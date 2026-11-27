(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('lc');
if(!raiz)return;
var RONDAS = 3,SEGUNDOS = 90;
var GRANDES =[25,50,75,100];
var PEQUENOS =[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];
var OPS =['+','−','×','÷'];
var NOMBRES ={'+': 'Sumar','−': 'Restar','×': 'Multiplicar','÷': 'Dividir'};
var NIVELES =[[0,'Calculadora sin pilas'],[100,'Aprendiz de cuentas'],[200,'Hábil con los números'],[300,'Matemático'],[450,'Genio de las cifras']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '});
var g = null,ui = null,temporizador = null;
function calcular(a,op,b){
if(op === '+')return a + b;
if(op === '−')return a > b ? a - b : 0;
if(op === '×')return a * b;
return b > 0 && a % b === 0 ? a / b : 0;
}
function sacarNumeros(){
var grandes = U.entre(1,3);
return U.muestra(GRANDES,grandes).concat(U.muestra(PEQUENOS,6 - grandes)).sort(function(a,b){return b - a;});
}
function generar(){
for(var intento = 0;intento < 20000;intento++){
var nums = sacarNumeros(),piezas = nums.slice(),pasos =[];
var cuantos = U.entre(3,5);
for(var k = 0;k < cuantos && piezas.length > 1;k++){
var posibles =[];
for(var i = 0;i < piezas.length;i++){
for(var j = 0;j < piezas.length;j++){
if(i === j)continue;
for(var o = 0;o < OPS.length;o++){
var op = OPS[o],a = piezas[i],b = piezas[j];
if((op === '+' || op === '×')&& i > j)continue;
if((op === '×' || op === '÷')&& b === 1)continue;
if(op === '×' && a === 1)continue;
var r = calcular(a,op,b);
if(r > 0)posibles.push({i: i,j: j,a: a,b: b,op: op,r: r});
}
}
}
if(!posibles.length)break;
var m = U.elegir(posibles);
pasos.push({a: m.a,op: m.op,b: m.b,r: m.r});
piezas = piezas.filter(function(_,idx){return idx !== m.i && idx !== m.j;});
piezas.push(m.r);
}
var objetivo = piezas[piezas.length - 1];
if(pasos.length >= 3 && objetivo >= 101 && objetivo <= 999 && nums.indexOf(objetivo)< 0)return{nums: nums,objetivo: objetivo,pasos: pasos};
}
return{nums:[100,50,25,10,6,3],objetivo: 306,pasos:[{a: 100,op: '×',b: 3,r: 300},{a: 300,op: '+',b: 6,r: 306}]};
}
function nueva(){
if(temporizador)temporizador.parar();
g ={fase: 'espera',ronda: 0,puntos: 0,exactas: 0,mejores:[],fichas:[],historial:[],sel: null,op: null,num: null};
pantallaInicio();datos();
TYJ.anunciar('Las cifras. Pulsa Empezar.');
}
function iniciarRonda(){
g.ronda++;g.num = generar();
g.fichas = g.num.nums.map(function(v){return{v: v};});
g.historial =[];g.sel = null;g.op = null;g.fase = 'juego';
montarJuego();pintar();datos();
ui.msg.textContent = 'Elige un número, una operación y otro número.';ui.msg.className = 'mensaje';
temporizador = new TYJ.Temporizador({
segundos: SEGUNDOS,
alTick: function(r){ui.hud.poner('tiempo',Math.ceil(r),r <= 15);ui.barra.poner(r / SEGUNDOS);},
alFin: function(){if(g.fase === 'juego')terminarRonda(false);}
});
temporizador.iniciar();
TYJ.anunciar('Ronda ' + g.ronda + '. Objetivo: ' + g.num.objetivo + '. Números: ' + g.num.nums.join(', ')+ '.');
}
function mejorFicha(){
var mejor = null;
g.fichas.forEach(function(f){if(mejor === null || Math.abs(f.v - g.num.objetivo)< Math.abs(mejor - g.num.objetivo))mejor = f.v;});
return mejor;
}
function terminarRonda(exacta){
var restante = temporizador ? temporizador.parar(): 0;
g.fase = 'resultado';
var mejor = mejorFicha(),dist = Math.abs(mejor - g.num.objetivo),pts;
if(dist === 0)pts = 100 + Math.round(restante);
else if(dist <= 5)pts = 70;
else if(dist <= 10)pts = 50;
else pts = 0;
g.puntos += pts;if(dist === 0)g.exactas++;
g.mejores.push(mejor);
ui.hud.poner('puntos',g.puntos);
var texto = dist === 0 ? '¡Exacto! ' + mejor + ' son ' + pts + ' puntos.' :
(exacta === false && restante <= 0 ? 'Se acabó el tiempo. ' : '')+ 'Tu mejor número es ' + mejor + ', a ' + dist + ' del objetivo: ' + pts + ' puntos.';
ui.msg.textContent = texto;ui.msg.className = 'mensaje ' +(dist === 0 ? 'mensaje--ok' : pts ? '' : 'mensaje--mal');
TYJ.anunciar(texto);
ui.acciones.hidden = true;ui.ops.hidden = true;
ui.siguiente.textContent = g.ronda >= RONDAS ? 'Ver resultado' : 'Siguiente ronda';
ui.siguiente.hidden = false;
if(dist !== 0)ui.verSolucion.hidden = false;
pintar();datos();
ui.siguiente.focus();
}
function terminarPartida(){
g.fase = 'fin';datos();
sesion.registrar(g.puntos);
var nivel = U.nivel(g.puntos,NIVELES);
TYJ.vaciar(raiz);
var caja = h('div'),est = h('div');
raiz.appendChild(caja);raiz.appendChild(est);
TYJ.final(caja,{titulo: g.exactas === RONDAS ? '¡Las tres cifras exactas!' : g.exactas + ' de ' + RONDAS + ' rondas exactas',puntos: g.puntos,unidad: 'puntos',nivel: nivel,
detalles: g.mejores.map(function(m,i){return 'Ronda ' +(i + 1)+ ': ' + m + ' (a ' + Math.abs(m - g.objetivos[i])+ ' del objetivo ' + g.objetivos[i]+ ')';}),
compartir: 'Las cifras · ' + g.puntos + ' puntos · ' + g.exactas + '/' + RONDAS + ' exactas · ' + nivel + '.',textoRepetir: 'Otra partida',alRepetir: nueva});
sesion.montar(est);
}
function mensaje(t,mal){ui.msg.textContent = t;ui.msg.className = 'mensaje' +(mal ? ' mensaje--mal' : '');}
function pulsarFicha(i){
if(g.fase !== 'juego')return;
if(g.sel === null || g.op === null){g.sel = g.sel === i ? null : i;g.op = g.sel === null ? null : g.op;mensaje(g.sel === null ? 'Elige un número, una operación y otro número.' : 'Ahora elige la operación.');}
else if(g.sel === i){g.sel = null;g.op = null;mensaje('Selección cancelada.');}
else aplicar(g.sel,g.op,i);
pintar();datos();
}
function pulsarOperacion(op){
if(g.fase !== 'juego')return;
if(g.sel === null){mensaje('Primero elige un número.',true);return;}
g.op = g.op === op ? null : op;
mensaje(g.op ? 'Ahora elige el segundo número.' : 'Operación cancelada.');
pintar();datos();
}
function aplicar(i,op,j){
var a = g.fichas[i].v,b = g.fichas[j].v,r = calcular(a,op,b);
if(!r){
mensaje(op === '−' ? 'No se puede restar así: el resultado tiene que ser positivo. Elige primero el número mayor.'
: 'No se puede dividir así: la división tiene que ser exacta, sin decimales.',true);
g.op = null;return;
}
g.historial.push({fichas: g.fichas.slice(),texto: a + ' ' + op + ' ' + b + ' = ' + r});
g.fichas = g.fichas.filter(function(_,idx){return idx !== i && idx !== j;});
g.fichas.push({v: r,nueva: true});
g.sel = null;g.op = null;
mensaje(a + ' ' + op + ' ' + b + ' = ' + r);
TYJ.anunciar(a + ' ' + op + ' ' + b + ' = ' + r);
if(r === g.num.objetivo){pintar();terminarRonda(true);}
}
function deshacer(){
if(g.fase !== 'juego' || !g.historial.length)return;
g.fichas = g.historial.pop().fichas;g.sel = null;g.op = null;
mensaje('Última operación deshecha.');pintar();datos();
}
function reiniciarNumeros(){
if(g.fase !== 'juego')return;
g.fichas = g.num.nums.map(function(v){return{v: v};});g.historial =[];g.sel = null;g.op = null;
mensaje('Vuelves a tener los seis números del principio.');pintar();datos();
}
function mostrarSolucion(){
ui.verSolucion.hidden = true;
TYJ.vaciar(ui.solucion);
ui.solucion.hidden = false;
ui.solucion.appendChild(h('h3',{class: 'lc-subtitulo',texto: 'Una forma de llegar a ' + g.num.objetivo}));
ui.solucion.appendChild(h('ol',{class: 'lc-pasos'},g.num.pasos.map(function(p){return h('li',{texto: p.a + ' ' + p.op + ' ' + p.b + ' = ' + p.r});})));
}
function pantallaInicio(){
TYJ.vaciar(raiz);ui = null;g.objetivos =[];
var est = h('div');
[h('h2',{texto: 'Las cifras'}),
h('p',{class: 'texto',texto: 'Tienes seis números y un objetivo de tres cifras. Combina los números de dos en dos con suma, resta, multiplicación o división hasta llegar al objetivo, o lo más cerca posible. Son tres rondas de 90 segundos.'}),
h('p',{class: 'texto-suave',texto: 'Reglas: cada número se usa una sola vez, no puede salir un resultado negativo ni con decimales, y no hace falta usar todos los números.'}),
h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: function(){g.objetivos =[];iniciarRonda();}},'Empezar')),est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(est);
}
function montarJuego(){
TYJ.vaciar(raiz);
g.objetivos = g.objetivos ||[];
g.objetivos[g.ronda - 1]= g.num.objetivo;
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda',g.ronda + ' / ' + RONDAS],['tiempo','Tiempo',SEGUNDOS],['puntos','Puntos',g.puntos]]);
ui.barra = TYJ.barraDeTiempo();
ui.objetivo = h('p',{class: 'lc-objetivo','aria-label': 'Objetivo: ' + g.num.objetivo},h('span',{class: 'lc-objetivo-etiqueta',texto: 'Objetivo'}),h('strong',{texto: String(g.num.objetivo)}));
ui.fichas = h('div',{class: 'lc-fichas',role: 'group','aria-label': 'Números disponibles'});
ui.ops = h('div',{class: 'lc-ops',role: 'group','aria-label': 'Operación'});
OPS.forEach(function(op){
ui.ops.appendChild(h('button',{class: 'boton-retro boton-retro--sec lc-op',type: 'button','data-op': op,'aria-label': NOMBRES[op],'aria-pressed': 'false',onclick: function(){pulsarOperacion(op);}},op));
});
ui.msg = h('p',{class: 'mensaje',role: 'status'});
ui.pasos = h('ol',{class: 'lc-pasos','aria-label': 'Operaciones hechas'});
ui.deshacer = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: deshacer},'Deshacer');
ui.reiniciar = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: reiniciarNumeros},'Empezar de nuevo');
ui.terminar = h('button',{class: 'boton-retro boton-retro--chico',type: 'button',onclick: function(){if(g.fase === 'juego')terminarRonda(true);}},'Plantarme con mi mejor número');
ui.acciones = h('div',{class: 'fila fila--centro'},ui.deshacer,ui.reiniciar,ui.terminar);
ui.verSolucion = h('button',{class: 'boton-retro boton-retro--sec',type: 'button',hidden: true,onclick: mostrarSolucion},'Ver una solución');
ui.siguiente = h('button',{class: 'boton-retro',type: 'button',hidden: true,onclick: function(){if(g.ronda >= RONDAS)terminarPartida();else iniciarRonda();}},'Siguiente ronda');
ui.solucion = h('div',{class: 'lc-solucion',hidden: true});
[ui.hud.nodo,ui.barra.nodo,ui.objetivo,ui.fichas,ui.ops,ui.msg,ui.acciones,ui.pasos,
h('div',{class: 'fila fila--centro'},ui.verSolucion,ui.siguiente),ui.solucion].forEach(function(n){raiz.appendChild(n);});
raiz.onkeydown = alTecla;
}
function pintar(){
var enfocaba = ui.fichas.contains(document.activeElement);
var indiceFoco = g.sel !== null ? g.sel : g.fichas.length - 1;
TYJ.vaciar(ui.fichas);
g.fichas.forEach(function(f,i){
ui.fichas.appendChild(h('button',{class: 'lc-ficha' +(i === g.sel ? ' lc-ficha--sel' : '')+(f.nueva ? ' lc-ficha--nueva' : '')+(f.v === g.num.objetivo ? ' lc-ficha--meta' : ''),
type: 'button','data-valor': String(f.v),'aria-pressed': String(i === g.sel),'aria-label': 'Número ' + f.v,disabled: g.fase !== 'juego',onclick: function(){pulsarFicha(i);}},String(f.v)));
});
if(enfocaba && g.fase === 'juego'){var b = ui.fichas.children[Math.min(indiceFoco,g.fichas.length - 1)];if(b)b.focus();}
ui.ops.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-op')=== g.op));b.disabled = g.fase !== 'juego';});
TYJ.vaciar(ui.pasos);
g.historial.forEach(function(p){ui.pasos.appendChild(h('li',{texto: p.texto}));});
ui.deshacer.disabled = !g.historial.length || g.fase !== 'juego';
}
function alTecla(ev){
if(g.fase !== 'juego' || ev.ctrlKey || ev.metaKey || ev.altKey)return;
var mapa ={'+': '+','-': '−','−': '−','*': '×','x': '×','X': '×','/': '÷'};
if(mapa[ev.key]){ev.preventDefault();pulsarOperacion(mapa[ev.key]);}
else if(ev.key === 'Backspace'){ev.preventDefault();deshacer();}
else if(ev.key === 'Escape'){g.sel = null;g.op = null;mensaje('Selección cancelada.');pintar();datos();}
}
function datos(){
raiz.setAttribute('data-fase',g.fase);
raiz.setAttribute('data-ronda',String(g.ronda));
raiz.setAttribute('data-puntos',String(g.puntos));
raiz.setAttribute('data-objetivo',g.num ? String(g.num.objetivo): '');
raiz.setAttribute('data-fichas',g.fichas.map(function(f){return f.v;}).join(','));
}
nueva();
})();
