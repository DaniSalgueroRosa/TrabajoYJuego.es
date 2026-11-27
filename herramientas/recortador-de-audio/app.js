(function(){
'use strict';
TH.alCargar(function(raiz){
var FORMATOS =[['wav16','WAV 16 bits (sin pérdidas, el más compatible)'],['wav24','WAV 24 bits (sin pérdidas, para producción)'],['wav32','WAV 32 bits flotante (sin pérdidas)'],
['flac16','FLAC 16 bits (sin pérdidas, ocupa la mitad)'],['flac24','FLAC 24 bits (sin pérdidas)'],['mp3','MP3 (con pérdidas, lo abre cualquier reproductor)'],['opus','Ogg Opus (con pérdidas, muy pequeño)']];
var KBPS =[['32','32 kb/s (voz, muy pequeño)'],['64','64 kb/s (voz clara)'],['96','96 kb/s (música aceptable)'],['128','128 kb/s (música buena)'],['192','192 kb/s (música muy buena)'],['256','256 kb/s (casi transparente)']];
var KBPS_MP3 =[['96','96 kb/s (voz y música aceptable)'],['128','128 kb/s (música buena)'],['160','160 kb/s'],['192','192 kb/s (música muy buena)'],['256','256 kb/s (casi transparente)'],['320','320 kb/s (la más alta del MP3)']];
var HZ =[['igual','La misma del original'],['48000','48 kHz (vídeo y producción)'],['44100','44,1 kHz (CD y música)'],['32000','32 kHz'],['22050','22,05 kHz'],['16000','16 kHz (voz)'],['8000','8 kHz (teléfono)']];
function cargar(){return Promise.all([TH.script('lib/sonido.js'),TH.script('lib/hash.js'),TH.script('lib/pistas.js')]).then(function(){return TH.pistas;});}
function campo(id,et,el,ayuda){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null);}
function opcionesSelect(lista,valor){return lista.map(function(o){return h('option',{value: o[0],selected: o[0]=== valor},o[1]);});}
var h = TH.h;
var pista = null,repro = null,usados ={};
var api = TH.archivos(raiz,{aceptar: '.mp3,.wav,.wave,.ogg,.oga,.opus,.flac,.m4a,.aac,.weba,.webm,.mp4,.m4b,.mov,audio/*',aceptarTexto: 'MP3, WAV, OGG, Opus, FLAC, M4A, AAC o WebM',multiple: false,
texto: 'Arrastra aquí el audio que quieres recortar o elígelo desde tu dispositivo.',alCambiar: function(l){if(l.length)abrir(l[0]);else cerrar();}});
var info = h('p',{class: 'herr-chico',id: 'r-info','aria-live': 'polite'});
var onda = h('canvas',{id: 'r-onda',class: 'onda',width: '1000',height: '150',role: 'img','aria-label': 'Forma de onda del audio. Pulsa sobre ella para mover el inicio o el final del recorte.'});
var inicio = h('input',{id: 'c-inicio',type: 'text',value: '0:00',autocomplete: 'off'});
var fin = h('input',{id: 'c-fin',type: 'text',value: '',placeholder: 'Hasta el final',autocomplete: 'off'});
var modo = h('select',{id: 'c-modo'},opcionesSelect([['conservar','Conservar el tramo elegido'],['quitar','Quitar el tramo elegido']],'conservar'));
var fundido = h('input',{id: 'c-fundido',type: 'checkbox'});
var formato = h('select',{id: 'c-formato'},opcionesSelect(FORMATOS,'wav16'));
var kbps = h('select',{id: 'c-kbps'},opcionesSelect(KBPS,'128'));
var campoKbps = campo('c-kbps','Calidad de Opus',kbps);
var kbpsMp3 = h('select',{id: 'c-kbps-mp3'},opcionesSelect(KBPS_MP3,'192'));
var campoKbpsMp3 = campo('c-kbps-mp3','Calidad del MP3',kbpsMp3);
var salida = h('div',{class: 'herr-salida',hidden: true});
var botonEscuchar = h('button',{class: 'boton boton--secundario',type: 'button',id: 'r-escuchar',onclick: escuchar},'Escuchar el resultado');
var botonRecortar = h('button',{class: 'boton',type: 'button',id: 'r-recortar',onclick: recortar},'Recortar');
var panel = h('div',{class: 'recorte',hidden: true},info,onda,
h('div',{class: 'herr-campos'},campo('c-inicio','Inicio',inicio,'Minutos y segundos: 1:05,5. También vale 65,5.'),campo('c-fin','Final',fin,'Déjalo vacío para llegar hasta el final.'),campo('c-modo','Qué hacer con el tramo',modo)),
h('div',{class: 'herr-campos'},campo('c-formato','Guardar como',formato),campoKbpsMp3,campoKbps,h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},fundido,h('label',{for: 'c-fundido',texto: 'Fundido de medio segundo al empezar y al acabar'})))),
h('div',{class: 'herr-acciones'},botonEscuchar,botonRecortar));
raiz.appendChild(panel);raiz.appendChild(salida);
function mostrarCalidad(){campoKbps.hidden = formato.value !== 'opus';campoKbpsMp3.hidden = formato.value !== 'mp3';}
formato.addEventListener('change',mostrarCalidad);mostrarCalidad();
function lugar(v,vacio){var t = String(v).trim();return t === '' ? vacio : TH.sonido ? TH.sonido.leerTiempo(t): NaN;}
function leer(){
var d = pista.duracion,a = lugar(inicio.value,0),b = lugar(fin.value,d);
if(isNaN(a))return{error: 'No entiendo el inicio. Escríbelo como 1:05 o 65,5.'};
if(isNaN(b))return{error: 'No entiendo el final. Escríbelo como 2:30 o 150, o déjalo vacío para llegar hasta el final.'};
if(b > d && b - d < 0.06)b = d;
if(a < 0 || a >= d)return{error: 'El inicio debe estar dentro del audio, que dura ' + TH.sonido.tiempo(d)+ '.'};
if(b > d)return{error: 'El final pasa de la duración del audio (' + TH.sonido.tiempo(d)+ ').'};
if(b <= a)return{error: 'El final tiene que ser posterior al inicio.'};
return{a: a,b: b};
}
function pintar(){if(!pista)return;var r = leer();TH.pistas.onda(onda,pista,r.error ?{}:{inicio: r.a,fin: r.b});}
function abrir(f){
api.estado.poner('Leyendo el audio…','info');panel.hidden = true;salida.hidden = true;
cargar().then(function(P){return P.abrir(f);}).then(function(p){
pista = p;usados ={};inicio.value = '0:00';fin.value = '';panel.hidden = false;api.estado.limpiar();
info.textContent = 'Duración: ' + TH.sonido.tiempo(p.duracion)+ ' · ' + TH.pistas.resumen(p).split(' · ').slice(1).join(' · ')+ '. Pulsa sobre la onda para mover el inicio o el final, o escríbelos.';
pintar();
},function(e){api.estado.poner(e.message,'error');});
}
function cerrar(){parar();pista = null;panel.hidden = true;salida.hidden = true;api.estado.limpiar();}
function resultado(r){
var So = TH.sonido,hz = pista.hz,a = Math.round(r.a * hz),b = Math.round(r.b * hz),n = pista.canales[0].length,c;
if(modo.value === 'conservar')c = So.recortar(pista.canales,a,b);
else{
if(a <= 0 && b >= n)throw new Error('Así quitarías el audio entero. Elige un tramo más corto.');
c = So.unir([So.recortar(pista.canales,0,a),So.recortar(pista.canales,b,n)].filter(function(x){return x[0].length;}),0);
}
if(fundido.checked){var f = Math.min(Math.round(hz / 2),c[0].length >> 1);c = So.fundidos(c,f,f);}
return c;
}
function parar(){if(repro){var r = repro;repro = null;r.parar();}botonEscuchar.textContent = 'Escuchar el resultado';}
function escuchar(){
if(repro)return parar();
var r = leer();if(r.error)return api.estado.poner(r.error,'error');
try{var c = resultado(r);}catch(e){return api.estado.poner(e.message,'error');}
api.estado.limpiar();
repro = TH.pistas.reproducir(c,pista.hz,0,c[0].length / pista.hz,function(){repro = null;botonEscuchar.textContent = 'Escuchar el resultado';});
if(repro)botonEscuchar.textContent = 'Parar';else api.estado.poner('Tu navegador no ha podido reproducir el audio.','aviso');
}
function recortar(){
var r = leer();if(r.error)return api.estado.poner(r.error,'error');
parar();var c;
try{c = resultado(r);}catch(e){return api.estado.poner(e.message,'error');}
botonRecortar.disabled = true;api.estado.poner('Guardando…','info');
var P = TH.pistas,f = P.FORMATOS[formato.value];
P.codificar({canales: c,hz: pista.hz},formato.value,{kbps: formato.value === 'mp3' ? +kbpsMp3.value : +kbps.value}).then(function(blob){
var dur = c[0].length / pista.hz,nombre = P.unico(TH.nombreBase(api.archivos()[0].name)+ '-recortado.' + f.ext,usados);
TH.entrega(salida,[{nombre: nombre,blob: blob,nota: TH.sonido.tiempo(dur)}]);
salida.insertBefore(TH.listaFilas([TH.fila('original','Duración original',pista.duracion,function(x){return TH.sonido.tiempo(x);}),TH.fila('resultado','Duración del resultado',dur,function(x){return TH.sonido.tiempo(x);})]),salida.firstChild);
api.estado.poner('Listo: ' + TH.sonido.tiempo(dur)+ ' de audio en ' + f.nombre + '.','ok');
},function(e){api.estado.poner(e.message,'error');}).then(function(){botonRecortar.disabled = false;});
}
inicio.addEventListener('input',pintar);fin.addEventListener('input',pintar);
onda.addEventListener('click',function(ev){
if(!pista)return;
var rect = onda.getBoundingClientRect(),t = Math.max(0,Math.min(pista.duracion,(ev.clientX - rect.left)/ rect.width * pista.duracion)),r = leer(),a = r.error ? 0 : r.a,b = r.error ? pista.duracion : r.b;
if(Math.abs(t - a)<= Math.abs(t - b))inicio.value = TH.sonido.tiempo(t);else fin.value = t >= pista.duracion - 0.05 ? '' : TH.sonido.tiempo(t);
pintar();
});
});
})();
