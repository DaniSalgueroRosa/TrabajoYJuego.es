(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('mc');
if(!raiz)return;
var DURACIONES =[30,60,120];
var NIVELES =[[0,'Dos deditos'],[15,'Aprendiz'],[30,'Mecanógrafo'],[45,'Veloz'],[65,'Pianista del teclado'],[85,'Máquina de escribir']];
var sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor velocidad (ppm): '});
var textos =[],mazo =[],g = null,ui = null,temporizador = null;
var preferencias ={duracion: 60,tildes: true};
function robar(){
if(!mazo.length)mazo = U.barajar(textos);
return mazo.pop();
}
function sinTilde(c){return c.normalize('NFD').replace(/[̀́̈]/g,'').normalize('NFC');}
function igual(a,b){return g.tildes ? a === b : sinTilde(a)=== sinTilde(b);}
function correctos(escrito,texto){
var n = 0;
for(var i = 0;i < escrito.length && i < texto.length;i++)if(igual(escrito.charAt(i),texto.charAt(i)))n++;
return n;
}
function nueva(){
if(temporizador)temporizador.parar();
g ={fase: 'espera',duracion: preferencias.duracion,tildes: preferencias.tildes,texto: '',largo: 0,pulsaciones: 0,aciertos: 0,netas: 0,hechos: 0,componiendo: false};
montar();datos();
}
function preparar(){
g.fase = 'listo';g.texto = robar();g.largo = 0;
ponerTexto();ui.entrada.disabled = false;ui.entrada.value = '';ui.entrada.focus();
ui.empezar.hidden = true;ui.reiniciar.hidden = false;
ui.msg.textContent = 'Escribe el texto de arriba. El tiempo empieza a correr con la primera tecla.';
ui.hud.poner('tiempo',g.duracion);
TYJ.anunciar('Escribe el texto. El tiempo empieza con la primera tecla.');
datos();
}
function arrancar(){
g.fase = 'juego';
ui.msg.textContent = '';
temporizador = new TYJ.Temporizador({
segundos: g.duracion,
alTick: function(r){ui.hud.poner('tiempo',Math.ceil(r),r <= 10);ui.barra.poner(r / g.duracion);actualizarHud();},
alFin: terminar
});
temporizador.iniciar();
datos();
}
function transcurrido(){return temporizador ? g.duracion - temporizador.restante : 0;}
function netasAhora(){return g.netas +(g.fase === 'juego' || g.fase === 'fin' ? correctos(ui.entrada.value,g.texto): 0);}
function ppmAhora(seg){return seg >= 2 ? Math.round(netasAhora()/ 5 /(seg / 60)): 0;}
function precision(){return g.pulsaciones ? Math.round(100 * g.aciertos / g.pulsaciones): 100;}
function actualizarHud(){
ui.hud.poner('ppm',ppmAhora(transcurrido()));
ui.hud.poner('prec',precision()+ ' %');
datos();
}
function alEscribir(){
if(g.componiendo || g.fase === 'fin' || g.fase === 'espera')return;
var v = ui.entrada.value;
if(g.fase === 'listo'){if(!v)return;arrancar();}
for(var k = g.largo;k < v.length;k++){
g.pulsaciones++;
if(igual(v.charAt(k),g.texto.charAt(k)))g.aciertos++;
}
g.largo = v.length;
pintarTexto(v);
if(v.length >= g.texto.length){
g.netas += correctos(v,g.texto);g.hechos++;
g.texto = robar();g.largo = 0;ui.entrada.value = '';
ponerTexto();
}
actualizarHud();
}
function terminar(){
if(g.fase === 'fin')return;
var v = ui.entrada.value,seg = g.duracion;
var netas = g.netas + correctos(v,g.texto);
g.fase = 'fin';ui.entrada.disabled = true;ui.entrada.blur();
var ppm = Math.round(netas / 5 /(seg / 60)),prec = precision(),fallos = g.pulsaciones - g.aciertos;
g.ppm = ppm;actualizarHud();ui.hud.poner('ppm',ppm);datos();
sesion.registrar(ppm);
var nivel = U.nivel(ppm,NIVELES);
ui.msg.textContent = '';
TYJ.final(ui.final,{titulo: 'Tiempo',puntos: ppm,unidad: 'palabras por minuto',nivel: nivel,
detalles:['Precisión: ' + prec + ' %',fallos +(fallos === 1 ? ' pulsación incorrecta' : ' pulsaciones incorrectas')+ ' de ' + U.miles(g.pulsaciones),U.miles(netas)+ ' caracteres correctos en ' + seg + ' segundos',g.tildes ? 'Con tildes exigidas' : 'Sin exigir tildes'],
compartir: 'Test de mecanografía (' + seg + ' s): ' + ppm + ' ppm con ' + prec + ' % de precisión · ' + nivel + '.',textoRepetir: 'Probar otra vez',alRepetir: nueva});
sesion.montar(ui.est);
}
function ponerTexto(){
TYJ.vaciar(ui.texto);
for(var i = 0;i < g.texto.length;i++)ui.texto.appendChild(h('span',{class: 'mc-c'},g.texto.charAt(i)));
ui.lectura.textContent = g.texto;
ui.pista.nuevaMeta(g.texto.length,'Fin del texto');
pintarTexto('');
}
function pintarTexto(v){
if(g.texto)ui.pista.poner(correctos(v,g.texto));
var spans = ui.texto.children;
for(var i = 0;i < spans.length;i++){
var clase = 'mc-c';
if(i < v.length)clase += igual(v.charAt(i),g.texto.charAt(i))? ' mc-ok' : ' mc-mal';
else if(i === v.length)clase += ' mc-cursor';
spans[i].className = clase;
}
var actual = spans[Math.min(v.length,spans.length - 1)];
if(actual && actual.offsetTop !== undefined)ui.texto.scrollTop = Math.max(0,actual.offsetTop - ui.texto.clientHeight / 2);
}
function chips(etiqueta,valores,actual,alElegir){
var grupo = h('div',{class: 'fila',role: 'group','aria-label': etiqueta});
valores.forEach(function(v){
grupo.appendChild(h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button','aria-pressed': String(v[0]=== actual),onclick: function(ev){
if(g.fase === 'juego')return;
alElegir(v[0]);
grupo.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b === ev.currentTarget));});
}},v[1]));
});
return grupo;
}
function montar(){
TYJ.vaciar(raiz);ui ={};
ui.hud = TYJ.hud([['tiempo','Tiempo',g.duracion],['ppm','ppm',0],['prec','Precisión','100 %']]);
ui.barra = TYJ.barraDeTiempo();
ui.pista = TYJ.carrera({meta: 100,unidad: 'caracteres',rapida: true,etiqueta: 'Avance por el texto actual',
lectura: function(v,pct){return 'Vuelta ' +((g && g.hechos || 0)+ 1)+ ' · ' + pct + ' %';}});
ui.pista.nuevaMeta(100,'Fin del texto');
ui.texto = h('p',{class: 'mc-texto','aria-hidden': 'true'},'Pulsa «Empezar» para ver el texto.');
ui.lectura = h('p',{class: 'solo-lectores',id: 'mc-lectura'});
ui.entrada = h('input',{class: 'mc-entrada',type: 'text',autocomplete: 'off',autocapitalize: 'off',autocorrect: 'off',spellcheck: 'false',disabled: true,
'aria-label': 'Escribe aquí el texto','aria-describedby': 'mc-lectura'});
ui.entrada.addEventListener('input',alEscribir);
ui.entrada.addEventListener('compositionstart',function(){g.componiendo = true;});
ui.entrada.addEventListener('compositionend',function(){g.componiendo = false;alEscribir();});
ui.entrada.addEventListener('paste',function(ev){ev.preventDefault();ui.msg.textContent = 'Aquí no se puede pegar: hay que escribir.';});
ui.entrada.addEventListener('drop',function(ev){ev.preventDefault();});
ui.entrada.addEventListener('keydown',function(ev){if(ev.key === 'Escape'){ev.preventDefault();nueva();}});
ui.msg = h('p',{class: 'mensaje',role: 'status'},'Elige la duración y pulsa «Empezar». Escribe lo que veas, con mayúsculas y signos de puntuación.');
ui.empezar = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(g.fase === 'espera')preparar();}},'Empezar');
ui.reiniciar = h('button',{class: 'boton-retro boton-retro--sec',type: 'button',hidden: true,onclick: nueva},'Reiniciar (Esc)');
ui.final = h('div');ui.est = h('div');
ui.controles = h('div',{class: 'mc-controles'},
chips('Duración',DURACIONES.map(function(d){return[d,d + ' s'];}),g.duracion,function(d){preferencias.duracion = d;g.duracion = d;ui.hud.poner('tiempo',d);}),
chips('Tildes',[[true,'Exigir tildes'],[false,'Ignorar tildes']],g.tildes,function(t){preferencias.tildes = t;g.tildes = t;}));
[ui.controles,ui.hud.nodo,ui.barra.nodo,ui.pista.nodo,ui.texto,ui.lectura,ui.entrada,ui.msg,h('div',{class: 'fila fila--centro'},ui.empezar,ui.reiniciar),ui.final,ui.est].forEach(function(n){raiz.appendChild(n);});
sesion.montar(ui.est);
}
function datos(){
raiz.setAttribute('data-fase',g.fase);
raiz.setAttribute('data-texto',g.texto);
raiz.setAttribute('data-ppm',String(g.ppm != null && g.fase === 'fin' ? g.ppm : ppmAhora(transcurrido())));
raiz.setAttribute('data-precision',String(precision()));
raiz.setAttribute('data-pulsaciones',String(g.pulsaciones));
raiz.setAttribute('data-aciertos',String(g.aciertos));
}
function arrancarJuego(){
TYJ.datos('test-de-mecanografia/textos.json').then(function(json){textos = json.textos;nueva();})
.catch(function(){TYJ.errorDeCarga(raiz,arrancarJuego);});
}
arrancarJuego();
})();
