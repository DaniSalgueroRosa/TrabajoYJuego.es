(function(){
'use strict';
TH.alCargar(function(raiz){
var h = TH.h;
function campo(id,et,el,ayuda){return h('div',{class: 'campo'},h('label',{for: id,texto: et}),el,ayuda ? h('span',{class: 'campo-ayuda',texto: ayuda}): null);}
function opcionesSelect(lista,valor){return lista.map(function(o){return h('option',{value: String(o[0]),selected: String(o[0])=== String(valor)},o[1]);});}
var TEMPOS =[[0,'Grave'],[40,'Largo'],[60,'Larghetto'],[66,'Adagio'],[76,'Andante'],[108,'Moderato'],[120,'Allegro'],[156,'Vivace'],[176,'Presto'],[200,'Prestissimo']];
function nombreTempo(b){var n = TEMPOS[0][1];TEMPOS.forEach(function(t){if(b >= t[0])n = t[1];});return n;}
var SONIDOS ={clic:{tipo: 'square',f:[1800,1200,900],dur: 0.03,nombre: 'Clic'},madera:{tipo: 'sine',f:[1400,900,650],dur: 0.07,nombre: 'Madera'},pitido:{tipo: 'sine',f:[1320,880,660],dur: 0.1,nombre: 'Pitido'}};
var bpm = h('input',{id: 'c-bpm',type: 'text',inputmode: 'numeric',value: '100',autocomplete: 'off'});
var desliza = h('input',{id: 'c-deslizador',type: 'range',min: '30',max: '300',step: '1',value: '100','aria-label': 'Ajuste con deslizador del tempo'});
var pulsos = h('select',{id: 'c-pulsos'},opcionesSelect([1,2,3,4,5,6,7,8,9,10,11,12].map(function(n){return[n,n === 1 ? '1 pulso (sin compás)' : n + ' pulsos'];}),4));
var subdiv = h('select',{id: 'c-subdivision'},opcionesSelect([[1,'Ninguna (solo pulsos)'],[2,'Corcheas (2 por pulso)'],[3,'Tresillos (3 por pulso)'],[4,'Semicorcheas (4 por pulso)']],1));
var sonido = h('select',{id: 'c-sonido'},opcionesSelect(Object.keys(SONIDOS).map(function(k){return[k,SONIDOS[k].nombre];}),'clic'));
var volumen = h('input',{id: 'c-volumen',type: 'range',min: '0',max: '100',step: '1',value: '70','aria-label': 'Volumen'});
var acento = h('input',{id: 'c-acento',type: 'checkbox',checked: true});
var menos = h('button',{class: 'boton boton--secundario',type: 'button',id: 'm-menos','aria-label': 'Bajar un pulso por minuto',onclick: function(){poner(leerBpm()- 1);}},'−');
var mas = h('button',{class: 'boton boton--secundario',type: 'button',id: 'm-mas','aria-label': 'Subir un pulso por minuto',onclick: function(){poner(leerBpm()+ 1);}},'+');
var inicio = h('button',{class: 'boton',type: 'button',id: 'm-iniciar',onclick: alternar},'Empezar');
var tap = h('button',{class: 'boton boton--secundario',type: 'button',id: 'm-tap',onclick: tocar},'Marcar el tempo con toques');
var puntos = h('div',{class: 'metro-pulsos','aria-hidden': 'true'});
var salida = h('div',{class: 'herr-salida','aria-live': 'off'});
var estado = TH.estado(raiz);
raiz.appendChild(h('div',{class: 'herr-campos'},h('div',{class: 'campo'},h('label',{for: 'c-bpm',texto: 'Pulsos por minuto'}),h('div',{class: 'metro-bpm'},menos,bpm,mas),desliza,h('span',{class: 'campo-ayuda',texto: 'De 30 a 300.'})),
campo('c-pulsos','Pulsos por compás',pulsos),campo('c-subdivision','Subdivisión',subdiv),campo('c-sonido','Sonido',sonido),campo('c-volumen','Volumen',volumen),
h('div',{class: 'campo campo--check'},h('span',{class: 'campo-check'},acento,h('label',{for: 'c-acento',texto: 'Acentuar el primer pulso del compás'})))));
raiz.appendChild(h('div',{class: 'herr-acciones'},inicio,tap));
raiz.appendChild(puntos);raiz.appendChild(estado.nodo);raiz.appendChild(salida);
var ctx = null,corriendo = false,proximo = 0,idx = 0,reloj = 0,avisos =[],toques =[],bpmActual = 100;
function leerBpm(){var v = TH.num(bpm.value);return isFinite(v)&& v >= 30 && v <= 300 ? Math.round(v): bpmActual;}
function poner(v){
v = Math.max(30,Math.min(300,Math.round(v)));bpmActual = v;bpm.value = String(v);desliza.value = String(v);estado.limpiar();pintarResultado(null);
}
function dibujarPuntos(){
TH.vaciar(puntos);
var n = +pulsos.value,i;
for(i = 0;i < n;i++)puntos.appendChild(h('span',{class: 'metro-punto' +(i === 0 && acento.checked ? ' metro-punto--acento' : ''),'data-pulso': String(i + 1)}));
}
function pintarResultado(pulso){
var b = bpmActual,n = +pulsos.value,filas =[TH.fila('tempo','Tempo',b,function(x){return TH.fmt(x,0)+ ' pulsos por minuto';}),TH.fila('nombre','Indicación clásica (aproximada)',nombreTempo(b),'txt'),
TH.fila('intervalo','Tiempo entre pulsos',60000 / b,function(x){return TH.fmt(x,0)+ ' ms';}),TH.fila('compas','Compás',n === 1 ? 'Sin compás' : n + ' pulsos','txt'),
TH.fila('pulso','Pulso actual',pulso == null ? '—' : pulso + ' de ' + n,'txt')];
TH.vaciar(salida);salida.appendChild(TH.listaFilas(filas));
}
function sonar(t,i){
var subs = +subdiv.value,n = +pulsos.value,esPulso = i % subs === 0,primero = i === 0 && acento.checked && n > 1,S = SONIDOS[sonido.value],v = +volumen.value / 100;
var o = ctx.createOscillator(),g = ctx.createGain(),vol = Math.max(0.0001,v * v *(esPulso ? 0.9 : 0.45));
o.type = S.tipo;o.frequency.value = primero ? S.f[0]: esPulso ? S.f[1]: S.f[2];
g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t + 0.002);g.gain.exponentialRampToValueAtTime(0.0001,t + S.dur);
o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t + S.dur + 0.02);
}
function resaltar(i,t){
var subs = +subdiv.value;
if(i % subs !== 0)return;
var pulso = i / subs,espera = Math.max(0,(t - ctx.currentTime)* 1000);
avisos.push(setTimeout(function(){
if(!corriendo)return;
[].forEach.call(puntos.children,function(p,k){p.classList.toggle('es-activo',k === pulso);});
pintarResultado(pulso + 1);
},espera));
if(avisos.length > 40)avisos.splice(0,avisos.length - 40);
}
function programar(){
var n = +pulsos.value,subs = +subdiv.value;
while(proximo < ctx.currentTime + 0.12){
if(idx >= n * subs)idx = 0;
sonar(proximo,idx);resaltar(idx,proximo);
bpmActual = leerBpm();
proximo += 60 / bpmActual / subs;idx++;
}
reloj = setTimeout(programar,25);
}
function alternar(){
if(corriendo)return parar();
var v = TH.num(bpm.value);
if(!isFinite(v)|| v < 30 || v > 300){estado.poner('Escribe un tempo entre 30 y 300 pulsos por minuto.','error');return;}
poner(v);
ctx = TH.audio();
if(!ctx){estado.poner('Tu navegador no puede reproducir sonido con esta herramienta.','error');return;}
corriendo = true;idx = 0;proximo = ctx.currentTime + 0.08;inicio.textContent = 'Parar';inicio.setAttribute('aria-pressed','true');
dibujarPuntos();programar();
}
function parar(){
corriendo = false;clearTimeout(reloj);avisos.forEach(clearTimeout);avisos =[];
inicio.textContent = 'Empezar';inicio.setAttribute('aria-pressed','false');
[].forEach.call(puntos.children,function(p){p.classList.remove('es-activo');});pintarResultado(null);
}
function tocar(){
var ahora = TH.ahora();
if(toques.length && ahora - toques[toques.length - 1]> 2000)toques =[];
toques.push(ahora);if(toques.length > 8)toques.shift();
if(toques.length < 2){estado.poner('Sigue tocando al ritmo que quieras: con dos toques ya calculo el tempo.','info');return;}
var media =(toques[toques.length - 1]- toques[0])/(toques.length - 1),v = 60000 / media;
if(v < 30 || v > 300){estado.poner('Ese ritmo (' + TH.fmt(v,0)+ ' pulsos por minuto) queda fuera del margen de 30 a 300.','aviso');return;}
poner(v);estado.poner('Tempo calculado con ' + toques.length + ' toques: ' + Math.round(v)+ ' pulsos por minuto.','ok');
}
bpm.addEventListener('input',function(){var v = TH.num(bpm.value);if(isFinite(v)&& v >= 30 && v <= 300){bpmActual = Math.round(v);desliza.value = String(bpmActual);estado.limpiar();if(!corriendo)pintarResultado(null);}});
bpm.addEventListener('change',function(){poner(leerBpm());});
desliza.addEventListener('input',function(){poner(+desliza.value);});
pulsos.addEventListener('change',function(){dibujarPuntos();idx = 0;if(!corriendo)pintarResultado(null);});
subdiv.addEventListener('change',function(){idx = 0;});
acento.addEventListener('change',dibujarPuntos);
dibujarPuntos();pintarResultado(null);
});
})();
