(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/azar.js').then(function(){
var A = TH.azar,cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
function lineas(t){return t.split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);}
function unicos(l){var vistos ={};return l.filter(function(x){var k = x.toLocaleLowerCase('es');if(vistos[k])return false;vistos[k]= true;return true;});}
var forzar = true,clave = '',res = null;
function fecha(){var d = new Date(TH.ahora());return('0' + d.getDate()).slice(-2)+ '/' +('0' +(d.getMonth()+ 1)).slice(-2)+ '/' + d.getFullYear();}
TH.texto(raiz,{
entrada:{etiqueta: 'Participantes (uno por línea)',ph: 'Ana\nLuis\nMarta\nPablo',ejemplo: 'Ana\nLuis\nMarta\nPablo\nElena\nJorge\nLucía\nIván'},
salida:{etiqueta: 'Resultado del sorteo'},
filas: 10,
botones:[{texto: 'Sortear de nuevo',accion: function(api){forzar = true;api.actualizar();}}],
opciones:[
{id: 'premios',tipo: 'area',etiqueta: 'Premios (uno por línea, opcional)',ph: 'Cesta de Navidad\nEntradas de cine',filas: 4,ancho: 'completo'},
{id: 'ganadores',etiqueta: 'Cuántos ganadores',valor: 1,entero: true,ayuda: 'Se usa si no escribes premios.',mostrarSi: function(v){return !lineas(v.premios).length;}},
{id: 'suplentes',etiqueta: 'Cuántos suplentes',valor: 0,entero: true},
{id: 'quitar',tipo: 'check',etiqueta: 'Ignorar los participantes repetidos',valor: true}
],
procesar: function(t,op){
var p = lineas(t),premios = lineas(op.premios),s = op.suplentes;
if(!p.length)return{salida: '',avisos:['Escribe o pega los participantes, uno por línea, para hacer el sorteo.']};
if(op.quitar)p = unicos(p);
var g = premios.length || op.ganadores;
if(!(g >= 1)|| g !== Math.floor(g))return{salida: '',avisos:['Indica cuántos ganadores quieres con un número entero de 1 en adelante.']};
if(!(s >= 0)|| s !== Math.floor(s))return{salida: '',avisos:['Los suplentes deben ser un número entero de 0 en adelante.']};
if(g + s > p.length)return{salida: '',filas:[TH.fila('participantes','Participantes',p.length,'n0')],avisos:['Necesitas al menos ' +(g + s)+ ' participantes para ' + g +(g === 1 ? ' ganador' : ' ganadores')+(s ? ' y ' + s +(s === 1 ? ' suplente' : ' suplentes'): '')+ ', y la lista tiene ' + p.length + '.']};
var k =[p.join('\u0001'),premios.join('\u0001'),g,s].join('|');
if(forzar || k !== clave){res = A.muestra(p,g + s);clave = k;forzar = false;}
var l =[];
res.slice(0,g).forEach(function(x,i){l.push(premios.length ? premios[i]+ ' → ' + x : 'Ganador ' +(i + 1)+ ': ' + x);});
if(s){l.push('');res.slice(g).forEach(function(x,i){l.push('Suplente ' +(i + 1)+ ': ' + x);});}
l.push('','Sorteo realizado el ' + fecha()+ ' entre ' + p.length +(p.length === 1 ? ' participante.' : ' participantes.'));
return{salida: l.join('\n'),filas:[TH.fila('participantes','Participantes',p.length,'n0'),TH.fila('ganadores','Ganadores',g,'n0'),TH.fila('suplentes','Suplentes',s,'n0')]};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
