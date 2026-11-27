(function(){
'use strict';
TH.alCargar(function(raiz){
var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',INV ={},k;
for(k = 0;k < 64;k++)INV[ABC.charAt(k)]= k;
INV['-']= 62;INV['_']= 63;
function codificar(bytes,url,relleno){
var s = '',i,a,b,c,t = url ? ABC.slice(0,62)+ '-_' : ABC;
for(i = 0;i + 2 < bytes.length;i += 3){a = bytes[i];b = bytes[i + 1];c = bytes[i + 2];s += t.charAt(a >> 2)+ t.charAt(((a & 3)<< 4)|(b >> 4))+ t.charAt(((b & 15)<< 2)|(c >> 6))+ t.charAt(c & 63);}
var resto = bytes.length - i;
if(resto === 1){a = bytes[i];s += t.charAt(a >> 2)+ t.charAt((a & 3)<< 4)+(relleno ? '==' : '');}
else if(resto === 2){a = bytes[i];b = bytes[i + 1];s += t.charAt(a >> 2)+ t.charAt(((a & 3)<< 4)|(b >> 4))+ t.charAt((b & 15)<< 2)+(relleno ? '=' : '');}
return s;
}
function decodificar(texto){
var s = texto.replace(/\s+/g,''),i;
for(i = 0;i < s.length;i++)if(s.charAt(i)=== '=')break;
var cuerpo = s.slice(0,i),cola = s.slice(i);
if(cola.replace(/=/g,'')!== '')return{error: 'Hay caracteres detrás del relleno «=»: el relleno solo puede ir al final.'};
if(cola.length > 2)return{error: 'Hay demasiados signos «=» de relleno al final (como máximo dos).'};
for(i = 0;i < cuerpo.length;i++)if(!Object.prototype.hasOwnProperty.call(INV,cuerpo.charAt(i)))return{error: 'El carácter «' + cuerpo.charAt(i)+ '» (posición ' +(i + 1)+ ') no es válido en Base64. Solo se admiten letras, cifras, «+», «/» (o «-» y «_» en la variante URL) y el relleno «=».'};
if(cuerpo.length % 4 === 1)return{error: 'La longitud no es válida: sobra un carácter al final. Puede que falte una parte del texto.'};
if(cola &&(cuerpo.length + cola.length)% 4 !== 0)return{error: 'El relleno «=» no cuadra con la longitud del texto.'};
var bytes =[],v = 0,bits = 0;
for(i = 0;i < cuerpo.length;i++){v =(v << 6)| INV[cuerpo.charAt(i)];bits += 6;if(bits >= 8){bits -= 8;bytes.push((v >> bits)& 255);v &=(1 << bits)- 1;}}
return{bytes: new Uint8Array(bytes)};
}
TH.texto(raiz,{
entrada:{etiqueta: 'Tu texto',ph: 'Escribe o pega aquí…',ejemplo: 'Hola, mundo: ñandú, canción y 😀'},
salida:{etiqueta: 'Resultado'},
filas: 8,
opciones:[
{id: 'modo',tipo: 'select',etiqueta: 'Qué hacer',valor: 'cod',opciones:[['cod','Codificar texto a Base64'],['dec','Decodificar Base64 a texto']]},
{id: 'url',tipo: 'check',etiqueta: 'Variante segura para URL (- y _ en lugar de + y /)',valor: false,mostrarSi: function(v){return v.modo === 'cod';}},
{id: 'relleno',tipo: 'check',etiqueta: 'Añadir el relleno «=» final',valor: true,mostrarSi: function(v){return v.modo === 'cod';}},
{id: 'lineas',tipo: 'check',etiqueta: 'Partir en líneas de 76 caracteres (MIME)',valor: false,mostrarSi: function(v){return v.modo === 'cod';}}
],
procesar: function(t,op){
if(op.modo === 'cod'){
if(t === '')return{salida: ''};
var bytes = new TextEncoder().encode(t),s = codificar(bytes,op.url,op.relleno);
if(op.lineas)s = s.replace(/(.{76})(?=.)/g,'$1\n');
return{salida: s,filas:[TH.fila('bytes','Bytes del texto (UTF-8)',bytes.length,'n0'),TH.fila('longitud','Caracteres en Base64',s.replace(/\n/g,'').length,'n0')]};
}
if(!t.trim())return{salida: ''};
var r = decodificar(t);
if(r.error)return{salida: '',avisos:[r.error]};
var texto;
try{texto = new TextDecoder('utf-8',{fatal: true}).decode(r.bytes);}
catch(e){
return{salida: Array.prototype.map.call(r.bytes,function(b){return('0' + b.toString(16)).slice(-2).toUpperCase();}).join(' '),filas:[TH.fila('bytes','Bytes decodificados',r.bytes.length,'n0')],
avisos:['Los datos decodificados no son texto UTF-8 (parecen un archivo binario, como una imagen). Se muestran sus bytes en hexadecimal.']};
}
return{salida: texto,filas:[TH.fila('bytes','Bytes decodificados',r.bytes.length,'n0')]};
}
});
});
})();
