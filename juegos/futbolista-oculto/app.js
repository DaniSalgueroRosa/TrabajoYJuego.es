(function(){
'use strict';
var TYJ = window.TYJ,U = TYJ.util,h = TYJ.h;
var raiz = document.getElementById('fo');
if(!raiz)return;
var RONDAS = 3,INTENTOS = 8,NIVELES =[[0,'Aficionado'],[100,'Ojeador'],[170,'Secretario técnico'],[230,'Director deportivo'],[270,'Sabueso del fútbol']];
var banco =[],mazo =[],sesion = TYJ.Sesion(null,{etiquetaMejor: 'Mejor puntuación: '}),partida = null;
function robar(){if(!mazo.length)mazo = U.barajar(banco);return mazo.pop();}
function buscar(texto){
var t = U.clave(texto),exacto = banco.filter(function(j){return U.clave(j.n)=== t || j.r.some(function(a){return U.clave(a)=== t;});})[0];
if(exacto)return exacto;
return banco.filter(function(j){return U.coincide(texto,[j.n].concat(j.r));})[0]|| null;
}
function sino(v){return v ? 'Sí' : 'No';}
function celda(clase,texto,etiqueta){return h('td',{class: 'fo-celda fo-celda--' + clase,'data-etiqueta': etiqueta,texto: texto});}
function comparar(g,s){
var dif = s.y - g.y,cerca = Math.abs(dif)<= 5;
return[
celda(g.p === s.p ? 'ok' : 'no',(g.p === s.p ? '✓ ' : '✗ ')+ g.p,'País'),
celda(g.pos === s.pos ? 'ok' : 'no',(g.pos === s.pos ? '✓ ' : '✗ ')+ g.pos,'Posición'),
celda(dif === 0 ? 'ok' :(cerca ? 'cerca' : 'no'),(dif === 0 ? '✓ ' :(dif > 0 ? '▲ ' : '▼ '))+ g.y,'Nació'),
celda(g.m === s.m ? 'ok' : 'no',(g.m === s.m ? '✓ ' : '✗ ')+ sino(g.m),'Campeón del mundo'),
celda(g.c === s.c ? 'ok' : 'no',(g.c === s.c ? '✓ ' : '✗ ')+ sino(g.c),'Campeón de Europa'),
celda(g.b === s.b ? 'ok' : 'no',(g.b === s.b ? '✓ ' : '✗ ')+ sino(g.b),'Balón de Oro')
];
}
function inicio(){
TYJ.vaciar(raiz);
raiz.appendChild(h('h2',{texto: 'Futbolista oculto'}));
raiz.appendChild(h('p',{class: 'texto',texto: 'He pensado en un futbolista. Tienes ocho intentos para averiguar quién es: cada intento te dice si coincide en país, posición, año de nacimiento, Mundial, Champions y Balón de Oro. Son tres rondas.'}));
raiz.appendChild(h('div',{class: 'fila'},h('button',{class: 'boton-retro',type: 'button',id: 'fo-empezar',onclick: empezar},'Empezar')));
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function empezar(){partida ={i: 0,total: 0,resumen:[]};ronda();}
function ronda(){
var secreto = robar(),intentos =[],cerrada = false;
TYJ.vaciar(raiz);
var hud = TYJ.hud([['r','Ronda',(partida.i + 1)+ ' / ' + RONDAS],['i','Intentos','0 / ' + INTENTOS],['pts','Puntos',U.miles(partida.total)]]);
var lista = h('datalist',{id: 'fo-lista'},U.barajar(banco).map(function(j){return h('option',{value: j.n});}));
var entrada = h('input',{id: 'fo-respuesta',type: 'text',autocomplete: 'off',spellcheck: 'false',maxlength: '40',list: 'fo-lista',placeholder: 'Escribe un futbolista'});
var enviar = h('button',{class: 'boton-retro',type: 'submit'},'Probar');
var msg = h('p',{class: 'mensaje',role: 'status','aria-live': 'polite'});
var form = h('form',{class: 'fo-form',novalidate: true},h('div',{class: 'fila'},h('div',{class: 'campo-retro'},h('label',{for: 'fo-respuesta',texto: 'Futbolista'}),entrada),enviar),lista);
var cuerpo = h('tbody');
var tabla = h('table',{class: 'fo-tabla'},h('caption',{class: 'fo-leyenda',texto: '✓ coincide · ✗ no coincide · ▲ nació después · ▼ nació antes · en amarillo, a menos de 5 años'}),
h('thead',{},h('tr',{},['Futbolista','País','Posición','Nació','Campeón del mundo','Campeón de Europa','Balón de Oro'].map(function(t){return h('th',{scope: 'col',texto: t});}))),cuerpo);
var region = h('div',{class: 'fo-region',role: 'region','aria-label': 'Intentos hasta ahora',tabindex: '0'},tabla);
var zona = h('div');
[hud.nodo,form,msg,region,zona].forEach(function(n){raiz.appendChild(n);});
entrada.focus();
function cerrar(gana){
cerrada = true;entrada.disabled = enviar.disabled = true;
var pts = gana ? 100 - 12 *(intentos.length - 1): 0;
partida.total += pts;partida.resumen.push({n: secreto.n,gana: gana,intentos: intentos.length,pts: pts});
hud.poner('pts',U.miles(partida.total));
var ultima = partida.i === RONDAS - 1;
var sig = h('button',{class: 'boton-retro',type: 'button',onclick: function(){if(ultima)final();else{partida.i++;ronda();}}},ultima ? 'Ver resultado' : 'Siguiente futbolista');
var titulo = gana ? '¡Es ' + secreto.n + '! Lo has encontrado en ' + intentos.length +(intentos.length === 1 ? ' intento' : ' intentos')+ '.' : 'Era ' + secreto.n + '. Te has quedado sin intentos.';
TYJ.vaciar(zona).appendChild(h('div',{class: 'fo-resultado'},h('p',{class: 'fo-puntos',texto: '+' + pts + ' puntos'}),h('p',{texto: titulo}),h('div',{class: 'fila'},sig)));
TYJ.anunciar(titulo + ' ' + pts + ' puntos.');
sig.focus();
}
form.addEventListener('submit',function(e){
e.preventDefault();if(cerrada)return;
var t = entrada.value.trim();if(!t){entrada.focus();return;}
var g = buscar(t);
if(!g){msg.textContent = 'No encuentro a ese futbolista en la lista. Elige uno de los que aparecen al escribir.';msg.className = 'mensaje mensaje--mal';entrada.focus();return;}
if(intentos.indexOf(g)>= 0){msg.textContent = 'A ' + g.n + ' ya lo has probado.';msg.className = 'mensaje mensaje--mal';entrada.select();return;}
intentos.push(g);entrada.value = '';msg.textContent = '';msg.className = 'mensaje';
var fila = h('tr',{},h('th',{scope: 'row',texto: g.n}),comparar(g,secreto));
cuerpo.insertBefore(fila,cuerpo.firstChild);
hud.poner('i',intentos.length + ' / ' + INTENTOS,intentos.length >= INTENTOS - 2);
var aciertos = Array.prototype.filter.call(fila.querySelectorAll('td'),function(c){return c.textContent.charAt(0)=== '✓';}).length;
TYJ.anunciar(g.n + ': ' + aciertos + ' de 6 coincidencias.');
if(g === secreto)cerrar(true);
else if(intentos.length >= INTENTOS)cerrar(false);
else entrada.focus();
});
}
function final(){
var total = partida.total,nivel = U.nivel(total,NIVELES);
sesion.registrar(total);
var tabla = h('table',{class: 'fo-resumen'},h('thead',{},h('tr',{},h('th',{scope: 'col',texto: 'Futbolista'}),h('th',{scope: 'col',texto: 'Intentos'}),h('th',{scope: 'col',texto: 'Puntos'}))),
h('tbody',{},partida.resumen.map(function(r){return h('tr',{},h('td',{texto: r.n}),h('td',{texto: r.gana ? String(r.intentos): 'sin acertar'}),h('td',{texto: String(r.pts)}));})));
var cont = h('div');TYJ.vaciar(raiz).appendChild(cont);
TYJ.final(cont,{titulo: 'Nivel: ' + nivel,puntos: total,nivel: null,detalles:['Futbolistas descubiertos: ' + partida.resumen.filter(function(r){return r.gana;}).length + ' de ' + RONDAS],
textoRepetir: 'Jugar otra vez',alRepetir: empezar,compartir: 'Futbolista oculto · ' + U.miles(total)+ ' puntos · ' + partida.resumen.filter(function(r){return r.gana;}).length + '/' + RONDAS + ' · ' + nivel});
cont.lastChild.appendChild(tabla);
var s = h('div');raiz.appendChild(s);sesion.montar(s);
}
function arrancar(){
TYJ.datos('futbolista-oculto/futbolistas.json').then(function(json){banco = json.futbolistas;inicio();}).catch(function(){TYJ.errorDeCarga(raiz,arrancar);});
}
arrancar();
})();
