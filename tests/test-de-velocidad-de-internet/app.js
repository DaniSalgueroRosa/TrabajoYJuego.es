(function(){
'use strict';
var host = TT.app();
if(!host)return;
var ARCHIVO = 'prueba.bin',HILOS = 4,TOPE = 120 * 1048576,PINGS = 8;
var duracion = 8,corriendo = false,ac = null,panel = null,cancelado = false;
var datos = TT.datos([['p','Latencia','—'],['v','Descarga ahora','0 Mbps'],['t','Tiempo','0,0 s'],['m','Datos usados','0,0 MB']]);
var mensaje = TT.h('p',{'class': 'vi-mensaje',role: 'status'});
var chips = TT.chips([[5,'5 segundos'],[8,'8 segundos'],[12,'12 segundos']],8,function(v){duracion = v;},'Duración de la prueba');
var empezar = TT.boton('Empezar la prueba',function(){iniciar();});
var parar = TT.boton('Cancelar',function(){cancelado = true;if(ac)ac.abort();},true);
parar.hidden = true;
var zona = TT.h('div',{'class': 'tt-zona vi-zona'},mensaje,TT.h('div',{'class': 'tt-fila tt-fila--centro'},empezar,parar),TT.h('div',{'class': 'vi-duracion'},TT.h('span',{'class': 'tt-etiqueta',texto: 'Duración'}),chips.nodo));
function url(extra){return ARCHIVO + '?r=' + Date.now().toString(36)+ Math.random().toString(36).slice(2,8)+(extra || '');}
function mb(b){return TT.fmt(b / 1048576,1)+ ' MB';}
function mbps(bytes,seg){return seg > 0 ? bytes * 8 / 1e6 / seg : 0;}
function tiempoDe(seg){
if(!isFinite(seg))return '—';
if(seg < 60)return TT.fmt(seg,0)+ ' s';
var m = Math.floor(seg / 60),s = Math.round(seg - m * 60);
return m < 60 ? m + ' min ' + s + ' s' : Math.floor(m / 60)+ ' h ' +(m % 60)+ ' min';
}
function medirLatencia(){
var tiempos =[],i = 0;
return new Promise(function(resolver,rechazar){
(function siguiente(){
if(cancelado){rechazar(new Error('cancelado'));return;}
if(i >= PINGS){resolver(tiempos.slice(1));return;}
var t0 = performance.now();
fetch(url(),{method: 'HEAD',cache: 'no-store',signal: ac.signal}).then(function(r){
if(!r.ok)throw new Error('http ' + r.status);
tiempos.push(performance.now()- t0);i++;siguiente();
}).catch(rechazar);
})();
});
}
function descargar(seg){
return new Promise(function(resolver,rechazar){
var bytes = 0,t0 = performance.now(),muestras =[[0,0]],fin = false,reloj,n = 0,huboDatos = false;
function cerrar(error){
if(fin)return;fin = true;window.clearInterval(reloj);
try{ac.abort();}catch(e){}
var ahora =(performance.now()- t0)/ 1000;
if(ahora > muestras[muestras.length - 1][0])muestras.push([ahora,bytes]);
if(error &&(cancelado || !huboDatos))rechazar(error);
else resolver({bytes: bytes,muestras: muestras,seg: ahora});
}
reloj = window.setInterval(function(){
var t =(performance.now()- t0)/ 1000,ult = muestras[muestras.length - 1];
muestras.push([t,bytes]);
datos.poner('t',TT.fmt(t,1)+ ' s');datos.poner('m',mb(bytes));
datos.poner('v',TT.fmt(mbps(bytes - ult[1],t - ult[0]),1)+ ' Mbps');
if(cancelado)cerrar(new Error('cancelado'));
else if(t >= seg || bytes >= TOPE)cerrar(null);
},250);
function hilo(){
if(fin)return;
fetch(url('&n=' +(++n)),{cache: 'no-store',signal: ac.signal}).then(function(r){
if(!r.ok)throw new Error('http ' + r.status);
if(!r.body || !r.body.getReader)return r.arrayBuffer().then(function(b){huboDatos = true;bytes += b.byteLength;if(bytes >= TOPE)cerrar(null);});
var lector = r.body.getReader();
return(function leer(){
return lector.read().then(function(x){if(x.done || fin)return;huboDatos = true;bytes += x.value.length;if(bytes >= TOPE){cerrar(null);return;}return leer();});
})();
}).then(hilo,function(e){if(!fin)cerrar(e);});
}
for(var k = 0;k < HILOS;k++)hilo();
});
}
function iniciar(){
if(corriendo)return;
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;corriendo = true;cancelado = false;ac = new AbortController();
empezar.disabled = true;parar.hidden = false;chips.bloquear(true);
datos.poner('p','—');datos.poner('v','0 Mbps');datos.poner('t','0,0 s');datos.poner('m','0,0 MB');
mensaje.textContent = 'Midiendo la latencia…';
var latencia = null;
medirLatencia().then(function(t){
latencia ={ms: TT.mediana(t),jitter: TT.media(TT.intervalos(t).map(Math.abs))};
datos.poner('p',TT.fmt(latencia.ms,0)+ ' ms');
mensaje.textContent = 'Descargando durante ' + duracion + ' segundos…';
return descargar(duracion);
}).then(function(d){terminar(latencia,d);},function(e){fallo(e);});
}
function reponer(){corriendo = false;empezar.disabled = false;parar.hidden = true;chips.bloquear(false);}
function fallo(e){
reponer();
mensaje.textContent = cancelado ? 'Prueba cancelada. Puedes volver a empezar cuando quieras.'
: 'No se ha podido descargar el archivo de prueba. Abre la página desde el sitio web (no desde un archivo suelto del ordenador) y comprueba que tienes conexión.';
}
function terminar(lat,d){
reponer();
var desde = d.seg > 2.5 ? d.seg * 0.3 : 0,m0 = d.muestras[0];
d.muestras.forEach(function(m){if(m[0]<= desde)m0 = m;});
var ultima = d.muestras[d.muestras.length - 1],velocidad = mbps(ultima[1]- m0[1],ultima[0]- m0[0]);
var serie =[],picos =[];
for(var k = 1;k < d.muestras.length;k++){var v = mbps(d.muestras[k][1]- d.muestras[k - 1][1],d.muestras[k][0]- d.muestras[k - 1][0]);serie.push([d.muestras[k][0],v]);picos.push(v);}
var pico = Math.max.apply(null,picos.concat([0]));
mensaje.textContent = 'Listo. Este resultado es la velocidad de descarga hasta este sitio.';
var rango = TT.rango(velocidad,[
[0,'Muy lenta','Basta para mensajes y páginas sencillas, pero el vídeo irá a saltos.'],
[3,'Justa','Páginas, música y vídeo en calidad básica.'],
[10,'Correcta','Vídeo en alta definición y videollamadas sin cortes.'],
[30,'Rápida','Vídeo 4K, varias pantallas a la vez y descargas cómodas.'],
[100,'Muy rápida','Descargas grandes en poco tiempo y varios dispositivos sin esperas.'],
[400,'De sobra','Tu conexión va muy por encima de lo que casi cualquier uso necesita.']]);
var con = navigator.connection,detalles =[
['Velocidad de descarga',TT.fmt(velocidad,1)+ ' Mbps (' + TT.fmt(velocidad / 8,1)+ ' MB/s)'],
['Pico durante la prueba',TT.fmt(pico,1)+ ' Mbps'],
['Latencia (mediana)',TT.fmt(lat.ms,0)+ ' ms'],
['Variación de la latencia',TT.fmt(lat.jitter,0)+ ' ms'],
['Tiempo para bajar 1 GB',tiempoDe(velocidad > 0 ? 8000 / velocidad : Infinity)],
['Datos usados en la prueba',mb(ultima[1])],
['Duración',TT.fmt(d.seg,d.seg < 10 ? 1 : 0)+ ' s']];
if(con &&(con.effectiveType || con.downlink))detalles.push(['Estimación de tu navegador',[con.effectiveType,con.downlink ? TT.fmt(con.downlink,1)+ ' Mbps' : null,con.rtt ? con.rtt + ' ms' : null].filter(Boolean).join(' · ')]);
var extra = TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Velocidad durante la prueba'}),TT.graf.linea(serie,{descripcion: 'Velocidad de descarga en Mbps a lo largo de la prueba',xUnidad: 's',yTitulo: 'Mbps',formatoY: function(x){return TT.fmt(x,x < 10 ? 1 : 0);}})),
TT.h('div',{},TT.h('h3',{texto: 'Qué se suele necesitar (cifras orientativas)'}),TT.graf.barras([
{nombre: 'Videollamada',valor: 3,nota: 'unos 3 Mbps'},{nombre: 'Vídeo en alta definición',valor: 5,nota: 'unos 5 Mbps'},{nombre: 'Vídeo 4K',valor: 25,nota: 'de 15 a 25 Mbps'},{nombre: 'Tu descarga',valor: velocidad,nota: 'medida ahora'}],
{max: Math.max(30,Math.min(velocidad,60)),unidad: ' Mbps',decimales: 0,destacar: 3,descripcion: 'Comparación de tu velocidad con la que piden varios usos'})),
TT.h('p',{'class': 'tt-aviso',texto: 'Mide la descarga entre tu dispositivo y este sitio web. No mide la subida y puede salir distinta de la que contratas: depende del alojamiento, de la hora, del Wi-Fi y de lo que usen otros aparatos.'}));
panel = TT.resultado(host,{titulo: 'Tu velocidad de descarga',valor: TT.fmt(velocidad,velocidad < 10 ? 1 : 0),unidad: 'Mbps',rango: rango,extra: extra,detalles: detalles,
copia: 'Mi velocidad de descarga: ' + TT.fmt(velocidad,1)+ ' Mbps con ' + TT.fmt(lat.ms,0)+ ' ms de latencia.',alRepetir: iniciar});
TT.anunciar('Resultado: ' + TT.fmt(velocidad,1)+ ' megabits por segundo de descarga.');
TT.enfocar(panel);
}
host.appendChild(TT.h('p',{'class': 'tt-aviso',texto: 'La prueba descarga datos de este mismo sitio durante unos segundos (como máximo unos 120 MB). Si usas datos del móvil, mejor hazla con Wi-Fi.'}));
host.appendChild(datos.nodo);
host.appendChild(zona);
mensaje.textContent = 'Pulsa «Empezar la prueba». Primero se mide la latencia y después la velocidad de descarga.';
})();
