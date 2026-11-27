(function(){
'use strict';
TH.alCargar(function(raiz){
var TABLA ={A: '.-',B: '-...',C: '-.-.',D: '-..',E: '.',F: '..-.',G: '--.',H: '....',I: '..',J: '.---',K: '-.-',L: '.-..',M: '--',N: '-.','Ñ': '--.--',O: '---',P: '.--.',Q: '--.-',R: '.-.',S: '...',T: '-',U: '..-',V: '...-',W: '.--',X: '-..-',Y: '-.--',Z: '--..',
0: '-----',1: '.----',2: '..---',3: '...--',4: '....-',5: '.....',6: '-....',7: '--...',8: '---..',9: '----.',
'.': '.-.-.-',',': '--..--','?': '..--..',"'": '.----.','!': '-.-.--','/': '-..-.','(': '-.--.',')': '-.--.-','&': '.-...',':': '---...',';': '-.-.-.','=': '-...-','+': '.-.-.','-': '-....-','_': '..--.-','"': '.-..-.','$': '...-..-','@': '.--.-.'};
var INVERSA ={};Object.keys(TABLA).forEach(function(k){INVERSA[TABLA[k]]= k;});
function base(c){return c === 'Ñ' ? c : c.normalize('NFD').replace(/[̀-ͯ]/g,'');}
TH.texto(raiz,{
entrada:{etiqueta: 'Texto o código Morse',ph: 'Por ejemplo: SOS o ... --- ...',ejemplo: 'Hola mundo'},
salida:{etiqueta: 'Resultado'},
descargar:{nombre: 'morse.txt'},
opciones:[{id: 'sentido',tipo: 'select',etiqueta: 'Sentido',valor: 'auto',opciones:[['auto','Detectar automáticamente'],['aMorse','Texto → Morse'],['aTexto','Morse → texto']]}],
procesar: function(t,op){
if(!t.trim())return{salida: ''};
var morse = t.replace(/[·•]/g,'.').replace(/[–—−_]/g,'-');
var esMorse = /^[.\-\/|\s]+$/.test(morse)&& /[.\-]/.test(morse),sentido = op.sentido === 'auto' ?(esMorse ? 'aTexto' : 'aMorse'): op.sentido,desconocidos =[],salida;
if(sentido === 'aMorse'){
salida = t.replace(/\r\n?/g,'\n').split('\n').map(function(linea){
return linea.trim().split(/\s+/).filter(Boolean).map(function(palabra){
return palabra.toUpperCase().split('').map(function(ch){
var c = base(ch);
if(TABLA[c])return TABLA[c];
if(desconocidos.indexOf(ch)< 0)desconocidos.push(ch);
return '';
}).filter(Boolean).join(' ');
}).filter(Boolean).join(' / ');
}).join('\n');
}else{
morse = t.replace(/[·•]/g,'.').replace(/[–—−]/g,'-');
salida = morse.replace(/\r\n?/g,'\n').split('\n').map(function(linea){
return linea.trim().split(/\s*[\/|]\s*|\s{3,}/).map(function(palabra){
return palabra.trim().split(/\s+/).filter(Boolean).map(function(c){if(INVERSA[c])return INVERSA[c];desconocidos.push(c);return '?';}).join('');
}).join(' ');
}).join('\n');
}
var avisos =[];
if(desconocidos.length)avisos.push(sentido === 'aMorse' ? 'No tienen código Morse y se han omitido: ' + desconocidos.slice(0,8).join(' ')+(desconocidos.length > 8 ? '…' : ''): 'Secuencias que no corresponden a ningún carácter (aparecen como ?): ' + desconocidos.slice(0,5).join(' ')+(desconocidos.length > 5 ? '…' : ''));
return{salida: salida,avisos: avisos,filas:[TH.fila('sentido','Sentido',sentido === 'aMorse' ? 'Texto → Morse' : 'Morse → texto','txt'),TH.fila('omitidos',sentido === 'aMorse' ? 'Caracteres omitidos' : 'Secuencias no reconocidas',desconocidos.length,'n0')]};
}
});
});
})();
