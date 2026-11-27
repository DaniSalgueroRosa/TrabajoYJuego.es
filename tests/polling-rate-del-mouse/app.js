(function(){
'use strict';
var host = TT.app();
if(!host)return;
var TIPICAS =[125,250,500,1000,2000,4000,8000];
var dur = 5,estado = 'espera',marcas =[],t0 = 0,reloj = 0,agrupados = false,panel = null;
var cruda = 'onpointerrawupdate' in window;
var nombreEvento = cruda ? 'pointerrawupdate' : 'pointermove';
var chips = TT.chips([[3,'3 s'],[5,'5 s'],[10,'10 s']],dur,function(v){dur = v;reiniciar();},'Duración de la medida');
var datos = TT.datos([['t','Tiempo restante',TT.fmt(dur,1)+ ' s'],['n','Muestras','0'],['hz','Hz ahora','—']]);
var titulo = TT.h('span',{class: 'tt-arena-t'}),pista = TT.h('small');
var zona = TT.h('div',{class: 'tt-zona pr-zona',tabindex: '0',role: 'application','aria-label': 'Zona de medida: mueve el ratón en círculos rápidos'},titulo,pista);
function intervalos(){
var t = marcas.slice().sort(function(a,b){return a - b;}),r =[];
for(var i = 1;i < t.length;i++){var d = t[i]- t[i - 1];if(d > 0 && d < 25)r.push(d);}
return r;
}
function estimar(){
var iv = intervalos();
if(iv.length < 40)return null;
var med = TT.mediana(iv),p10 = TT.percentil(iv,0.1);
return{hz: 1000 / med,pico: 1000 / Math.max(p10,0.05),mediana: med,p10: p10,n: iv.length};
}
function cercana(hz){
var mejor = TIPICAS[0],d = 99;
TIPICAS.forEach(function(t){var x = Math.abs(Math.log(hz / t)/ Math.LN2);if(x < d){d = x;mejor = t;}});
return d <= 0.3 ? mejor : null;
}
function textos(){
titulo.textContent = estado === 'espera' ? 'Mueve el ratón en círculos rápidos aquí' : estado === 'midiendo' ? '¡Sigue moviendo!' : 'Medida terminada';
pista.textContent = estado === 'espera' ? 'La medida empieza con el primer movimiento. Cuanto más rápido y continuo, mejor.' : '';
}
function reiniciar(){
clearInterval(reloj);reloj = 0;estado = 'espera';marcas =[];agrupados = false;t0 = 0;
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;chips.bloquear(false);
datos.poner('t',TT.fmt(dur,1)+ ' s',false);datos.poner('n','0');datos.poner('hz','—');
textos();
}
function tic(){
var t =(performance.now()- t0)/ 1000;
if(t >= dur){terminar();return;}
datos.poner('t',TT.fmt(dur - t,1)+ ' s',dur - t < 2);
datos.poner('n',String(marcas.length));
var e = estimar();if(e)datos.poner('hz',Math.round(e.hz)+ '');
}
function mover(ev){
if(estado === 'fin')return;
if(estado === 'espera'){estado = 'midiendo';t0 = performance.now();chips.bloquear(true);reloj = setInterval(tic,100);textos();TT.anunciar('Empieza la medida.');}
var lista = ev.getCoalescedEvents ? ev.getCoalescedEvents():[];
if(lista.length > 1)agrupados = true;
if(!lista.length)lista =[ev];
for(var i = 0;i < lista.length;i++)marcas.push(lista[i].timeStamp);
}
function terminar(){
clearInterval(reloj);reloj = 0;estado = 'fin';textos();
var e = estimar(),detalles =[],rango,valor = '—',nota;
var metodo = cruda ? 'Eventos sin agrupar del ratón' :(agrupados ? 'Eventos agrupados por fotograma' : 'Un evento por fotograma');
if(!e){
rango ={nombre: 'Muy pocas muestras',texto: 'No se movió el ratón lo bastante deprisa o de forma continua. Repite el test moviendo el ratón en círculos rápidos durante toda la medida.'};
}else{
valor = Math.round(e.hz);
var t = cercana(e.hz),fotograma = !cruda && !agrupados;
if(fotograma)rango ={nombre: 'No se puede medir en este navegador',texto: 'Tu navegador solo entrega un evento de movimiento por fotograma, así que la cifra refleja la frecuencia de tu pantalla (' + Math.round(e.hz)+ ' Hz) y no la de tu ratón. Prueba con Chrome o Edge en un ordenador.'};
else if(t)rango ={nombre: 'Muy probablemente ' + t + ' Hz',texto: t >= 1000 ? 'Es la frecuencia habitual de los ratones para juegos: una lectura cada ' + TT.fmt(1000 / t,2).replace(/,00$/,'')+ ' ms.' : 'Es una frecuencia propia de ratones básicos o con el sondeo reducido para ahorrar energía.'};
else rango ={nombre: 'No coincide con una frecuencia típica',texto: 'Los ratones suelen trabajar a 125, 250, 500, 1000 Hz o más. Si el resultado queda entre dos valores, repite la medida moviendo el ratón más deprisa y sin parar.'};
detalles =[['Frecuencia mediana',Math.round(e.hz)+ ' Hz'],['Máximo observado',Math.round(e.pico)+ ' Hz'],['Intervalo mediano',TT.fmt(e.mediana,2)+ ' ms'],['Intervalos medidos',e.n]];
}
detalles.unshift(['Método',metodo]);
panel = TT.resultado(host,{titulo: 'Tu polling rate estimado',valor: valor,unidad: e ? 'Hz' : '',rango: rango,detalles: detalles,
copia: e ? 'Mi ratón parece trabajar a unos ' + Math.round(e.hz)+ ' Hz según este test.' : null,alRepetir: reiniciar});
TT.anunciar('Resultado: ' +(e ? Math.round(e.hz)+ ' Hz' : 'sin muestras suficientes')+ '.');
TT.enfocar(panel);
}
zona.addEventListener(nombreEvento,mover);
if(!cruda)zona.addEventListener('pointerrawupdate',mover);
host.appendChild(TT.h('div',{class: 'tt-fila'},TT.h('p',{class: 'tt-etiqueta',texto: 'Duración'}),chips.nodo));
host.appendChild(datos.nodo);
host.appendChild(zona);
textos();
})();
