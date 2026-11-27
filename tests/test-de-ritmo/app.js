(function(){
'use strict';
var host = TT.app();
if(!host)return;
var PRE = 4,CON = 8,SIN = 8,TOTAL = PRE + CON + SIN,MARGEN = 700;
var bpm = 90,iv = 60000 / bpm,estado = 'espera',ref0 = 0,audio0 = 0,taps =[],plan = 0,planificador = 0,avisos =[],panel = null,fin = 0;
var cBpm = TT.chips([[60,'60 ppm'],[90,'90 ppm'],[120,'120 ppm']],bpm,function(v){bpm = v;iv = 60000 / v;reiniciar();},'Tempo en pulsos por minuto');
var datos = TT.datos([['f','Fase','—'],['p','Pulsaciones','0']]);
var punto = TT.h('span',{class: 'rt-punto','aria-hidden': 'true'});
var titulo = TT.h('span',{class: 'tt-arena-t'}),pista = TT.h('small');
var arena = TT.h('button',{type: 'button',class: 'tt-arena rt-arena','data-estado': 'espera'},punto,titulo,pista);
var aviso = TT.h('p',{class: 'tt-aviso',role: 'status',texto: 'Necesitas sonido: usa auriculares o altavoces con un volumen cómodo. Pulsa la zona (o la barra espaciadora) al ritmo de los pitidos.'});
function ahora(e){var m = e && e.timeStamp;return m && m < 1e11 && Math.abs(m - performance.now())< 5000 ? m : performance.now();}
function ref(k){return ref0 + k * iv;}
function textos(fase){
titulo.textContent = fase === 'espera' ? 'Pulsa para empezar' : fase === 'pre' ? 'Escucha la cuenta…' : fase === 'con' ? '¡Sigue el pitido!' : fase === 'sin' ? '¡Sigue tú solo!' : '¡Terminado!';
pista.textContent = fase === 'espera' ? 'Primero suenan 4 pitidos de cuenta. Después pulsa a tiempo con 8 pitidos y sigue tú solo otros 8 pulsos, sin pitido.' : '';
arena.setAttribute('data-estado',fase);
datos.poner('f',fase === 'espera' ? '—' : fase === 'pre' ? 'Cuenta' : fase === 'con' ? 'Con pitido' : fase === 'sin' ? 'Sin pitido' : 'Fin');
}
function empezar(){
var c = TT.audio();
if(!c){aviso.textContent = 'Tu navegador no permite reproducir audio, así que este test no se puede hacer aquí.';return;}
estado = 'jugando';taps =[];plan = 0;avisos =[];
cBpm.bloquear(true);
var lat =(c.outputLatency || 0)* 1000;
ref0 = performance.now()+ MARGEN + lat;audio0 = c.currentTime + MARGEN / 1000;
textos('pre');
planificador = window.setInterval(planificar,25);
planificar();
TT.anunciar('Escucha los cuatro pitidos de cuenta.');
}
function programar(k,c){
if(k < PRE + CON && c)TT.tono(k === 0 ? 1320 : 880,0.07,0.25,Math.max(audio0 + k * iv / 1000,c.currentTime),'triangle');
avisos.push(window.setTimeout(function(){latido(k);},Math.max(0,ref(k)- performance.now())));
}
function planificar(){
var c = TT.audio(),ahoraP = performance.now();
while(plan < TOTAL && ref(plan)- 150 <= ahoraP){
programar(plan,c);
plan++;
}
if(plan >= TOTAL && !fin){fin = window.setTimeout(terminar,Math.max(0,ref(TOTAL - 1)+ iv * 0.6 - performance.now()));}
}
function latido(k){
if(estado !== 'jugando')return;
arena.setAttribute('data-pulso',String(k));
if(k === PRE)textos('con');
if(k === PRE + CON)textos('sin');
if(k < PRE + CON){punto.classList.remove('rt-latido');void punto.offsetWidth;punto.classList.add('rt-latido');}
pista.textContent = k < PRE ? 'Pitido ' +(k + 1)+ ' de ' + PRE : k < PRE + CON ? 'Pulso ' +(k - PRE + 1)+ ' de ' + CON : 'Pulso ' +(k - PRE - CON + 1)+ ' de ' + SIN + ' (sin pitido)';
}
function pulsar(e){
if(estado === 'fin')return;
if(estado === 'espera'){empezar();return;}
taps.push(ahora(e));
datos.poner('p',String(taps.length));
}
function terminar(){
if(estado !== 'jugando')return;
window.clearInterval(planificador);estado = 'fin';
textos('fin');
var usado ={},desf =[],k,j;
for(k = PRE;k < PRE + CON;k++){
var mejor = -1,dist = iv * 0.5;
for(j = 0;j < taps.length;j++)if(!usado[j]&& Math.abs(taps[j]- ref(k))< dist){dist = Math.abs(taps[j]- ref(k));mejor = j;}
if(mejor >= 0){usado[mejor]= true;desf.push(taps[mejor]- ref(k));}
}
var solos = taps.filter(function(t){return t >= ref(PRE + CON)- iv * 0.5 && t < ref(TOTAL - 1)+ iv * 0.6;});
var ints = TT.intervalos(solos),media = desf.length ? TT.media(desf): 0,irr = desf.length >= 4 ? TT.desviacion(desf): null;
var rango = irr == null ?{nombre: 'Sin datos suficientes',texto: 'Hacen falta al menos cuatro pulsaciones junto a los pitidos para medir tu regularidad. Repite el test y pulsa con cada pitido.'}: TT.rangoMax(irr,[
[15,'Metrónomo humano','Una regularidad excelente, de músico entrenado.'],
[25,'Muy buen ritmo','Pulsas con mucha precisión respecto al pitido.'],
[40,'Buen sentido del ritmo','Sigues el pulso con bastante soltura.'],
[60,'Aceptable','Sigues el pulso, aunque con desvíos apreciables. Prueba con el tempo más lento.'],
[Infinity,'A practicar','Te cuesta mantener el pulso. Repite con 60 pulsos por minuto y marca el ritmo con el pie.']]);
var detalles =[['Pulsaciones con pitido',desf.length + ' de ' + CON],['Desfase medio',desf.length ?(media < 0 ? 'te adelantas ' : 'te retrasas ')+ TT.fmt(Math.abs(media),0)+ ' ms' : '—']];
if(ints.length >= 3){var mi = TT.media(ints);detalles.push(['Tempo sin pitido',TT.fmt(60000 / mi,1)+ ' ppm (objetivo ' + bpm + ')']);detalles.push(['Variación sin pitido',TT.fmt(TT.desviacion(ints),0)+ ' ms entre pulsos']);}
else detalles.push(['Tempo sin pitido','pocas pulsaciones para medirlo (' + solos.length + ')']);
detalles.push(['Pulsaciones en total',taps.length]);
window.setTimeout(function(){
if(estado !== 'fin')return;
var extra = desf.length ? TT.barras(desf.map(function(x){return Math.round(Math.abs(x));}),{formato: function(x){return x + ' ms';},descripcion: 'Distancia de cada pulsación al pitido',pie:['Primer pulso','Último']}): null;
panel = TT.resultado(host,{titulo: 'Tu sentido del ritmo',valor: irr == null ? '—' : TT.fmt(irr,0),unidad: irr == null ? '' : 'ms de irregularidad',rango: rango,extra: extra,detalles: detalles,
copia: irr == null ? null : 'Mi sentido del ritmo a ' + bpm + ' ppm: ' + TT.fmt(irr,0)+ ' ms de irregularidad.',alRepetir: reiniciar});
TT.anunciar('Resultado: ' +(irr == null ? 'sin datos suficientes.' : TT.fmt(irr,0)+ ' milisegundos de irregularidad.'));
TT.enfocar(panel);
},500);
}
function reiniciar(){
window.clearInterval(planificador);window.clearTimeout(fin);fin = 0;
avisos.forEach(function(a){window.clearTimeout(a);});avisos =[];
estado = 'espera';taps =[];plan = 0;
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
cBpm.bloquear(false);
arena.removeAttribute('data-pulso');
datos.poner('p','0');textos('espera');
TT.enfocar(arena);
}
arena.addEventListener('pointerdown',function(e){if(e.pointerType === 'mouse' && e.button !== 0)return;pulsar(e);});
arena.addEventListener('keydown',function(e){if((e.key === ' ' || e.key === 'Enter')&& !e.repeat){e.preventDefault();pulsar(e);}});
document.addEventListener('keydown',function(e){
if(e.code !== 'Space' && e.key !== ' ')return;
var t = e.target;
if(t === arena)return;
if(t !== document.body && t.closest && t.closest('button, input, select, textarea, a, summary'))return;
e.preventDefault();
if(!e.repeat)pulsar(e);
});
arena.addEventListener('contextmenu',function(e){e.preventDefault();});
host.appendChild(aviso);
host.appendChild(TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Tempo'}),cBpm.nodo));
host.appendChild(datos.nodo);
host.appendChild(arena);
textos('espera');
})();
