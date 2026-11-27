(function(){
'use strict';
var host = TT.app();
if(!host)return;
var LADO = 320;
var CONTROL ={nombre: 'control',fig:[215,225,70,30],fon:[28,42,90,62]};
var VARIAS =[
{nombre: 'verde sobre rojizo',fig:[95,125,50,46],fon:[10,30,62,52]},
{nombre: 'naranja sobre verde',fig:[18,34,65,55],fon:[100,130,48,50]},
{nombre: 'amarillo-verde sobre rosa',fig:[70,88,55,55],fon:[350,12,55,52]},
{nombre: 'rojo sobre oliva',fig:[0,12,60,42],fon:[85,115,40,44]},
{nombre: 'verde azulado sobre marrón',fig:[140,160,40,48],fon:[20,38,50,48]},
{nombre: 'marrón sobre verde',fig:[25,38,45,40],fon:[90,110,45,44]},
{nombre: 'lima sobre naranja',fig:[60,80,60,58],fon:[28,40,70,58]}
];
var laminas =[],i = 0,respuestas =[],estado = 'espera',panel = null;
var datos = TT.datos([['l','Lámina','1/8'],['r','Respondidas','0']]);
var lienzo = TT.h('canvas',{class: 'vc-lienzo',role: 'img','aria-label': 'Lámina de puntos de colores con un número de dos cifras escondido'});
var entrada = TT.h('input',{type: 'text',inputmode: 'numeric',autocomplete: 'off',maxlength: '2',class: 'tt-campo vc-entrada',id: 'vc-numero','aria-label': 'Número que ves'});
var etiqueta = TT.h('label',{class: 'tt-etiqueta',for: 'vc-numero',texto: '¿Qué número ves?'});
var bResp = TT.boton('Responder',function(){responder(entrada.value.trim());});
var bNada = TT.boton('No veo ningún número',function(){responder('');},true);
var mensaje = TT.h('p',{class: 'vc-mensaje',role: 'status'});
var zonaJuego = TT.h('div',{class: 'vc-juego'},lienzo,etiqueta,entrada,TT.h('div',{class: 'tt-fila tt-fila--centro'},bResp,bNada));
var inicio = TT.boton('Empezar',function(){empezar();});
var zona = TT.h('div',{class: 'tt-zona vc-zona'},mensaje,inicio,zonaJuego);
function tono(p){var ancho =(p[1]- p[0]+ 360)% 360;return(p[0]+ Math.random()* ancho)% 360;}
function numeroNuevo(usados){
var n;do{n = TT.azar(2,9)* 10 + TT.azar(2,9);}while(usados.indexOf(n)>= 0);
return n;
}
function dibujar(lam,numero){
var dpr = Math.min(2,window.devicePixelRatio || 1);
lienzo.width = lienzo.height = Math.round(LADO * dpr);
var ctx = lienzo.getContext('2d');
ctx.setTransform(dpr,0,0,dpr,0,0);
ctx.clearRect(0,0,LADO,LADO);
var m = document.createElement('canvas');m.width = m.height = LADO;
var mc = m.getContext('2d');
mc.fillStyle = '#000';mc.textAlign = 'center';mc.textBaseline = 'middle';
var tam = 300;mc.font = '900 ' + tam + 'px "Arial Black", Arial, Helvetica, sans-serif';
var ancho = mc.measureText(String(numero)).width;
if(ancho > LADO * 0.84){tam = tam * LADO * 0.84 / ancho;mc.font = '900 ' + tam + 'px "Arial Black", Arial, Helvetica, sans-serif';}
mc.fillText(String(numero),LADO / 2,LADO / 2 + tam * 0.04);
var px = mc.getImageData(0,0,LADO,LADO).data;
var puntos =[],rejilla ={},C = 16,intentos = 0;
while(intentos < 70000 && puntos.length < 5200){
intentos++;
var r = intentos < 3000 ? 5 + Math.random()* 1.8 : intentos < 20000 ? 3.4 + Math.random()* 1.6 : 2.3 + Math.random()* 1.1;
var x = Math.random()* LADO,y = Math.random()* LADO;
if(Math.hypot(x - LADO / 2,y - LADO / 2)> LADO / 2 - r - 2)continue;
var cx = Math.floor(x / C),cy = Math.floor(y / C),libre = true;
for(var a = -1;a <= 1 && libre;a++)for(var b = -1;b <= 1 && libre;b++){
var lista = rejilla[(cx + a)+ ',' +(cy + b)];
if(!lista)continue;
for(var k = 0;k < lista.length;k++)if(Math.hypot(lista[k][0]- x,lista[k][1]- y)< lista[k][2]+ r + 1.2){libre = false;break;}
}
if(!libre)continue;
var d =[x,y,r];
puntos.push(d);(rejilla[cx + ',' + cy]= rejilla[cx + ',' + cy]||[]).push(d);
var dentro = px[((Math.floor(y)* LADO)+ Math.floor(x))* 4 + 3]> 128,p = dentro ? lam.fig : lam.fon;
var l = p[3]+(Math.random()* 2 - 1)*(lam === CONTROL ? 7 : 12);
ctx.fillStyle = 'hsl(' + tono(p).toFixed(0)+ ' ' + p[2]+ '% ' + l.toFixed(0)+ '%)';
ctx.beginPath();ctx.arc(x,y,r,0,Math.PI * 2);ctx.fill();
}
}
function mostrar(){
var l = laminas[i];
dibujar(l.lam,l.numero);
lienzo.setAttribute('data-numero',String(l.numero));
entrada.value = '';
datos.poner('l',(i + 1)+ '/' + laminas.length);datos.poner('r',String(respuestas.length));
mensaje.textContent = 'Lámina ' +(i + 1)+ ' de ' + laminas.length + '. Escribe el número de dos cifras que ves, o pulsa «No veo ningún número».';
entrada.focus({preventScroll: true});
}
function empezar(){
estado = 'jugando';i = 0;respuestas =[];
var usados =[];
laminas =[{lam: CONTROL,numero: numeroNuevo(usados)}];
usados.push(laminas[0].numero);
TT.barajar(VARIAS).forEach(function(lam){var n = numeroNuevo(usados);usados.push(n);laminas.push({lam: lam,numero: n});});
inicio.style.display = 'none';zonaJuego.style.display = '';
mostrar();
}
function responder(txt){
if(estado !== 'jugando')return;
if(txt !== '' && !/^\d{1,2}$/.test(txt)){mensaje.textContent = 'Escribe solo cifras (por ejemplo, 47) o pulsa «No veo ningún número».';entrada.focus();return;}
respuestas.push(txt === '' ? null : parseInt(txt,10));
i++;
if(i >= laminas.length){terminar();return;}
mostrar();
}
entrada.addEventListener('keydown',function(e){if(e.key === 'Enter'){e.preventDefault();responder(entrada.value.trim());}});
function terminar(){
estado = 'fin';zonaJuego.style.display = 'none';mensaje.textContent = 'Terminado.';
datos.poner('l',laminas.length + '/' + laminas.length);datos.poner('r',String(respuestas.length));
var ok = 0,detalles =[];
laminas.forEach(function(l,k){
var r = respuestas[k],bien = r === l.numero;
if(bien)ok++;
detalles.push(['Lámina ' +(k + 1)+(k === 0 ? ' (de control)' : ''),bien ? 'acertada: ' + l.numero :(r == null ? 'en blanco' : 'respondiste ' + r)+ ', era ' + l.numero]);
});
var controlOk = respuestas[0]=== laminas[0].numero;
var rango = TT.rango(ok,[
[0,'Pocas acertadas','Si has fallado también la de control, revisa el brillo de la pantalla y la luz de la sala antes de sacar conclusiones.'],
[4,'Varias fallidas','Con estas láminas generadas al azar, fallar varias no demuestra nada. Si te preocupa cómo ves los colores, consulta a un profesional de la visión.'],
[6,'Casi todas','Has leído la mayoría de las láminas.'],
[8,'Lectura completa','Has leído todas las láminas.']]);
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tus láminas',valor: ok + ' de ' + laminas.length,unidad: 'láminas leídas',rango: rango,
extra: TT.h('p',{class: 'tt-aviso',texto:(controlOk ? 'Esto es un pasatiempo y no un diagnóstico: no sustituye una prueba con láminas oficiales hecha por un profesional.' : 'Has fallado la lámina de control, que se lee con cualquier visión de los colores: puede ser cosa de la pantalla, del brillo o de la luz. Esto es un pasatiempo, no un diagnóstico.')}),
detalles: detalles,copia: 'He leído ' + ok + ' de ' + laminas.length + ' láminas en el test de visión del color.',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + ok + ' láminas leídas de ' + laminas.length + '.');
TT.enfocar(panel);
},300);
}
function reiniciar(){
estado = 'espera';
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
datos.poner('l','1/8');datos.poner('r','0');
zonaJuego.style.display = 'none';inicio.style.display = '';
mensaje.textContent = 'Verás ocho láminas de puntos de colores. En cada una hay un número de dos cifras escondido. Escríbelo o indica que no ves ninguno.';
}
host.appendChild(TT.h('p',{class: 'tt-aviso',texto: 'Pasatiempo, no diagnóstico. Usa la pantalla con brillo normal y sin filtros de color; los tonos cambian con el brillo, la luz y la pantalla.'}));
host.appendChild(datos.nodo);
host.appendChild(zona);
reiniciar();
})();
