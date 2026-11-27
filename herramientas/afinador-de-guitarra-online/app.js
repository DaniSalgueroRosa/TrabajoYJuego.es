(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
function campo(id,et,el,ayuda){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null);}
function opcionesSelect(lista,valor){return lista.map(function(o){return h('option',{value: String(o[0]),selected: String(o[0])=== String(valor)},o[1]);});}
var INSTRUMENTOS ={
guitarra:{nombre: 'Guitarra (Mi La Re Sol Si Mi)',cuerdas:[40,45,50,55,59,64]},
dropd:{nombre: 'Guitarra en Re grave (Drop D)',cuerdas:[38,45,50,55,59,64]},
dadgad:{nombre: 'Guitarra en DADGAD',cuerdas:[38,45,50,55,57,62]},
bajo:{nombre: 'Bajo de cuatro cuerdas',cuerdas:[28,33,38,43]},
ukelele:{nombre: 'Ukelele (Sol Do Mi La)',cuerdas:[67,60,64,69]},
cromatico:{nombre: 'Cromático (cualquier nota)',cuerdas: null}
};
var instrumento = h('select',{id: 'c-instrumento'},opcionesSelect(Object.keys(INSTRUMENTOS).map(function(k){return[k,INSTRUMENTOS[k].nombre];}),'guitarra'));
var referencia = h('input',{id: 'c-la',type: 'text',inputmode: 'numeric',value: '440',autocomplete: 'off'});
var activar = h('button',{class: 'boton',type: 'button',id: 'a-activar',onclick: alternar},'Activar el micrófono');
var estado = TH.estado(raiz);
var notaEl = h('p',{class: 'afi-nota',id: 'a-nota','data-k': 'nota','data-v': '','aria-hidden': 'true',texto: '—'});
var centsEl = h('p',{class: 'afi-cents',id: 'a-cents','data-k': 'cents','data-v': '','aria-hidden': 'true',texto: ''});
var aguja = h('span',{class: 'afi-aguja',id: 'a-aguja',style: 'left: 50%'});
var medidor = h('div',{class: 'afi-medidor','aria-hidden': 'true'},h('span',{class: 'afi-zona'}),aguja,h('span',{class: 'afi-centro'}));
var veredicto = h('p',{class: 'afi-veredicto',id: 'a-veredicto','data-k': 'estado','data-v': 'parado',role: 'status',texto: 'Pulsa «Activar el micrófono» y toca una cuerda.'});
var detalle = h('p',{class: 'herr-chico',id: 'a-detalle','data-k': 'hz','data-v': ''});
var cuerdasCaja = h('div',{class: 'afi-cuerdas',role: 'group','aria-label': 'Cuerdas: pulsa una para oír su tono de referencia'});
raiz.appendChild(h('div',{class: 'herr-campos'},campo('c-instrumento','Instrumento',instrumento),campo('c-la','La de referencia (Hz)',referencia,'Lo normal es 440. De 415 a 466.')));
raiz.appendChild(h('div',{class: 'herr-acciones'},activar));
raiz.appendChild(estado.nodo);
raiz.appendChild(h('div',{class: 'afinador'},notaEl,medidor,centsEl,veredicto,detalle));
raiz.appendChild(cuerdasCaja);
var ctx = null,flujo = null,analizador = null,buf = null,temporizador = 0,activo = false,ultimo = 0,recientes =[],silencioHasta = 0,sonando = null;
function la4(){var v = TH.num(referencia.value);return isFinite(v)&& v >= 415 && v <= 466 ? v : 440;}
function nombreMidi(m){var n = TH.sonido ? TH.sonido.nota(TH.sonido.frecuenciaDeNota(m,440),440):{nombre: '?',octava: 0};return n.nombre + n.octava;}
function pintarCuerdas(objetivo){
TH.vaciar(cuerdasCaja);
var inst = INSTRUMENTOS[instrumento.value];
if(!inst.cuerdas){cuerdasCaja.hidden = true;return;}
cuerdasCaja.hidden = false;
inst.cuerdas.forEach(function(m,i){
var f = TH.sonido.frecuenciaDeNota(m,la4());
cuerdasCaja.appendChild(h('button',{class: 'boton boton--secundario afi-cuerda' +(objetivo === i ? ' es-objetivo' : ''),type: 'button','data-cuerda': String(i + 1),'aria-current': objetivo === i ? 'true' : null,'aria-label': 'Oír la cuerda ' +(i + 1)+ ': ' + nombreMidi(m)+ ', ' + TH.fmt(f,1)+ ' hercios',onclick: function(){tono(f);}},
h('span',{class: 'afi-cuerda-nombre',texto: nombreMidi(m)}),h('span',{class: 'herr-chico',texto: TH.fmt(f,1)+ ' Hz'})));
});
}
function tono(f){
var a = TH.audio();if(!a)return;
silencioHasta = TH.ahora()+ 2800;
var o = a.createOscillator(),g = a.createGain(),t = a.currentTime;
o.type = 'sine';o.frequency.value = f;
g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.35,t + 0.03);g.gain.exponentialRampToValueAtTime(0.0001,t + 2.5);
o.connect(g);g.connect(a.destination);o.start(t);o.stop(t + 2.6);
}
function limites(){var inst = INSTRUMENTOS[instrumento.value];if(!inst.cuerdas)return{min: 50,max: 1200};var lo = Math.min.apply(null,inst.cuerdas),hi = Math.max.apply(null,inst.cuerdas);return{min: TH.sonido.frecuenciaDeNota(lo,440)* 0.8,max: TH.sonido.frecuenciaDeNota(hi,440)* 2.2};}
function mostrar(hz){
var So = TH.sonido,A = la4(),inst = INSTRUMENTOS[instrumento.value],m,objetivo = -1,cents,nombre,f0;
var nota = So.nota(hz,A);
if(inst.cuerdas){
var mejor = 1e9;inst.cuerdas.forEach(function(c,i){var d = Math.abs(1200 * Math.log(hz / So.frecuenciaDeNota(c,A))/ Math.LN2);if(d < mejor){mejor = d;objetivo = i;}});
m = inst.cuerdas[objetivo];f0 = So.frecuenciaDeNota(m,A);cents = 1200 * Math.log(hz / f0)/ Math.LN2;nombre = nombreMidi(m);
}else{m = nota.midi;cents = nota.cents;nombre = nota.nombre + nota.octava;f0 = So.frecuenciaDeNota(m,A);}
var ab = Math.abs(cents),texto;
if(ab <= 5)texto = 'Afinada';else if(ab > 50 && inst.cuerdas)texto = cents < 0 ? 'Muy baja: sube la cuerda' : 'Muy alta: baja la cuerda';else texto = cents < 0 ?(ab <= 15 ? 'Un poco baja: sube la cuerda' : 'Baja: sube la cuerda'):(ab <= 15 ? 'Un poco alta: baja la cuerda' : 'Alta: baja la cuerda');
notaEl.textContent = nombre;notaEl.dataset.v = nombre;
centsEl.textContent =(cents >= 0 ? '+' : '−')+ TH.fmt(Math.abs(cents),0)+ ' cents';centsEl.dataset.v = String(Math.round(cents));
aguja.style.left =(50 + Math.max(-50,Math.min(50,cents)))+ '%';
medidor.classList.toggle('es-afinada',ab <= 5);
veredicto.textContent = texto;veredicto.dataset.v = ab <= 5 ? 'afinada' : cents < 0 ? 'baja' : 'alta';veredicto.classList.toggle('es-afinada',ab <= 5);
detalle.textContent = 'Frecuencia detectada: ' + TH.fmt(hz,1)+ ' Hz (la nota ideal es ' + TH.fmt(f0,1)+ ' Hz).';detalle.dataset.v = String(Math.round(hz * 10)/ 10);
if(inst.cuerdas){[].forEach.call(cuerdasCaja.children,function(b,i){b.classList.toggle('es-objetivo',i === objetivo);if(i === objetivo)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});}
}
function reposo(){
notaEl.textContent = '—';notaEl.dataset.v = '';centsEl.textContent = '';centsEl.dataset.v = '';aguja.style.left = '50%';medidor.classList.remove('es-afinada');
veredicto.textContent = 'Toca una cuerda y deja que suene.';veredicto.dataset.v = 'escuchando';veredicto.classList.remove('es-afinada');detalle.textContent = '';detalle.dataset.v = '';
}
function ciclo(){
if(!activo)return;
temporizador = setTimeout(ciclo,70);
if(TH.ahora()< silencioHasta)return;
analizador.getFloatTimeDomainData(buf);
var l = limites(),r = TH.sonido.tono(buf,ctx.sampleRate,{min: l.min,max: l.max,umbral: 0.15,silencio: 0.006});
var t = TH.ahora();
if(r && r.claridad > 0.8){
recientes.push(r.hz);if(recientes.length > 5)recientes.shift();
var orden = recientes.slice().sort(function(a,b){return a - b;}),mediana = orden[orden.length >> 1];
ultimo = t;mostrar(mediana);
}else if(t - ultimo > 900){recientes =[];reposo();}
}
function alternar(){
if(activo)return detener();
var md = navigator.mediaDevices;
if(!md || !md.getUserMedia){estado.poner('Tu navegador no deja usar el micrófono en esta página. Hace falta una versión reciente y una conexión segura (https).','error');return;}
estado.poner('Esperando el permiso para usar el micrófono…','info');
Promise.all([TH.script('lib/sonido.js'),md.getUserMedia({audio:{echoCancellation: false,noiseSuppression: false,autoGainControl: false}})]).then(function(r){
flujo = r[1];
var C = window.AudioContext || window.webkitAudioContext;ctx = new C();
if(ctx.state === 'suspended')ctx.resume();
var fuente = ctx.createMediaStreamSource(flujo);analizador = ctx.createAnalyser();analizador.fftSize = 8192;analizador.smoothingTimeConstant = 0;
fuente.connect(analizador);buf = new Float32Array(analizador.fftSize);
activo = true;recientes =[];ultimo = 0;activar.textContent = 'Parar el micrófono';estado.limpiar();reposo();ciclo();
},function(e){
var n = e && e.name;
estado.poner(n === 'NotAllowedError' || n === 'SecurityError' ? 'El micrófono está bloqueado. Permítelo desde el icono del candado de la barra de direcciones y vuelve a pulsar el botón.' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'No se ha encontrado ningún micrófono en este dispositivo.' : 'No se ha podido usar el micrófono' +(e && e.message ? ' (' + e.message + ')' : '')+ '.','error');
});
}
function detener(){
activo = false;clearTimeout(temporizador);
if(flujo)flujo.getTracks().forEach(function(t){t.stop();});flujo = null;
if(ctx){try{ctx.close();}catch(x){}ctx = null;}
activar.textContent = 'Activar el micrófono';veredicto.textContent = 'Micrófono apagado. Pulsa «Activar el micrófono» para volver a empezar.';veredicto.dataset.v = 'parado';
notaEl.textContent = '—';notaEl.dataset.v = '';centsEl.textContent = '';centsEl.dataset.v = '';aguja.style.left = '50%';medidor.classList.remove('es-afinada');detalle.textContent = '';
}
instrumento.addEventListener('change',function(){TH.script('lib/sonido.js').then(function(){pintarCuerdas(-1);});recientes =[];});
referencia.addEventListener('change',function(){referencia.value = String(la4()).replace('.',',');TH.script('lib/sonido.js').then(function(){pintarCuerdas(-1);});});
TH.script('lib/sonido.js').then(function(){pintarCuerdas(-1);});
window.addEventListener('pagehide',detener);
});
})();
