(function(global){
'use strict';
var TYJ = global.TYJ = global.TYJ ||{};
var doc = global.document;
if(!doc)return;
var origen = doc.currentScript && doc.currentScript.src;
TYJ.raiz = origen ? new URL('../../',origen).href : '/';
TYJ.url = function(ruta){return new URL(ruta,TYJ.raiz).href;};
TYJ.datos = function(ruta){return TYJ.cargar(TYJ.url('juegos/' + ruta));};
TYJ.$ = function(selector,dentro){return(dentro || doc).querySelector(selector);};
TYJ.$$ = function(selector,dentro){return Array.prototype.slice.call((dentro || doc).querySelectorAll(selector));};
TYJ.vaciar = function(el){while(el.firstChild)el.removeChild(el.firstChild);return el;};
function anadir(el,hijo){
if(hijo == null || hijo === false)return;
if(Array.isArray(hijo)){hijo.forEach(function(x){anadir(el,x);});return;}
el.appendChild(typeof hijo === 'object' ? hijo : doc.createTextNode(String(hijo)));
}
TYJ.h = function(etiqueta,atributos){
var el = doc.createElement(etiqueta);
Object.keys(atributos ||{}).forEach(function(k){
var v = atributos[k];
if(v === false || v == null)return;
if(k === 'texto')el.textContent = v;
else if(k === 'class')el.className = v;
else if(k === 'style')el.style.cssText = v;
else if(k.slice(0,2)=== 'on' && typeof v === 'function')el.addEventListener(k.slice(2),v);
else el.setAttribute(k,v === true ? '' : v);
});
for(var i = 2;i < arguments.length;i++)anadir(el,arguments[i]);
return el;
};
TYJ.cargar = function(url){
return fetch(url,{cache: 'no-cache'}).then(function(r){
if(!r.ok)throw new Error('No se pudo leer ' + url + ' (error ' + r.status + ')');
return r.json();
});
};
TYJ.errorDeCarga = function(contenedor,reintentar){
TYJ.vaciar(contenedor).appendChild(TYJ.h('div',{class: 'final',role: 'alert'},
TYJ.h('h3',{class: 'final-titulo',texto: 'No se ha podido cargar el juego'}),
TYJ.h('p',{class: 'texto',texto: 'Revisa tu conexión e inténtalo de nuevo. Si sigue fallando, recarga la página.'}),
reintentar ? TYJ.h('button',{class: 'boton-retro',type: 'button',onclick: reintentar},'Reintentar'): null));
};
TYJ.anunciar = function(texto){
var zona = doc.getElementById('tyj-anuncios');
if(!zona){
zona = TYJ.h('div',{id: 'tyj-anuncios',class: 'solo-lectores',role: 'status','aria-live': 'polite'});
doc.body.appendChild(zona);
}
zona.textContent = '';
setTimeout(function(){zona.textContent = texto;},30);
};
TYJ.Temporizador = function(opciones){
var t = this,fin = 0,id = null;
t.segundos = opciones.segundos;
t.restante = opciones.segundos;
function detener(){if(id){clearInterval(id);id = null;}}
function paso(){
var r =(fin - global.performance.now())/ 1000;
if(r <= 0){t.restante = 0;detener();if(opciones.alTick)opciones.alTick(0,t);if(opciones.alFin)opciones.alFin(t);return;}
t.restante = r;
if(opciones.alTick)opciones.alTick(r,t);
}
t.iniciar = function(segundos){
detener();
if(segundos != null)t.segundos = segundos;
t.restante = t.segundos;
fin = global.performance.now()+ t.segundos * 1000;
id = setInterval(paso,100);
if(opciones.alTick)opciones.alTick(t.restante,t);
};
t.parar = function(){var r = t.restante;detener();return r;};
t.sumar = function(segundos){fin += segundos * 1000;};
t.corriendo = function(){return id !== null;};
};
TYJ.barraDeTiempo = function(){
var relleno = TYJ.h('div',{class: 'barra-relleno'});
var barra = TYJ.h('div',{class: 'barra',role: 'progressbar','aria-label': 'Tiempo restante','aria-valuemin': '0','aria-valuemax': '100','aria-valuenow': '100'},relleno);
function actualizar(fraccion){
var f = Math.max(0,Math.min(1,fraccion)),paso = Math.ceil(f * 20)/ 20;
relleno.style.transform = 'scaleX(' + paso + ')';
relleno.classList.toggle('barra-relleno--alerta',f <= 0.25);
barra.setAttribute('aria-valuenow',String(Math.round(f * 100)));
}
return{nodo: barra,poner: actualizar};
};
TYJ.hud = function(definicion){
var valores ={},nodo = TYJ.h('div',{class: 'hud'});
definicion.forEach(function(d){
var v = TYJ.h('span',{class: 'hud-valor',texto: d[2]== null ? '0' : String(d[2])});
valores[d[0]]= v;
nodo.appendChild(TYJ.h('p',{class: 'hud-dato'},TYJ.h('span',{class: 'hud-etiqueta',texto: d[1]}),v));
});
return{
nodo: nodo,
poner: function(clave,valor,alerta){valores[clave].textContent = String(valor);valores[clave].classList.toggle('hud-valor--alerta',!!alerta);}
};
};
TYJ.Sesion = function(nodo,opciones){
var o = opciones ||{},s ={partidas: 0,mejor: 0,racha: 0,mejorRacha: 0,victorias: 0},actual = nodo;
function pintar(){
if(!actual)return;
TYJ.vaciar(actual);
actual.classList.add('sesion');
actual.appendChild(TYJ.h('span',{},'Partidas: ',TYJ.h('b',{texto: String(s.partidas)})));
if(o.victorias)actual.appendChild(TYJ.h('span',{},'Ganadas: ',TYJ.h('b',{texto: String(s.victorias)})));
if(o.mejor !== false)actual.appendChild(TYJ.h('span',{},o.etiquetaMejor || 'Mejor: ',TYJ.h('b',{texto: s.partidas ? TYJ.util.miles(s.mejor): '–'})));
if(o.racha)actual.appendChild(TYJ.h('span',{},'Racha: ',TYJ.h('b',{texto: String(s.racha)})));
actual.appendChild(TYJ.h('span',{class: 'sesion-nota',texto: 'Estas cifras solo cuentan mientras no recargues ni cierres la página.'}));
}
pintar();
return{
datos: s,
montar: function(otro){actual = otro;pintar();},
registrar: function(puntos,ganada){
s.partidas++;
if(puntos > s.mejor)s.mejor = puntos;
if(ganada === true){s.victorias++;s.racha++;if(s.racha > s.mejorRacha)s.mejorRacha = s.racha;}
else if(ganada === false)s.racha = 0;
pintar();
}
};
};
TYJ.compartir = function(texto,estado){
var completo = texto + '\n' + String(global.location.href).split('#')[0];
function aviso(t){if(estado)estado.textContent = t;TYJ.anunciar(t);}
function manual(){
if(!estado)return;
var caja = TYJ.h('textarea',{readonly: true,rows: '4','aria-label': 'Resultado para copiar',class: 'compartir-texto'});
caja.value = completo;
estado.textContent = 'Selecciona el texto y cópialo:';
estado.appendChild(caja);
caja.focus();caja.select();
}
var movil = /Mobi|Android|iPhone|iPad/i.test(global.navigator.userAgent);
if(movil && global.navigator.share){
global.navigator.share({text: completo}).catch(function(e){if(e && e.name !== 'AbortError')manual();});
}else if(global.navigator.clipboard && global.navigator.clipboard.writeText){
global.navigator.clipboard.writeText(completo).then(function(){aviso('Resultado copiado. Pégalo donde quieras.');},manual);
}else manual();
};
var SVG = 'http://www.w3.org/2000/svg';
function pixel(svg,x,y,w,hh,clase){
var r = doc.createElementNS(SVG,'rect');
r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',hh);
if(clase)r.setAttribute('class',clase);
svg.appendChild(r);
}
function cocheDePixeles(){
var s = doc.createElementNS(SVG,'svg');
s.setAttribute('viewBox','0 0 20 10');s.setAttribute('class','pista-coche-dibujo');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');
s.setAttribute('shape-rendering','crispEdges');
pixel(s,1,4,18,3,'pc-cuerpo');pixel(s,5,2,9,2,'pc-cuerpo');pixel(s,6,2.5,3,1.5,'pc-cristal');pixel(s,10,2.5,3,1.5,'pc-cristal');
pixel(s,17,4.5,2,1,'pc-faro');pixel(s,2.5,7,4,3,'pc-rueda');pixel(s,13.5,7,4,3,'pc-rueda');
return s;
}
TYJ.carrera = function(o){
var meta = o.meta,hitos = o.hitos || 0,unidad = o.unidad || 'puntos',metaActual = meta;
var coche = TYJ.h('div',{class: 'pista-coche'},cocheDePixeles());
var bandera = TYJ.h('span',{class: 'pista-meta','aria-hidden': 'true'});
var marcas =[],carril = TYJ.h('div',{class: 'pista-carril'});
for(var i = 1;i < hitos;i++){
var m = TYJ.h('span',{class: 'pista-hito','aria-hidden': 'true'});
m.style.setProperty('--h',String(i / hitos));
marcas.push(m);carril.appendChild(m);
}
carril.appendChild(bandera);carril.appendChild(coche);
var lectura = TYJ.h('p',{class: 'pista-lectura'}),etiquetaMeta = TYJ.h('span',{texto: 'Meta: ' + TYJ.util.miles(meta)});
var nodo = TYJ.h('div',{class: 'pista' +(o.rapida ? ' pista--rapida' : ''),role: 'progressbar','aria-label': o.etiqueta || 'Progreso de la carrera','aria-valuemin': '0','aria-valuemax': String(meta),'aria-valuenow': '0'},
carril,TYJ.h('div',{class: 'pista-pie'},TYJ.h('span',{texto: 'Salida'}),lectura,etiquetaMeta));
function poner(valor,hechos){
var v = Math.max(0,Math.min(metaActual,valor)),pct = Math.round(v * 100 / metaActual);
nodo.style.setProperty('--p',String(v / metaActual));
nodo.setAttribute('aria-valuenow',String(v));
nodo.setAttribute('aria-valuemax',String(metaActual));
nodo.setAttribute('aria-valuetext',o.lectura ? o.lectura(v,pct): TYJ.util.miles(v)+ ' de ' + TYJ.util.miles(metaActual)+ ' ' + unidad + ' (' + pct + ' %)');
lectura.textContent = o.lectura ? o.lectura(v,pct):(v >= metaActual ? '¡Meta! 100 %' : TYJ.util.miles(v)+ ' ' + unidad + ' · ' + pct + ' %');
nodo.classList.toggle('pista--meta',v >= metaActual && !o.rapida);
if(hechos != null)marcas.forEach(function(m,k){m.classList.toggle('pista-hito--hecho',k < hechos);});
}
poner(0,0);
function nuevaMeta(n,txt){
metaActual = n;if(txt)etiquetaMeta.textContent = txt;
nodo.classList.add('pista--sin-viaje');poner(0);
void nodo.offsetWidth;nodo.classList.remove('pista--sin-viaje');
}
return{nodo: nodo,poner: poner,nuevaMeta: nuevaMeta};
};
TYJ.etapas = function(total,historial){
var casillas =[],nodo = TYJ.h('ol',{class: 'etapas','aria-label': 'Ruta de rondas'});
historial = historial ||[];
for(var i = 0;i < total;i++){
var c = TYJ.h('li',{class: 'etapa',texto: String(i + 1)});
casillas.push(c);nodo.appendChild(c);
}
function pintar(i){
var c = casillas[i];if(!c)return;
var est = i < historial.length ?(historial[i]? 'ok' : 'mal'):(i === historial.length ? 'actual' : 'pendiente');
c.className = 'etapa etapa--' + est;
c.setAttribute('aria-label','Ronda ' +(i + 1)+ ': ' +{ok: 'acertada',mal: 'fallada',actual: 'en curso',pendiente: 'pendiente'}[est]);
if(est === 'actual')c.setAttribute('aria-current','step');else c.removeAttribute('aria-current');
}
for(var k = 0;k < total;k++)pintar(k);
return{
nodo: nodo,
marcar: function(i,acierto){historial[i]= !!acierto;historial.length = Math.max(historial.length,i + 1);for(var j = 0;j < total;j++)pintar(j);}
};
};
TYJ.final = function(contenedor,o){
var estado = TYJ.h('p',{class: 'final-estado',role: 'status'});
var botones = TYJ.h('div',{class: 'final-botones'},
TYJ.h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(o.alRepetir)o.alRepetir();}},o.textoRepetir || 'Jugar otra vez'));
if(o.compartir){
botones.appendChild(TYJ.h('button',{class: 'boton-retro boton-retro--sec',type: 'button',onclick: function(){TYJ.compartir(o.compartir,estado);}},'Compartir resultado'));
}
var titulo = TYJ.h('h3',{class: 'final-titulo',tabindex: '-1',texto: o.titulo || 'Partida terminada'});
var nodo = TYJ.h('div',{class: 'final'},titulo,
o.puntos != null ? TYJ.h('p',{class: 'final-puntos'},TYJ.util.miles(o.puntos),TYJ.h('small',{texto: o.unidad || 'puntos'})): null,
o.nivel ? TYJ.h('p',{class: 'final-nivel',texto: o.nivel}): null,
o.detalles && o.detalles.length ? TYJ.h('ul',{class: 'final-detalles'},o.detalles.map(function(d){return TYJ.h('li',{texto: d});})): null,
botones,estado);
TYJ.vaciar(contenedor).appendChild(nodo);
titulo.focus({preventScroll: false});
TYJ.anunciar((o.titulo || 'Partida terminada')+(o.puntos != null ? '. ' + TYJ.util.miles(o.puntos)+ ' ' +(o.unidad || 'puntos')+ '.' : ''));
return nodo;
};
})(typeof window !== 'undefined' ? window : globalThis);
;
(function(global){
'use strict';
var TYJ = global.TYJ = global.TYJ ||{};
if(!global.document)return;
var NIVELES_DIF =['Mezcla','Fácil','Normal','Difícil'];
var AYUDA_DIF =['Preguntas de todas las dificultades, mezcladas.','Las más conocidas: para empezar o para jugar sin prisa.',
'Un punto intermedio: hay que saber algo del tema.','Las que cuestan de verdad: solo para quien se las sabe.'];
TYJ.Rondas = function(raiz,cfg){
var U = TYJ.util,h = TYJ.h;
var est,temporizador = null,global_ = null,cerrada = true,alTecla = null,dif = 0;
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: ',victorias: false});
function quitarTecla(){if(alTecla){document.removeEventListener('keydown',alTecla);alTecla = null;}}
function parar(){quitarTecla();if(temporizador)temporizador.parar();if(global_)global_.parar();}
function iniciar(){
parar();
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: cfg.titulo}));
raiz.appendChild(h('p',{class: 'texto',texto: cfg.intro}));
if(cfg.dificultad){
var ayuda = h('p',{class: 'texto-suave rondas-nivel-ayuda','aria-live': 'polite',texto: AYUDA_DIF[dif]});
var botonesNivel = NIVELES_DIF.map(function(nombre,i){
return h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(i === dif),
onclick: function(){
dif = i;ayuda.textContent = AYUDA_DIF[i];
botonesNivel.forEach(function(x,j){x.setAttribute('aria-pressed',String(j === i));});
}},nombre);
});
raiz.appendChild(h('div',{class: 'rondas-nivel',role: 'group','aria-labelledby': 'rondas-nivel-etiqueta'},
h('span',{class: 'rondas-nivel-etiqueta',id: 'rondas-nivel-etiqueta',texto: 'Nivel:'}),botonesNivel));
raiz.appendChild(ayuda);
}
var b = h('button',{class: 'boton-retro',type: 'button',onclick: empezar},cfg.textoEmpezar || 'Empezar');
raiz.appendChild(h('div',{class: 'fila'},b));
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function empezar(){
est ={n: 0,puntos: 0,aciertos: 0,fallos: 0,racha: 0,mejorRacha: 0,vidas: cfg.vidas || 0,detalle:[],terminada: false,dif: cfg.dificultad ? dif : 0};
if(cfg.alIniciar)cfg.alIniciar(est);
global_ = null;
if(cfg.tiempoTotal){
global_ = new TYJ.Temporizador({segundos: cfg.tiempoTotal,alTick: function(r){if(est && est.hud){est.hud.poner('tiempo',Math.ceil(r),r <= 10);if(est.barra)est.barra.poner(r / cfg.tiempoTotal);}},alFin: function(){if(!est.terminada)final();}});
est.globalArrancado = false;
}
ronda();
}
function ronda(){
quitarTecla();
var r = cfg.siguiente(est.n,est);
est.n++;
cerrada = false;
r.puntosBase = r.puntosBase == null ? 100 : r.puntosBase;
var hud = TYJ.hud([].concat(
cfg.rondas ?[['n','Ronda',est.n + ' / ' + cfg.rondas]]:[['n','Ronda',est.n]],
cfg.tiempoTotal ?[['tiempo','Tiempo',Math.ceil(global_ ? global_.restante : cfg.tiempoTotal)]]:[],
[['pts','Puntos',U.miles(est.puntos)],['racha','Racha',est.racha]],
cfg.vidas ?[['vidas','Vidas',est.vidas]]:[]));
est.hud = hud;
var barra = TYJ.barraDeTiempo(),segundos = h('span',{class: 'rondas-segundos','aria-hidden': 'true'});
est.barra = cfg.tiempoTotal ? barra : null;
if(cfg.tiempoTotal)barra.poner(global_.restante / cfg.tiempoTotal);
var zona = h('div',{role: 'status','aria-live': 'polite'});
var cuerpo = h('div',{class: 'rondas-cuerpo'});
TYJ.vaciar(raiz);
raiz.appendChild(hud.nodo);
var ruta = null;
if(cfg.ruta && cfg.rondas){ruta = TYJ.etapas(cfg.rondas,est.detalle.map(function(d){return d.acierto;}));raiz.appendChild(ruta.nodo);}
if(cfg.segundos || cfg.tiempoTotal)raiz.appendChild(h('div',{class: 'rondas-tiempo'},barra.nodo,cfg.segundos ? segundos : null));
raiz.appendChild(h('h2',{class: 'rondas-enunciado',tabindex: '-1',texto: r.enunciado}));
if(r.cuerpo)raiz.appendChild(r.cuerpo);
raiz.appendChild(cuerpo);
raiz.appendChild(zona);
if(cfg.segundos){
temporizador = new TYJ.Temporizador({segundos: cfg.segundos,
alTick: function(t){barra.poner(t / cfg.segundos);segundos.textContent = String(Math.ceil(t));segundos.classList.toggle('rondas-segundos--alerta',t <= 5);},
alFin: function(){responder(null);}});
temporizador.iniciar();
}
if(global_ && !est.globalArrancado){est.globalArrancado = true;global_.iniciar();}
var botones =[],entrada = null;
if(r.opciones){
var lista = h('div',{class: 'opciones opciones--' +(r.opciones.length <= 2 ? '2' : 'n')});
r.opciones.forEach(function(texto,i){
var b = h('button',{class: 'opcion',type: 'button','aria-keyshortcuts': String(i + 1),onclick: function(){responder(i);}},h('span',{class: 'opcion-tecla','aria-hidden': 'true',texto:(i + 1)+ ' '}),texto);
botones.push(b);lista.appendChild(b);
});
cuerpo.appendChild(lista);
alTecla = function(e){
if(e.ctrlKey || e.metaKey || e.altKey || cerrada)return;
var i = parseInt(e.key,10)- 1;
if(i >= 0 && i < botones.length){e.preventDefault();responder(i);}
};
document.addEventListener('keydown',alTecla);
}else{
entrada = h('input',{id: 'rondas-respuesta',type: 'text',autocomplete: 'off',autocapitalize: 'off',spellcheck: 'false',maxlength: '60',placeholder: r.placeholder || 'Escribe tu respuesta',inputmode: r.numero != null ? 'decimal' : 'text'});
var enviar = h('button',{class: 'boton-retro',type: 'submit'},'Responder');
var form = h('form',{class: 'rondas-form',novalidate: true},h('div',{class: 'fila'},
h('div',{class: 'campo-retro'},h('label',{for: 'rondas-respuesta',texto: 'Tu respuesta'}),entrada),enviar));
form.addEventListener('submit',function(e){e.preventDefault();if(!entrada.value.trim()){entrada.focus();return;}responder(entrada.value);});
cuerpo.appendChild(form);
entrada.focus();
}
function esAcierto(resp){
if(resp == null)return false;
if(r.opciones)return Array.isArray(r.correcta)? r.correcta.indexOf(resp)>= 0 : resp === r.correcta;
if(r.numero != null){var v = parseFloat(String(resp).replace(',','.'));return !isNaN(v)&& Math.abs(v - r.numero)< 1e-9;}
if(r.exacta)return r.aceptadas.some(function(x){return U.clave(x)=== U.clave(resp);});
return U.coincide(resp,r.aceptadas);
}
function textoCorrecta(){
if(r.opciones)return(Array.isArray(r.correcta)? r.correcta :[r.correcta]).map(function(i){return r.opciones[i];}).join(' / ');
return r.numero != null ? String(r.numero).replace('.',','): r.aceptadas[0];
}
function responder(resp){
if(cerrada || est.terminada)return;
cerrada = true;quitarTecla();
var restante = temporizador ? temporizador.parar(): 0;
var acierto = esAcierto(resp),pts = 0;
if(acierto){
pts = cfg.puntuar ? cfg.puntuar(r,true,restante,est):
Math.round(r.puntosBase +(cfg.segundos ? r.puntosBase * 0.5 * restante / cfg.segundos : 0)+ Math.min(est.racha,5)* 10);
est.aciertos++;est.racha++;est.mejorRacha = Math.max(est.mejorRacha,est.racha);est.puntos += pts;
}else{
est.fallos++;est.racha = 0;if(cfg.vidas)est.vidas--;
}
est.detalle.push({etiqueta: r.etiqueta || r.enunciado,correcta: textoCorrecta(),acierto: acierto,explicacion: r.explicacion || ''});
if(ruta)ruta.marcar(est.n - 1,acierto);
hud.poner('pts',U.miles(est.puntos));hud.poner('racha',est.racha);if(cfg.vidas)hud.poner('vidas',est.vidas,est.vidas <= 1);
if(r.opciones)botones.forEach(function(b,i){
b.disabled = true;
var buena = Array.isArray(r.correcta)? r.correcta.indexOf(i)>= 0 : r.correcta === i;
if(buena)b.classList.add('ok');else if(i === resp)b.classList.add('mal');
});
else{entrada.disabled = true;TYJ.$('button[type=submit]',cuerpo).disabled = true;}
var terminaPartida =(cfg.rondas && est.n >= cfg.rondas)||(cfg.vidas && est.vidas <= 0);
var titulo = acierto ? '¡Correcto! +' + pts :(resp == null ? 'Se acabó el tiempo.' : 'Fallo.')+ ' Era: ' + textoCorrecta();
var siguiente = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(terminaPartida)final();else ronda();}},terminaPartida ? 'Ver resultado' : 'Siguiente');
var caja = h('div',{class: 'rondas-aviso' +(acierto ? ' rondas-aviso--ok' : '')},
h('p',{class: 'mensaje ' +(acierto ? 'mensaje--ok' : 'mensaje--mal'),texto: titulo}),
r.explicacion ? h('p',{class: 'texto-suave',texto: r.explicacion}): null,
cfg.auto ? null : h('div',{class: 'fila'},siguiente));
TYJ.vaciar(zona).appendChild(caja);
TYJ.anunciar(titulo);
if(cfg.auto)setTimeout(function(){if(est.terminada)return;if(terminaPartida)final();else ronda();},(cfg.pausas ||[450,1400])[acierto ? 0 : 1]);
else siguiente.focus();
}
}
function final(){
if(est.terminada)return;
est.terminada = true;parar();
var nivel = cfg.niveles ? U.nivel(est.puntos,cfg.niveles): null;
sesion.registrar(est.puntos);
var detalles =[est.aciertos + ' aciertos de ' +(est.aciertos + est.fallos)+ ' respuestas','Mejor racha: ' + est.mejorRacha];
if(cfg.dificultad)detalles.push('Nivel elegido: ' + NIVELES_DIF[est.dif]);
if(cfg.detalleFinal)detalles = detalles.concat(cfg.detalleFinal(est));
var contenedor = h('div');
TYJ.vaciar(raiz).appendChild(contenedor);
TYJ.final(contenedor,{titulo: nivel ? 'Nivel: ' + nivel : 'Partida terminada',puntos: est.puntos,unidad: cfg.unidad || 'puntos',detalles: detalles,
compartir: cfg.compartir ? cfg.compartir(est,nivel)+(cfg.dificultad && est.dif ? ' · Nivel ' + NIVELES_DIF[est.dif].toLowerCase(): ''): null,
textoRepetir: 'Jugar otra vez',alRepetir: empezar});
if(cfg.dificultad){
contenedor.firstChild.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button',onclick: iniciar},'Cambiar de nivel')));
}
var fallos = est.detalle.filter(function(d){return !d.acierto;});
if(fallos.length){
contenedor.firstChild.appendChild(h('details',{class: 'rondas-repaso'},h('summary',{texto: 'Repasa lo que has fallado (' + fallos.length + ')'}),
h('ul',{},fallos.map(function(d){
return h('li',{},h('strong',{texto: d.etiqueta}),' → ',d.correcta,d.explicacion ? h('span',{class: 'texto-suave',texto: ' · ' + d.explicacion}): null);
}))));
}
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
return{iniciar: iniciar,sesion: sesion};
};
})(typeof window !== 'undefined' ? window : globalThis);
;
(function(global){
'use strict';
var TYJ = global.TYJ = global.TYJ ||{};
var U = TYJ.util ={};
U.azar = function(n){return Math.floor(Math.random()* n);};
U.entre = function(a,b){return a + U.azar(b - a + 1);};
U.elegir = function(lista){return lista[U.azar(lista.length)];};
U.porNivel = function(lista,dif,minimo){
if(!dif)return lista;
var base = lista.filter(function(x){return x.nv === dif;}),d = 1;
while(base.length <(minimo || 10)&& d <= 2){
base = base.concat(lista.filter(function(x){return Math.abs(x.nv - dif)=== d;}));
d++;
}
return base;
};
U.barajar = function(lista){
var a = lista.slice();
for(var i = a.length - 1;i > 0;i--){var j = U.azar(i + 1),t = a[i];a[i]= a[j];a[j]= t;}
return a;
};
U.muestra = function(lista,n){return U.barajar(lista).slice(0,n);};
U.semilla = function(n){
var a =(n >>> 0)|| 1;
return function(){
a =(a + 0x6D2B79F5)| 0;
var t = Math.imul(a ^(a >>> 15),1 | a);
t =(t + Math.imul(t ^(t >>> 7),61 | t))^ t;
return((t ^(t >>> 14))>>> 0)/ 4294967296;
};
};
U.barajarCon = function(rnd,lista){
var a = lista.slice();
for(var i = a.length - 1;i > 0;i--){var j = Math.floor(rnd()*(i + 1)),t = a[i];a[i]= a[j];a[j]= t;}
return a;
};
U.retoDelDia = function(clave,ahora){
var p ={};
new Intl.DateTimeFormat('en-GB',{timeZone: 'Europe/Madrid',year: 'numeric',month: '2-digit',day: '2-digit',hour: '2-digit',minute: '2-digit',second: '2-digit',hourCycle: 'h23'})
.formatToParts(ahora || new Date()).forEach(function(x){p[x.type]= parseInt(x.value,10);});
var dia = Math.floor(Date.UTC(p.year,p.month - 1,p.day)/ 86400000),h = 17;
for(var i = 0;i < clave.length;i++)h =(Math.imul(h,31)+ clave.charCodeAt(i))>>> 0;
return{numero: Math.max(1,dia - 20779 + 1),semilla:(Math.imul(dia,2654435761)^ h)>>> 0,restante: 86400 -(p.hour * 3600 + p.minute * 60 + p.second)};
};
U.reloj = function(segundos){
var s = Math.max(0,Math.floor(segundos)),h = Math.floor(s / 3600),m = Math.floor((s % 3600)/ 60);
return h + ':' +('0' + m).slice(-2)+ ':' +('0' +(s % 60)).slice(-2);
};
U.norm = function(t){
return String(t).toLowerCase().replace(/ñ/g,'\u0001').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\u0001/g,'ñ').trim();
};
U.clave = function(t){
return U.norm(t).replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,' ').trim();
};
U.letras = function(t){return Array.from(U.norm(t).replace(/\s+/g,''));};
U.distancia = function(a,b){
if(a === b)return 0;
var prev =[],i,j;
for(j = 0;j <= b.length;j++)prev[j]= j;
for(i = 1;i <= a.length;i++){
var cur =[i];
for(j = 1;j <= b.length;j++)cur[j]= Math.min(prev[j]+ 1,cur[j - 1]+ 1,prev[j - 1]+(a[i - 1]=== b[j - 1]? 0 : 1));
prev = cur;
}
return prev[b.length];
};
U.coincide = function(texto,aceptadas){
var t = U.clave(texto);
if(!t)return false;
return aceptadas.some(function(a){
var c = U.clave(a);
if(t === c)return true;
var tolerancia = c.length >= 10 ? 2 :(c.length >= 5 ? 1 : 0);
return tolerancia > 0 && Math.abs(t.length - c.length)<= tolerancia && U.distancia(t,c)<= tolerancia;
});
};
U.evaluarPalabra = function(intento,secreta){
var a = U.letras(intento),s = U.letras(secreta),res =[],restantes ={},i;
for(i = 0;i < s.length;i++){
if(a[i]=== s[i])res[i]= 'ok';
else{res[i]= 'no';restantes[s[i]]=(restantes[s[i]]|| 0)+ 1;}
}
for(i = 0;i < a.length;i++){
if(res[i]!== 'ok' && restantes[a[i]]> 0){res[i]= 'hay';restantes[a[i]]--;}
}
return res;
};
U.miles = function(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');};
U.tiempo = function(segundos){var s = Math.max(0,Math.ceil(segundos));return Math.floor(s / 60)+ ':' +('0' +(s % 60)).slice(-2);};
U.limitar = function(n,min,max){return Math.max(min,Math.min(max,n));};
U.diaDelAnio = function(fecha){
var f = fecha || new Date();
return Math.floor((Date.UTC(f.getFullYear(),f.getMonth(),f.getDate())- Date.UTC(1970,0,1))/ 86400000);
};
U.nivel = function(puntos,tabla){
var nombre = tabla[0][1];
tabla.forEach(function(fila){if(puntos >= fila[0])nombre = fila[1];});
return nombre;
};
U.haversine = function(lat1,lon1,lat2,lon2){
var r = Math.PI / 180,dLat =(lat2 - lat1)* r,dLon =(lon2 - lon1)* r;
var a = Math.sin(dLat / 2)* Math.sin(dLat / 2)+ Math.cos(lat1 * r)* Math.cos(lat2 * r)* Math.sin(dLon / 2)* Math.sin(dLon / 2);
return 12742 * Math.asin(Math.min(1,Math.sqrt(a)));
};
})(typeof window !== 'undefined' ? window : globalThis);
