(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
function campo(id,et,el,ayuda){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null);}
function opcionesSelect(lista,valor){return lista.map(function(o){return h('option',{value: String(o[0]),selected: String(o[0])=== String(valor)},o[1]);});}
function cargarLibs(){return Promise.all([TH.script('lib/sonido.js'),TH.script('lib/hash.js'),TH.script('lib/pistas.js')]);}
var procesado = h('input',{id: 'c-procesado',type: 'checkbox',checked: true});
var formato = h('select',{id: 'c-formato'},opcionesSelect([['original','Tal cual lo graba el navegador (el más pequeño)'],['wav16','WAV 16 bits (sin pérdidas, el más compatible)'],['flac16','FLAC 16 bits (sin pérdidas, ocupa la mitad)'],['mp3','MP3 (con pérdidas, lo abre cualquier reproductor)'],['opus','Ogg Opus (con pérdidas, muy pequeño)']],'original'));
var grabar = h('button',{class: 'boton',type: 'button',id: 'g-grabar',onclick: empezar},'Grabar');
var pausa = h('button',{class: 'boton boton--secundario',type: 'button',id: 'g-pausa',disabled: true,onclick: pausar},'Pausar');
var parar = h('button',{class: 'boton boton--secundario',type: 'button',id: 'g-parar',disabled: true,onclick: terminar},'Parar');
var tiempoEl = h('p',{class: 'grab-tiempo',id: 'g-tiempo','data-k': 'tiempo','data-v': '0',texto: '0:00'});
var estadoEl = h('p',{class: 'herr-chico',id: 'g-estado','data-k': 'estado','data-v': 'inactivo','aria-live': 'polite',texto: 'Listo para grabar.'});
var barra = h('span',{class: 'grab-barra',id: 'g-nivel'});
var nivel = h('div',{class: 'grab-nivel',role: 'img','aria-label': 'Nivel de entrada del micrófono'},barra);
var estado = TH.estado(raiz);
var reproductor = h('div',{class: 'grab-resultado',hidden: true});
var salida = h('div',{class: 'herr-salida',hidden: true});
raiz.appendChild(h('div',{class: 'herr-campos'},h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},procesado,h('label',{for: 'c-procesado',texto: 'Reducir ruido y eco del micrófono (recomendado para voz)'})))));
raiz.appendChild(h('div',{class: 'grab-panel'},tiempoEl,nivel,estadoEl));
raiz.appendChild(h('div',{class: 'herr-acciones'},grabar,pausa,parar));
raiz.appendChild(estado.nodo);raiz.appendChild(reproductor);raiz.appendChild(salida);
var flujo = null,rec = null,trozos =[],ctx = null,analizador = null,buf = null,medidor = 0,reloj = 0,t0 = 0,acumulado = 0,pausadoDesde = 0,blob = null,url = '',estadoRec = 'inactivo',usados ={};
function fmt(ms){var s = Math.floor(ms / 1000),m = Math.floor(s / 60);return m + ':' +('0' +(s % 60)).slice(-2);}
function elapsed(){return acumulado +(estadoRec === 'grabando' ? TH.ahora()- t0 : 0);}
function fijar(t,k){estadoRec = k;estadoEl.textContent = t;estadoEl.dataset.v = k;}
function pintarTiempo(){var ms = elapsed();tiempoEl.textContent = fmt(ms);tiempoEl.dataset.v = String(Math.floor(ms / 1000));}
function medir(){
if(!analizador)return;
analizador.getFloatTimeDomainData(buf);
var pico = 0,i;for(i = 0;i < buf.length;i++){var a = Math.abs(buf[i]);if(a > pico)pico = a;}
barra.style.width = Math.min(100,Math.round(Math.sqrt(pico)* 100))+ '%';
medidor = setTimeout(medir,60);
}
function limpiarFlujo(){
clearTimeout(medidor);clearInterval(reloj);analizador = null;
if(flujo)flujo.getTracks().forEach(function(t){t.stop();});flujo = null;
if(ctx){try{ctx.close();}catch(x){}ctx = null;}
barra.style.width = '0%';
}
function descartar(){if(url)URL.revokeObjectURL(url);url = '';blob = null;trozos =[];TH.vaciar(reproductor);reproductor.hidden = true;TH.vaciar(salida);salida.hidden = true;TH.entregas = null;}
function empezar(){
var md = navigator.mediaDevices;
if(!md || !md.getUserMedia || typeof window.MediaRecorder !== 'function'){estado.poner('Tu navegador no deja grabar audio en esta página. Hace falta una versión reciente y una conexión segura (https).','error');return;}
descartar();estado.poner('Esperando el permiso para usar el micrófono…','info');
var p = procesado.checked;
md.getUserMedia({audio:{echoCancellation: p,noiseSuppression: p,autoGainControl: p}}).then(function(f){
flujo = f;
var tipos =['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus','audio/webm'],tipo = tipos.filter(function(t){return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t);})[0];
rec = tipo ? new MediaRecorder(f,{mimeType: tipo}): new MediaRecorder(f);
trozos =[];
rec.ondataavailable = function(e){if(e.data && e.data.size)trozos.push(e.data);};
rec.onstop = alParar;
var C = window.AudioContext || window.webkitAudioContext;
if(C){ctx = new C();var fuente = ctx.createMediaStreamSource(f);analizador = ctx.createAnalyser();analizador.fftSize = 1024;fuente.connect(analizador);buf = new Float32Array(analizador.fftSize);medir();}
rec.start(250);acumulado = 0;t0 = TH.ahora();fijar('Grabando…','grabando');estado.limpiar();
grabar.disabled = true;pausa.disabled = false;parar.disabled = false;pausa.textContent = 'Pausar';
reloj = setInterval(pintarTiempo,200);pintarTiempo();
},function(e){
var n = e && e.name;
estado.poner(n === 'NotAllowedError' || n === 'SecurityError' ? 'El micrófono está bloqueado. Permítelo desde el icono del candado de la barra de direcciones y vuelve a pulsar Grabar.' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No se ha encontrado ningún micrófono en este dispositivo.' : 'No se ha podido usar el micrófono' +(e && e.message ? ' (' + e.message + ')' : '')+ '.','error');
});
}
function pausar(){
if(!rec)return;
if(estadoRec === 'grabando'){rec.pause();acumulado += TH.ahora()- t0;fijar('En pausa.','pausado');pausa.textContent = 'Reanudar';pintarTiempo();}
else if(estadoRec === 'pausado'){rec.resume();t0 = TH.ahora();fijar('Grabando…','grabando');pausa.textContent = 'Pausar';}
}
function terminar(){
if(!rec || rec.state === 'inactive')return;
if(estadoRec === 'grabando')acumulado += TH.ahora()- t0;
estadoRec = 'detenido';pintarTiempo();rec.stop();
}
function extension(tipo){return /mp4/.test(tipo)? 'm4a' : /ogg/.test(tipo)? 'ogg' : 'webm';}
function alParar(){
limpiarFlujo();
var tipo =(rec && rec.mimeType)||(trozos[0]&& trozos[0].type)|| 'audio/webm';
grabar.disabled = false;pausa.disabled = true;parar.disabled = true;pausa.textContent = 'Pausar';
if(!trozos.length){fijar('No se ha grabado nada.','inactivo');estado.poner('No se ha grabado nada. Comprueba que el micrófono funciona y vuelve a probar.','aviso');return;}
blob = new Blob(trozos,{type: tipo.split(';')[0]});url = URL.createObjectURL(blob);
fijar('Grabación terminada: ' + fmt(acumulado)+ '.','detenido');
var audio = h('audio',{controls: true,src: url,id: 'g-audio',preload: 'metadata'});
var preparar = h('button',{class: 'boton',type: 'button',id: 'g-preparar',onclick: guardar},'Preparar descarga');
var otra = h('button',{class: 'boton boton--secundario',type: 'button',id: 'g-descartar',onclick: function(){descartar();fijar('Listo para grabar.','inactivo');tiempoEl.textContent = '0:00';tiempoEl.dataset.v = '0';acumulado = 0;}},'Descartar y grabar otra');
reproductor.hidden = false;TH.vaciar(reproductor);
reproductor.appendChild(h('p',{class: 'herr-chico',texto: 'Escucha la grabación antes de guardarla. Si cierras la página sin descargarla, se perderá.'}));
reproductor.appendChild(audio);
reproductor.appendChild(h('div',{class: 'herr-campos'},campo('c-formato','Guardar como',formato)));
reproductor.appendChild(h('div',{class: 'herr-acciones'},preparar,otra));
}
function marca(){var d = new Date(TH.ahora()),z = function(n){return('0' + n).slice(-2);};return d.getFullYear()+ '-' + z(d.getMonth()+ 1)+ '-' + z(d.getDate())+ '-' + z(d.getHours())+ z(d.getMinutes());}
function guardar(){
if(!blob)return;
var f = formato.value,nombre = 'grabacion-' + marca();
estado.poner('Preparando el archivo…','info');
if(f === 'original'){TH.entrega(salida,[{nombre: nombre + '.' + extension(blob.type),blob: blob,nota: fmt(acumulado)}]);estado.limpiar();return;}
cargarLibs().then(function(){
var P = TH.pistas;
return P.abrir(new File([blob],nombre + '.' + extension(blob.type),{type: blob.type})).then(function(pista){
return P.codificar(pista,f,{kbps: f === 'mp3' ? 128 : 96}).then(function(b){
TH.entrega(salida,[{nombre: nombre + '.' + P.FORMATOS[f].ext,blob: b,nota: P.resumen(pista)}]);estado.limpiar();
});
});
}).catch(function(e){estado.poner(e.message || 'No se ha podido preparar el archivo.','error');});
}
window.addEventListener('beforeunload',function(ev){if(estadoRec === 'grabando' || estadoRec === 'pausado' || estadoRec === 'detenido'){ev.preventDefault();ev.returnValue = '';}});
window.addEventListener('pagehide',limpiarFlujo);
});
})();
