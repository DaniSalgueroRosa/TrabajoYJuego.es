(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('ao');
if(!raiz)return;
var ONCES_POR_PARTIDA = 3,SEGUNDOS = 120,NIVELES =[[0,'Suplente'],[100,'Titular'],[200,'Capitán'],[300,'Seleccionador'],[400,'Míster de leyenda']];
var banco =[],mazo =[],sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '}),temporizador = null,partida = null;
var NOMBRES_FILA ={3:['Portero','Defensas','Delanteros'],4:['Portero','Defensas','Centrocampistas','Delanteros'],5:['Portero','Defensas','Pivotes o mediocentros','Mediapuntas o interiores','Delantero']};
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function parar(){if(temporizador)temporizador.parar();}
function inicio(){
parar();TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Adivina el once'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'Te enseño el campo de una final famosa con los once titulares tapados. Escribe los apellidos: cada acierto destapa a un jugador en su sitio. Son tres onces por partida y dos minutos para cada uno.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',id: 'ao-empezar',onclick: empezar},'Empezar')));
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function empezar(){
var elegidos =[];
while(elegidos.length < ONCES_POR_PARTIDA){var o = robar();if(elegidos.indexOf(o)< 0)elegidos.push(o);}
partida ={onces: elegidos,i: 0,total: 0,resumen:[]};
ronda();
}
function posiciones(filas){
var res =[],n = filas.length;
filas.forEach(function(fila,i){
fila.forEach(function(jug,k){res.push({jug: jug,fila: i,x:(k + 1)/(fila.length + 1)* 100,y: 88 - i *(74 /(n - 1))});});
});
return res;
}
function ronda(){
var once = partida.onces[partida.i],slots = posiciones(once.filas),hallados = 0,pistas = 0,cerrada = false;
parar();TYJ.vaciar(raiz);
var hud = TYJ.hud([['n','Once',(partida.i + 1)+ ' / ' + ONCES_POR_PARTIDA],['ok','Descubiertos','0 / 11'],['pts','Puntos',U.miles(partida.total)],['t','Tiempo',U.tiempo(SEGUNDOS)]]);
var barra = TYJ.barraDeTiempo();
var campo = h('div',{class: 'ao-campo',role: 'group','aria-label': 'Alineación: ' + once.f},h('div',{class: 'ao-area ao-area--arriba'}),h('div',{class: 'ao-area ao-area--abajo'}),h('div',{class: 'ao-centro'}));
slots.forEach(function(s){
s.nodo = h('div',{class: 'ao-ficha','aria-label': NOMBRES_FILA[once.filas.length][s.fila]+ ': sin descubrir'},h('span',{class: 'ao-camiseta','aria-hidden': 'true',texto: '?'}),h('span',{class: 'ao-nombre'}));
s.nodo.style.left = s.x.toFixed(1)+ '%';s.nodo.style.top = s.y.toFixed(1)+ '%';
campo.appendChild(s.nodo);
});
var entrada = h('input',{id: 'ao-respuesta',type: 'text',autocomplete: 'off',autocapitalize: 'words',spellcheck: 'false',maxlength: '40',placeholder: 'Escribe un apellido'});
var enviar = h('button',{class: 'boton-retro',type: 'submit'},'Probar');
var pista = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button'},'Pista (−3 puntos)');
var rendirse = h('button',{class: 'boton-retro boton-retro--sec boton-retro--chico',type: 'button'},'Rendirme');
var msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
var form = h('form',{class: 'ao-form',novalidate: true},h('div',{class: 'fila'},h('div',{class: 'campo-retro'},h('label',{for: 'ao-respuesta',texto: 'Jugador'}),entrada),enviar));
var zona = h('div');
[hud.nodo,barra.nodo,h('p',{class: 'texto',texto: once.t + ': ' + once.e + ' (sistema ' + once.f + '). Escribe a los once titulares.'}),campo,form,h('div',{class: 'fila'},pista,rendirse),msg,zona].forEach(function(n){raiz.appendChild(n);});
entrada.focus();
function puntos(todos,restante){return Math.max(0,hallados * 10 +(todos ? 20 + Math.floor(restante / 3): 0)- pistas * 3);}
function actualizar(){hud.poner('ok',hallados + ' / 11');hud.poner('pts',U.miles(partida.total + puntos(false,0)));}
function descubrir(s,fallo){
s.hecho = true;
s.nodo.classList.add(fallo ? 'ao-ficha--falta' : 'ao-ficha--ok');
s.nodo.firstChild.textContent = fallo ? '·' : '✓';
s.nodo.lastChild.textContent = s.jug.n;
s.nodo.setAttribute('aria-label',NOMBRES_FILA[once.filas.length][s.fila]+ ': ' + s.jug.n +(fallo ? ' (no acertado)' : ''));
}
function cerrar(motivo){
if(cerrada)return;cerrada = true;
var restante = temporizador.parar(),todos = hallados === 11,pts = puntos(todos,restante);
slots.forEach(function(s){if(!s.hecho)descubrir(s,true);});
entrada.disabled = enviar.disabled = pista.disabled = rendirse.disabled = true;
partida.total += pts;partida.resumen.push({t: once.t,e: once.e,hallados: hallados,pts: pts});
hud.poner('pts',U.miles(partida.total));
var ultima = partida.i === ONCES_POR_PARTIDA - 1;
var titulo = todos ? '¡Once completo!' :(motivo === 'tiempo' ? 'Se acabó el tiempo' : 'Once revelado');
var sig = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(ultima)final();else{partida.i++;ronda();}}},ultima ? 'Ver resultado' : 'Siguiente once');
TYJ.vaciar(zona).appendChild(h('div',{class: 'ao-resultado'},h('p',{class: 'ao-puntos',texto: '+' + pts + ' puntos'}),
h('p',{texto: titulo + ' Descubriste ' + hallados + ' de 11. Resultado de la final: ' + once.e + ' ' + once.res + ' (rival: ' + once.v + ').'}),h('div',{class: 'fila'},sig)));
TYJ.anunciar(titulo + ' ' + hallados + ' de 11. ' + pts + ' puntos.');
msg.textContent = '';
sig.focus();
}
temporizador = new TYJ.Temporizador({
segundos: SEGUNDOS,
alTick: function(r){barra.poner(r / SEGUNDOS);hud.poner('t',U.tiempo(r),r <= 20);},
alFin: function(){cerrar('tiempo');}
});
temporizador.iniciar();
form.addEventListener('submit',function(e){
e.preventDefault();if(cerrada)return;
var t = entrada.value.trim();if(!t){entrada.focus();return;}
var pendiente = slots.filter(function(s){return !s.hecho && U.coincide(t,s.jug.r);})[0];
entrada.value = '';
if(pendiente){
hallados++;descubrir(pendiente,false);actualizar();
msg.textContent = '¡Sí! ' + pendiente.jug.n + '.';msg.className = 'mensaje mensaje--ok';
TYJ.anunciar(pendiente.jug.n + ': acierto. ' + hallados + ' de 11.');
if(hallados === 11)cerrar('completo');
}else{
var ya = slots.some(function(s){return s.hecho && !s.nodo.classList.contains('ao-ficha--falta')&& U.coincide(t,s.jug.r);});
msg.textContent = ya ? 'A ese ya lo habías descubierto.' : '«' + t + '» no está en este once.';msg.className = 'mensaje mensaje--mal';
}
entrada.focus();
});
pista.addEventListener('click',function(){
var libres = slots.filter(function(s){return !s.hecho && !s.pista;});
if(!libres.length || cerrada)return;
var s = U.elegir(libres),nombre = s.jug.n;s.pista = true;pistas++;
s.nodo.classList.add('ao-ficha--pista');s.nodo.firstChild.textContent = nombre.charAt(0).toUpperCase();s.nodo.lastChild.textContent = nombre.length + ' letras';
msg.textContent = 'Pista: ' + NOMBRES_FILA[once.filas.length][s.fila].toLowerCase()+ ', empieza por ' + nombre.charAt(0).toUpperCase()+ ' y tiene ' + nombre.length + ' letras (contando espacios).';msg.className = 'mensaje';
TYJ.anunciar(msg.textContent);actualizar();entrada.focus();
});
rendirse.addEventListener('click',function(){cerrar('rendido');});
}
function final(){
parar();
var total = partida.total,nivel = U.nivel(total,NIVELES);
sesion.registrar(total);
var tabla = h('table',{class: 'ao-tabla'},h('thead',{},h('tr',{},h('th',{scope: 'col',texto: 'Partido'}),h('th',{scope: 'col',texto: 'Descubiertos'}),h('th',{scope: 'col',texto: 'Puntos'}))),
h('tbody',{},partida.resumen.map(function(r){return h('tr',{},h('td',{texto: r.t + ' · ' + r.e}),h('td',{texto: r.hallados + ' / 11'}),h('td',{texto: String(r.pts)}));})));
var cont = h('div');TYJ.vaciar(raiz).appendChild(cont);
TYJ.final(cont,{titulo: 'Nivel: ' + nivel,puntos: total,nivel: null,detalles:['Once por once: ' + partida.resumen.map(function(r){return r.hallados + '/11';}).join(' · ')],
textoRepetir: 'Jugar otra vez',alRepetir: empezar,compartir: 'Adivina el once · ' + U.miles(total)+ ' puntos · ' + partida.resumen.map(function(r){return r.hallados + '/11';}).join(' ')+ ' · ' + nivel});
cont.lastChild.appendChild(tabla);
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function arrancar(){
TYJ.datos('adivina-el-once/onces.json').then(function(json){banco = json.onces;inicio();}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
