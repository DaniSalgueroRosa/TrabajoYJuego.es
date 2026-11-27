(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/hash.js').then(function(){
var Hs = TH.hash;
function normal(t){return t.replace(/[\s:]/g,'');}
TH.calculadora(raiz,{
campos:[
{id: 'texto',tipo: 'area',etiqueta: 'Texto del que quieres el hash',ph: 'Escribe o pega aquí…',filas: 4,ancho: 'completo'},
{id: 'formato',tipo: 'select',etiqueta: 'Mostrar el resultado en',valor: 'hex',opciones:[['hex','Hexadecimal en minúsculas'],['HEX','Hexadecimal en MAYÚSCULAS'],['b64','Base64']]},
{id: 'comparar',tipo: 'texto',etiqueta: 'Hash con el que comparar (opcional)',ph: 'Pega aquí el hash que debería salir',ancho: 'completo'}
],
ejemplo:{texto: 'Hola, mundo',comparar: ''},
vacio: 'Escribe o pega un texto y verás aquí sus cinco hashes al instante.',
calcular: function(v){
if(!v.texto)return{vacio: true};
var bytes = new TextEncoder().encode(v.texto),filas =[],texto =[],coincide = null,i;
var res = Hs.ALGORITMOS.map(function(a){var d = Hs[a.id](bytes);return{a: a,hex: Hs.hex(d),b64: Hs.base64(d)};});
res.forEach(function(r){
var val = v.formato === 'b64' ? r.b64 : v.formato === 'HEX' ? r.hex.toUpperCase(): r.hex;
filas.push(TH.fila(r.a.id,r.a.nombre + ' (' + r.a.bits + ' bits)',val,'txt'));texto.push(r.a.nombre + ': ' + val);
});
filas.push(TH.fila('bytes','Bytes del texto (UTF-8)',bytes.length,'n0'));
var cmp = normal(v.comparar || '');
if(cmp){
var esHex = /^[0-9a-fA-F]+$/.test(cmp),hallado = null,mismaLong = null;
res.forEach(function(r){
if(esHex ? cmp.toLowerCase()=== r.hex : cmp === r.b64)hallado = r.a.nombre;
if(esHex ? cmp.length === r.a.bits / 4 : cmp.length === r.b64.length)mismaLong = r.a.nombre;
});
coincide = hallado ? 'Sí: coincide con el ' + hallado + ' de este texto' : mismaLong ? 'No coincide: tiene la longitud de un ' + mismaLong + ', pero no es el hash de este texto' : 'No coincide con ninguno de los hashes calculados';
filas.unshift(TH.fila('coincide','Comparación',coincide,'txt'));texto.unshift('Comparación: ' + coincide);
}
return{filas: filas,sinDestacar: !cmp,texto: texto.join('\n'),notas:['Los saltos de línea del cuadro cuentan como un solo carácter (LF), como en Linux y macOS. Si el hash lo calculó otro programa sobre un archivo de Windows, puede haber contado dos (CR y LF) y salir distinto.','MD5 y SHA-1 están rotos para firmas y contraseñas: sirven para comprobar que un dato no ha cambiado por error, no para protegerlo.']};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
