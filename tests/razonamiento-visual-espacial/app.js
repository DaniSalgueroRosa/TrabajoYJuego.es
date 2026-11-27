(function(){
'use strict';
var host = TT.app();
if(!host)return;
var TAMANOS =[5,5,6,6,6,7,7,7,8,8],CELDA = 20;
var k = 0,aciertos = 0,t0 = 0,tq = 0,registro =[],estado = 'espera',panel = null,reloj = 0,actual = null;
var datos = TT.datos([['q','Pregunta','1/10'],['a','Aciertos','0'],['s','Tiempo','0,0 s']]);
var mensaje = TT.h('p',{class: 'rv-mensaje',role: 'status'});
var figura = TT.h('div',{class: 'rv-figura',role: 'img','aria-label': 'Figura de referencia formada por cuadrados'});
var opciones = TT.h('div',{class: 'rv-opciones',role: 'group','aria-label': 'Opciones: elige la figura girada'});
var juego = TT.h('div',{class: 'rv-juego'},TT.h('p',{class: 'tt-etiqueta',texto: 'Figura de referencia'}),figura,TT.h('p',{class: 'tt-etiqueta',texto: '¿Cuál es la misma figura, girada?'}),opciones);
var inicio = TT.boton('Empezar',function(){empezar();});
var zona = TT.h('div',{class: 'tt-zona rv-zona'},mensaje,inicio,juego);
function rot(c){return c.map(function(p){return[-p[1],p[0]];});}
function esp(c){return c.map(function(p){return[-p[0],p[1]];});}
function minimos(c){return[Math.min.apply(null,c.map(function(p){return p[0];})),Math.min.apply(null,c.map(function(p){return p[1];}))];}
function norm(c){var m = minimos(c);return c.map(function(p){return[p[0]- m[0],p[1]- m[1]];});}
function clave(c){return norm(c).map(function(p){return p[0]+ ',' + p[1];}).sort().join(';');}
function canon(c){var m = null,r = c;for(var i = 0;i < 4;i++){var s = clave(r);if(m === null || s < m)m = s;r = rot(r);}return m;}
function girar(c,veces){var r = c;for(var i = 0;i < veces;i++)r = rot(r);return r;}
function dims(c){var n = norm(c);return[Math.max.apply(null,n.map(function(p){return p[0];}))+ 1,Math.max.apply(null,n.map(function(p){return p[1];}))+ 1];}
function tiene(c,x,y){return c.some(function(p){return p[0]=== x && p[1]=== y;});}
var DIR =[[1,0],[-1,0],[0,1],[0,-1]];
function crecer(n){
var c =[[0,0]];
while(c.length < n){
var b = TT.elegir(c),d = TT.elegir(DIR),x = b[0]+ d[0],y = b[1]+ d[1];
if(!tiene(c,x,y))c.push([x,y]);
}
return c;
}
function conexa(c){
var vistos =[c[0]],cola =[c[0]];
while(cola.length){var p = cola.pop();DIR.forEach(function(d){var x = p[0]+ d[0],y = p[1]+ d[1];if(tiene(c,x,y)&& !tiene(vistos,x,y)){vistos.push([x,y]);cola.push([x,y]);}});}
return vistos.length === c.length;
}
function modificar(c){
for(var i = 0;i < 60;i++){
var j = TT.azar(0,c.length - 1),resto = c.filter(function(_,q){return q !== j;});
if(!conexa(resto))continue;
var base = TT.elegir(resto),d = TT.elegir(DIR),x = base[0]+ d[0],y = base[1]+ d[1];
if(tiene(resto,x,y)||(x === c[j][0]&& y === c[j][1]))continue;
var nuevo = resto.concat([[x,y]]);
if(conexa(nuevo))return nuevo;
}
return null;
}
function pregunta(n){
for(var intento = 0;intento < 300;intento++){
var f = crecer(n),d = dims(f),maximo = n >= 7 ? 5 : 4;
if(d[0]> maximo || d[1]> maximo || d[0]< 2 || d[1]< 2)continue;
var c0 = canon(f);
if(c0 === canon(esp(f)))continue;
var mod = modificar(f);
if(!mod || canon(mod)=== c0 || canon(mod)=== canon(esp(f)))continue;
var r1 = TT.azar(1,3),r2 = TT.azar(0,3);
while(r2 === r1)r2 = TT.azar(0,3);
var correcta = girar(f,TT.azar(1,3)),espejo = esp(f);
var lista =[{c: correcta,ok: true},{c: girar(espejo,r1),ok: false},{c: girar(espejo,r2),ok: false},{c: girar(mod,TT.azar(0,3)),ok: false}];
return{fig: f,opciones: TT.barajar(lista)};
}
return null;
}
function svg(c,clase){
var n = norm(c),d = dims(c),pad = 6,w = d[0]* CELDA + pad * 2,h = d[1]* CELDA + pad * 2;
var ns = 'http://www.w3.org/2000/svg',s = document.createElementNS(ns,'svg');
s.setAttribute('viewBox','0 0 ' + w + ' ' + h);s.setAttribute('class',clase);s.setAttribute('aria-hidden','true');
s.style.width =(w * 1.6)+ 'px';s.style.maxWidth = '100%';
n.forEach(function(p){var r = document.createElementNS(ns,'rect');r.setAttribute('x',pad + p[0]* CELDA);r.setAttribute('y',pad + p[1]* CELDA);r.setAttribute('width',CELDA - 1.5);r.setAttribute('height',CELDA - 1.5);r.setAttribute('rx',3);s.appendChild(r);});
return s;
}
function mostrar(){
actual = pregunta(TAMANOS[k])|| pregunta(TAMANOS[k])|| pregunta(5);
TT.vaciar(figura);TT.vaciar(opciones);
figura.appendChild(svg(actual.fig,'rv-svg rv-svg--ref'));
actual.opciones.forEach(function(o,i){
var b = TT.h('button',{type: 'button',class: 'rv-opcion','aria-label': 'Opción ' + 'ABCD'.charAt(i)},svg(o.c,'rv-svg'),TT.h('span',{class: 'rv-letra','aria-hidden': 'true',texto: 'ABCD'.charAt(i)}));
if(o.ok)b.setAttribute('data-correcta','1');
b.addEventListener('click',function(){responder(o.ok);});
opciones.appendChild(b);
});
datos.poner('q',(k + 1)+ '/' + TAMANOS.length);datos.poner('a',String(aciertos));
mensaje.textContent = 'Pregunta ' +(k + 1)+ ' de ' + TAMANOS.length + ': ¿cuál es la figura de referencia, girada? Cuidado con las reflejadas.';
tq = performance.now();
}
function empezar(){
estado = 'juego';k = 0;aciertos = 0;registro =[];t0 = performance.now();
inicio.style.display = 'none';juego.style.display = '';
reloj = window.setInterval(function(){datos.poner('s',TT.fmt((performance.now()- t0)/ 1000,1)+ ' s');},200);
mostrar();
}
function responder(bien){
if(estado !== 'juego')return;
registro.push({bien: bien,t:(performance.now()- tq)/ 1000,n: TAMANOS[k]});
if(bien)aciertos++;
k++;
if(k >= TAMANOS.length){terminar();return;}
mostrar();
}
function terminar(){
window.clearInterval(reloj);estado = 'fin';juego.style.display = 'none';mensaje.textContent = 'Terminado.';
datos.poner('a',String(aciertos));
var seg =(performance.now()- t0)/ 1000;
var rango = TT.rango(aciertos,[
[0,'A calentar','La rotación mental mejora con la práctica: gira la figura con la imaginación, de una pieza.'],
[4,'Orientación básica','Aciertas con las figuras más sencillas.'],
[6,'Buena orientación','Resuelves la mayoría de las preguntas.'],
[8,'Muy buena orientación','Giras las figuras con soltura.'],
[10,'Rotación perfecta','Todas correctas.']]);
var detalles = registro.map(function(r,i){return['Pregunta ' +(i + 1)+ ' (' + r.n + ' cuadrados)',(r.bien ? 'correcta' : 'fallada')+ ' en ' + TT.fmt(r.t,1)+ ' s'];});
detalles.push(['Tiempo medio por pregunta',TT.fmt(seg / registro.length,1)+ ' s'],['Tiempo total',TT.fmt(seg,0)+ ' s']);
window.setTimeout(function(){
if(estado !== 'fin')return;
panel = TT.resultado(host,{titulo: 'Tu razonamiento visual-espacial',valor: aciertos + ' de ' + TAMANOS.length,unidad: 'correctas',rango: rango,detalles: detalles,
copia: 'He acertado ' + aciertos + ' de ' + TAMANOS.length + ' en el test de razonamiento visual-espacial.',alRepetir: reiniciar});
TT.anunciar('Resultado: ' + aciertos + ' respuestas correctas de ' + TAMANOS.length + '.');
TT.enfocar(panel);
},400);
}
function reiniciar(){
window.clearInterval(reloj);estado = 'espera';
if(panel && panel.parentNode)panel.parentNode.removeChild(panel);
panel = null;
datos.poner('q','1/' + TAMANOS.length);datos.poner('a','0');datos.poner('s','0,0 s');
juego.style.display = 'none';inicio.style.display = '';
mensaje.textContent = 'Verás una figura hecha de cuadrados y cuatro opciones. Una es la misma figura girada; las demás están reflejadas o tienen un cuadrado cambiado de sitio. Son diez preguntas y las figuras se van complicando.';
}
host.appendChild(datos.nodo);
host.appendChild(zona);
reiniciar();
})();
