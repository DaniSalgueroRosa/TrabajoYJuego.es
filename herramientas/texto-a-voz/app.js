(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
function campo(id,et,el,ayuda){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null);}
function opcionesSelect(lista,valor){return lista.map(function(o){return h('option',{value: String(o[0]),selected: String(o[0])=== String(valor)},o[1]);});}
var ss = window.speechSynthesis;
if(!ss || typeof window.SpeechSynthesisUtterance !== 'function'){
raiz.appendChild(h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'Tu navegador no incluye la síntesis de voz. Prueba con una versión reciente de Chrome, Edge, Safari o Firefox.'}));
return;
}
var area = h('textarea',{id: 'v-texto',rows: '8',placeholder: 'Escribe o pega aquí el texto que quieres escuchar.',spellcheck: 'true'});
var voz = h('select',{id: 'c-voz'});
var velocidad = h('input',{id: 'c-velocidad',type: 'range',min: '0.5',max: '2',step: '0.05',value: '1'});
var tono = h('input',{id: 'c-tono',type: 'range',min: '0',max: '2',step: '0.1',value: '1'});
var volumen = h('input',{id: 'c-volumen',type: 'range',min: '0',max: '1',step: '0.05',value: '1'});
var vVel = h('output',{class: 'herr-chico',for: 'c-velocidad',texto: '1×'}),vTono = h('output',{class: 'herr-chico',for: 'c-tono',texto: '1'}),vVol = h('output',{class: 'herr-chico',for: 'c-volumen',texto: '100 %'});
var leer = h('button',{class: 'boton',type: 'button',id: 'v-leer',onclick: hablar},'Leer en voz alta');
var pausa = h('button',{class: 'boton boton--secundario',type: 'button',id: 'v-pausa',disabled: true,onclick: pausar},'Pausar');
var parar = h('button',{class: 'boton boton--secundario',type: 'button',id: 'v-parar',disabled: true,onclick: detener},'Parar');
var estadoEl = h('p',{class: 'herr-chico',id: 'v-estado','data-k': 'estado','data-v': 'parado','aria-live': 'polite',texto: 'Listo para leer.'});
var estado = TH.estado(raiz);
raiz.appendChild(h('div',{class: 'campo campo--completo'},h('label',{for: 'v-texto',texto: 'Texto'}),area));
raiz.appendChild(h('div',{class: 'herr-campos'},campo('c-voz','Voz',voz),
h('div',{class: 'campo'},h('label',{for: 'c-velocidad',texto: 'Velocidad'}),velocidad,vVel),h('div',{class: 'campo'},h('label',{for: 'c-tono',texto: 'Tono'}),tono,vTono),h('div',{class: 'campo'},h('label',{for: 'c-volumen',texto: 'Volumen'}),volumen,vVol)));
raiz.appendChild(h('div',{class: 'herr-acciones'},leer,pausa,parar));
raiz.appendChild(estado.nodo);raiz.appendChild(estadoEl);
var voces =[],partes =[],pos = 0,leyendo = false,enPausa = false,token = 0;
function cargarVoces(){
var antes = voces[+voz.value]? voces[+voz.value].voiceURI + '|' + voces[+voz.value].name : '';
var todas =(ss.getVoices()||[]).slice();
if(!todas.length){voces =[];TH.vaciar(voz);voz.appendChild(h('option',{value: '0'},'Voz predeterminada del dispositivo'));return;}
todas.sort(function(a,b){var ea = /^es/i.test(a.lang)? 0 : 1,eb = /^es/i.test(b.lang)? 0 : 1;return ea - eb ||(a.lang + a.name).localeCompare(b.lang + b.name);});
voces = todas;TH.vaciar(voz);
voces.forEach(function(v,i){voz.appendChild(h('option',{value: String(i),selected:(v.voiceURI + '|' + v.name)=== antes},v.name + ' (' + v.lang + ')' +(v.localService === false ? ' · en línea' : '')));});
if(!antes)voz.value = '0';
var hayEs = voces.some(function(v){return /^es/i.test(v.lang);});
if(!hayEs)estado.poner('Tu dispositivo no tiene voces en español. Se leerá con otra voz; puedes instalar voces en español en los ajustes del sistema.','aviso');
}
cargarVoces();
if(ss.addEventListener)ss.addEventListener('voiceschanged',cargarVoces);else ss.onvoiceschanged = cargarVoces;
function trocear(t){
var frases = t.replace(/\r/g,'').match(/[^.!?…\n]+[.!?…]*[\s]*|\n+/g)||[t],out =[],act = '';
frases.forEach(function(f){
f = f.replace(/\s+/g,' ').trim();if(!f)return;
while(f.length > 220){var corte = f.lastIndexOf(',',220);if(corte < 80)corte = f.lastIndexOf(' ',220);if(corte < 40)corte = 220;if(act){out.push(act);act = '';}out.push(f.slice(0,corte + 1).trim());f = f.slice(corte + 1).trim();}
if((act + ' ' + f).trim().length > 220){out.push(act);act = f;}else act =(act + ' ' + f).trim();
});
if(act)out.push(act);
return out.filter(Boolean);
}
function fijar(texto,k){estadoEl.textContent = texto;estadoEl.dataset.v = k;}
function siguiente(miToken){
if(miToken !== token)return;
if(pos >= partes.length){leyendo = false;enPausa = false;leer.disabled = false;pausa.disabled = true;parar.disabled = true;pausa.textContent = 'Pausar';fijar('Lectura terminada.','terminado');return;}
var u = new window.SpeechSynthesisUtterance(partes[pos]),v = voces[+voz.value];
if(v){try{u.voice = v;}catch(x){}u.lang = v.lang;}else u.lang = 'es-ES';
u.rate = +velocidad.value;u.pitch = +tono.value;u.volume = +volumen.value;
u.onstart = function(){if(miToken === token)fijar('Leyendo: fragmento ' +(pos + 1)+ ' de ' + partes.length + '.','leyendo');};
u.onend = function(){if(miToken !== token)return;pos++;siguiente(miToken);};
u.onerror = function(e){if(miToken !== token)return;if(e &&(e.error === 'canceled' || e.error === 'interrupted'))return;leyendo = false;leer.disabled = false;pausa.disabled = true;parar.disabled = true;fijar('Error de voz','error');estado.poner('No se ha podido reproducir la voz' +(e && e.error ? ' (' + e.error + ')' : '')+ '. Prueba con otra voz.','error');};
ss.speak(u);
}
function hablar(){
var t = area.value.trim();
if(!t){estado.poner('Escribe o pega algún texto para poder leerlo.','aviso');return;}
estado.limpiar();token++;ss.cancel();partes = trocear(t);pos = 0;leyendo = true;enPausa = false;
leer.disabled = true;pausa.disabled = false;parar.disabled = false;pausa.textContent = 'Pausar';fijar('Preparando la lectura…','leyendo');
siguiente(token);
}
function pausar(){
if(!leyendo)return;
if(enPausa){ss.resume();enPausa = false;pausa.textContent = 'Pausar';fijar('Leyendo: fragmento ' +(pos + 1)+ ' de ' + partes.length + '.','leyendo');}
else{ss.pause();enPausa = true;pausa.textContent = 'Reanudar';fijar('En pausa.','pausado');}
}
function detener(){token++;ss.cancel();leyendo = false;enPausa = false;leer.disabled = false;pausa.disabled = true;parar.disabled = true;pausa.textContent = 'Pausar';fijar('Lectura detenida.','parado');}
velocidad.addEventListener('input',function(){vVel.textContent = TH.fmt(+velocidad.value,2)+ '×';});
tono.addEventListener('input',function(){vTono.textContent = TH.fmt(+tono.value,1);});
volumen.addEventListener('input',function(){vVol.textContent = Math.round(+volumen.value * 100)+ ' %';});
window.addEventListener('pagehide',function(){ss.cancel();});
});
})();
