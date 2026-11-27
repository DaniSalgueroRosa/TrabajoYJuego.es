(function(){
'use strict';
TH.alCargar(function(raiz){
Promise.all([TH.script('lib/numeros.js')]).then(function(){
var cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
var N = TH.numeros;
TH.texto(raiz,{
entrada:{etiqueta: 'Números o romanos (uno por línea)',ph: 'Por ejemplo: 1994 o MCMXCIV',ejemplo: '1994\nXIV\n2026\nMMXXVI'},
salida:{etiqueta: 'Resultado'},
descargar:{nombre: 'numeros-romanos.txt'},
opciones:[
{id: 'sentido',tipo: 'select',etiqueta: 'Sentido',valor: 'auto',opciones:[['auto','Detectar automáticamente'],['romano','Número → romano'],['arabigo','Romano → número']]},
{id: 'estricto',tipo: 'check',etiqueta: 'Exigir la forma correcta (IV, no IIII)',valor: true}
],
procesar: function(t,op){
if(!t.trim())return{salida: ''};
var lineas = t.replace(/\r\n?/g,'\n').split('\n'),salida =[],errores =[],bien = 0,avisos =[];
if(lineas.length > 1000){lineas = lineas.slice(0,1000);avisos.push('Se convierten las 1000 primeras líneas; el resto se ha ignorado.');}
lineas.forEach(function(l,i){
l = l.trim();
if(!l){salida.push('');return;}
try{
var modo = op.sentido;
if(modo === 'auto')modo = /^\d+$/.test(l)? 'romano' : /^[ivxlcdm]+$/i.test(l)? 'arabigo' : null;
if(!modo)throw new Error('No sé si «' + l + '» es un número o un romano. Escribe cifras (1994) o letras romanas (MCMXCIV).');
if(modo === 'romano'){
if(!/^\d+$/.test(l))throw new Error('«' + l + '» no es un número entero positivo.');
salida.push(N.aRomano(parseInt(l,10)));
}else salida.push(String(N.deRomano(l,{estricto: op.estricto})));
bien++;
}catch(e){salida.push('');errores.push('Línea ' +(i + 1)+ ': ' + e.message);}
});
while(salida.length && salida[salida.length - 1]=== '')salida.pop();
errores.slice(0,3).forEach(function(e){avisos.push(e);});
if(errores.length > 3)avisos.push('Y ' +(errores.length - 3)+ ' líneas más con problemas.');
return{salida: salida.join('\n'),avisos: avisos,filas:[TH.fila('convertidas','Líneas convertidas',bien,'n0'),TH.fila('errores','Líneas con problemas',errores.length,'n0')]};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
