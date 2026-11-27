(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('at');
if(!raiz)return;
var NIVELES ={
facil:{nombre: 'Fácil',visible: Infinity,objetivos:[3,5,7,10,12],ayuda: 'El cronómetro se ve todo el rato: solo tienes que parar en el momento justo.'},
medio:{nombre: 'Medio',visible: 1,objetivos:[5,8,10,15,20],ayuda: 'El cronómetro se ve el primer segundo y luego se oculta: a partir de ahí, cuenta tú.'},
dificil:{nombre: 'Difícil',visible: 0,objetivos:[7,10,15,20,30],ayuda: 'El cronómetro está oculto desde el principio: solo cuentas con tu sentido del tiempo.'}
};
var ORDEN =['facil','medio','dificil'],RONDAS = 5,TOLERANCIA = 0.2,OCULTO = '?,??',ESPERA = 500;
var RANGOS =[[0,'Sin noción del tiempo'],[150,'Reloj de arena'],[250,'Buen ojo para el tiempo'],[350,'Reloj de cuarzo'],[430,'Reloj atómico']];
var sesiones ={},nivel = 'medio',g = null,ui = null,ultimo = 0,cuadro = 0,esperaSig = 0;
function sesionDe(k){return sesiones[k]||(sesiones[k]= TYJ.Sesion(null,{etiquetaMejor: 'Mejor en ' + NIVELES[k].nombre.toLowerCase()+ ': '}));}
function coma(t){return t.toFixed(2).replace('.',',');}
function puntosDe(t,objetivo){return Math.round(100 * Math.max(0,1 -(Math.abs(t - objetivo)/ objetivo)/ TOLERANCIA));}
function parar(){if(cuadro){cancelAnimationFrame(cuadro);cuadro = 0;}if(esperaSig){clearTimeout(esperaSig);esperaSig = 0;}}
function inicio(){
parar();g = null;
TYJ.vaciar(raiz);
var est = h('div');
var ayuda = h('p',{class: 'texto-suave rondas-nivel-ayuda','aria-live': 'polite',texto: NIVELES[nivel].ayuda});
var botones = ORDEN.map(function(k){
return h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(k === nivel),
onclick: function(){
nivel = k;ayuda.textContent = NIVELES[k].ayuda;
botones.forEach(function(b,j){b.setAttribute('aria-pressed',String(ORDEN[j]=== k));});
sesionDe(k).montar(est);
}},NIVELES[k].nombre);
});
raiz.appendChild(h('h2',{texto: 'Adivina el tiempo'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Te piden un tiempo. Pulsa para arrancar el cronómetro y vuelve a pulsar cuando creas que ha pasado. Cinco rondas, con objetivos distintos.'}));
raiz.appendChild(h('div',{class: 'rondas-nivel',role: 'group','aria-labelledby': 'at-nivel-etiqueta'},h('span',{class: 'rondas-nivel-etiqueta',id: 'at-nivel-etiqueta',texto: 'Nivel:'}),botones));
raiz.appendChild(ayuda);
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',onclick: jugar},'Empezar')));
raiz.appendChild(est);sesionDe(nivel).montar(est);
}
function jugar(){
parar();
g ={cfg: NIVELES[nivel],objetivos: U.barajar(NIVELES[nivel].objetivos),n: 0,puntos: 0,hist:[],fase: 'espera',t0: 0,avisado: false};
ronda();
}
function ronda(){
var o = g.objetivos[g.n];
g.fase = 'espera';g.avisado = false;
TYJ.vaciar(raiz);
ui ={};
ui.hud = TYJ.hud([['ronda','Ronda',(g.n + 1)+ ' / ' + RONDAS],['objetivo','Objetivo',o + ' s'],['puntos','Puntos',g.puntos]]);
ui.hora = h('p',{class: 'at-hora','aria-hidden': 'true',texto: g.cfg.visible > 0 ? '0,00' : OCULTO});
ui.msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite',texto: 'Pulsa «Empezar» y vuelve a pulsar cuando creas que han pasado ' + o + ' segundos.'});
ui.boton = h('button',{class: 'boton-retro at-boton',type: 'button','aria-keyshortcuts': 'Space Enter'},'Empezar');
ui.boton.addEventListener('pointerdown',function(e){if(e.button > 0)return;ultimo = performance.now();e.preventDefault();accion();});
ui.boton.addEventListener('keydown',function(e){
if(e.key !== ' ' && e.key !== 'Enter')return;
e.preventDefault();
if(!e.repeat){ultimo = performance.now();accion();}
});
ui.boton.addEventListener('keyup',function(e){if(e.key === ' ' || e.key === 'Enter')e.preventDefault();});
ui.boton.addEventListener('click',function(){if(performance.now()- ultimo < 700)return;accion();});
ui.sig = h('button',{class: 'boton-retro',type: 'button',hidden: true,onclick: siguiente},g.n < RONDAS - 1 ? 'Siguiente ronda' : 'Ver resultado');
ui.est = h('div');
[ui.hud.nodo,ui.hora,ui.msg,h('div',{class: 'fila fila--centro'},ui.boton,ui.sig),h('div',{class: 'fila fila--centro'},
h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: inicio},'Cambiar de nivel')),ui.est].forEach(function(x){raiz.appendChild(x);});
sesionDe(nivel).montar(ui.est);
ui.boton.focus({preventScroll: true});
}
function accion(){
if(!g)return;
if(g.fase === 'espera')arrancar();
else if(g.fase === 'corriendo')detener();
}
function arrancar(){
g.fase = 'corriendo';g.t0 = performance.now();
ui.boton.textContent = 'Parar';
ui.msg.textContent = g.cfg.visible === Infinity ? 'Cronómetro en marcha. Pulsa «Parar» en ' + g.objetivos[g.n]+ ' segundos.' : g.cfg.visible > 0 ? 'Cronómetro en marcha. Se ocultará en un segundo.' : 'Cronómetro en marcha, oculto. Cuenta tú.';
(function bucle(){
var t =(performance.now()- g.t0)/ 1000,visible = t < g.cfg.visible;
ui.hora.textContent = visible ? coma(t): OCULTO;
if(!visible && g.cfg.visible > 0 && !g.avisado){g.avisado = true;ui.msg.textContent = 'El cronómetro se ha ocultado: sigue contando.';}
cuadro = requestAnimationFrame(bucle);
})();
}
function detener(){
var t =(performance.now()- g.t0)/ 1000,o = g.objetivos[g.n];
parar();g.fase = 'parado';
var err = t - o,p = puntosDe(t,o);
g.puntos += p;g.hist.push({objetivo: o,tiempo: t,error: err,puntos: p});
ui.hora.textContent = coma(t);
ui.hud.poner('puntos',g.puntos);
ui.msg.textContent = 'Has parado en ' + coma(t)+ ' s (objetivo: ' + o + ' s). ' +(Math.abs(err)< 0.005 ? '¡Exacto! ' :(err > 0 ? 'Te has pasado ' : 'Te has quedado corto por ')+ coma(Math.abs(err))+ ' s. ')+ '+' + p + ' puntos.';
ui.boton.hidden = true;ui.sig.hidden = false;ui.sig.disabled = true;
esperaSig = setTimeout(function(){esperaSig = 0;ui.sig.disabled = false;ui.sig.focus({preventScroll: true});},ESPERA);
}
function siguiente(){
if(!g || g.fase !== 'parado')return;
if(g.n < RONDAS - 1){g.n++;ronda();}else final();
}
function final(){
var ses = sesionDe(nivel),medio = g.hist.reduce(function(a,r){return a + Math.abs(r.error);},0)/ g.hist.length;
ses.registrar(g.puntos);
var detalles = g.hist.map(function(r,i){
return 'Ronda ' +(i + 1)+ ': objetivo ' + r.objetivo + ' s, tu tiempo ' + coma(r.tiempo)+ ' s (' +(r.error >= 0 ? '+' : '−')+ coma(Math.abs(r.error))+ ' s) · ' + r.puntos + ' puntos';
});
detalles.push('Error medio: ' + coma(medio)+ ' s');
var contenedor = h('div'),est = h('div');
TYJ.vaciar(raiz).appendChild(contenedor);
TYJ.final(contenedor,{titulo: 'Nivel ' + NIVELES[nivel].nombre.toLowerCase(),puntos: g.puntos,unidad: 'de ' +(RONDAS * 100)+ ' puntos',nivel: U.nivel(g.puntos,RANGOS),detalles: detalles,
compartir: 'Adivina el tiempo · Nivel ' + NIVELES[nivel].nombre.toLowerCase()+ ' · ' + g.puntos + ' de ' +(RONDAS * 100)+ ' puntos · error medio ' + coma(medio)+ ' s',
textoRepetir: 'Jugar otra vez',alRepetir: jugar});
contenedor.firstChild.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: inicio},'Cambiar de nivel')));
raiz.appendChild(est);ses.montar(est);
}
inicio();
})();
