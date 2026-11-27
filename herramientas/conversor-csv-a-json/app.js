(function(){
'use strict';
TH.alCargar(function(raiz){
TH.script('lib/json.js').then(function(){
var J = TH.json;
var SEPS =[[',','coma'],[';','punto y coma'],['\t','tabulador'],['|','barra vertical']];
function detectar(t){
var linea = '',enComillas = false,k,c;
for(k = 0;k < t.length;k++){c = t.charAt(k);if(c === '"')enComillas = !enComillas;if(!enComillas &&(c === '\n' || c === '\r')&& linea.trim())break;if(!enComillas &&(c === '\n' || c === '\r')){linea = '';continue;}linea += c;}
var mejor = SEPS[0],max = 0;
SEPS.forEach(function(s){var n = 0,q = false,i;for(i = 0;i < linea.length;i++){var x = linea.charAt(i);if(x === '"')q = !q;else if(!q && x === s[0])n++;}if(n > max){max = n;mejor = s;}});
return mejor;
}
function analizar(t,sep){
var filas =[],fila =[],campo = '',k = 0,n = t.length,entre = false,linea = 1,lineaComillas = 1,c,ini = true;
while(k < n){
c = t.charAt(k);
if(entre){
if(c === '"'){if(t.charAt(k + 1)=== '"'){campo += '"';k += 2;continue;}entre = false;k++;continue;}
if(c === '\n')linea++;
campo += c;k++;continue;
}
if(c === '"' && campo === ''){entre = true;lineaComillas = linea;k++;continue;}
if(c === sep){fila.push(campo);campo = '';k++;continue;}
if(c === '\r' || c === '\n'){
if(c === '\r' && t.charAt(k + 1)=== '\n')k++;
k++;linea++;
fila.push(campo);campo = '';
if(!(fila.length === 1 && fila[0]=== ''))filas.push(fila);
fila =[];continue;
}
campo += c;k++;
}
if(entre)return{error: 'Las comillas que se abren en la línea ' + lineaComillas + ' no se cierran. Cierra el campo con otra comilla doble.'};
if(campo !== '' || fila.length){fila.push(campo);if(!(fila.length === 1 && fila[0]=== ''))filas.push(fila);}
return{filas: filas};
}
var NUM = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/;
TH.texto(raiz,{
entrada:{etiqueta: 'Pega aquí tu CSV',ph: 'nombre,edad\nAna,30\nLuis,25',ejemplo: 'nombre;edad;ciudad;activo;saldo\nAna;30;Madrid;true;1250.50\nLuis;25;Sevilla;false;980\n"Mª José";41;"Palma; Mallorca";TRUE;0'},
salida:{etiqueta: 'JSON'},
filas: 11,
descargar:{nombre: 'datos.json',mime: 'application/json;charset=utf-8'},
opciones:[
{id: 'sep',tipo: 'select',etiqueta: 'Separador',valor: 'auto',opciones:[['auto','Detectarlo automáticamente'],[',','Coma (,)'],[';','Punto y coma (;)'],['\t','Tabulador'],['|','Barra vertical (|)']]},
{id: 'cabecera',tipo: 'check',etiqueta: 'La primera fila tiene los nombres de las columnas',valor: true},
{id: 'tipos',tipo: 'check',etiqueta: 'Convertir números y true/false',valor: true},
{id: 'coma',tipo: 'check',etiqueta: 'Los decimales llevan coma (3,14)',valor: false,mostrarSi: function(v){return v.tipos;}},
{id: 'nulos',tipo: 'check',etiqueta: 'Las celdas vacías son null',valor: false},
{id: 'sangria',tipo: 'select',etiqueta: 'Formato',valor: '2',opciones:[['2','Con sangría de 2 espacios'],['4','Con sangría de 4 espacios'],['tab','Con tabuladores'],['min','Minificado']]}
],
procesar: function(t,op){
if(t.charCodeAt(0)=== 0xFEFF)t = t.slice(1);
if(!t.trim())return{salida: ''};
var sep = op.sep === 'auto' ? detectar(t):[op.sep,(SEPS.filter(function(s){return s[0]=== op.sep;})[0]||[0,''])[1]];
var r = analizar(t,sep[0]);
if(r.error)return{salida: '',avisos:[r.error]};
if(!r.filas.length)return{salida: ''};
var avisos =[],cab = null,datos = r.filas;
if(op.cabecera){
var usados ={};
cab = r.filas[0].map(function(c,i){
var nom = c.trim()=== '' ? 'columna ' +(i + 1): c,base = nom,q = 2;
while(usados['$' + nom])nom = base + '_' + q++;
if(nom !== c)avisos.push('El nombre de la columna ' +(i + 1)+ ' era ' +(c.trim()=== '' ? 'vacío' : 'repetido')+ ' y se ha cambiado por «' + nom + '».');
usados['$' + nom]= 1;return nom;
});
datos = r.filas.slice(1);
}
var irregulares = 0,vacio = op.nulos ?{t: 'z',r: 'null'}:{t: 's',r: '""'};
function nodo(c){
if(c === '')return vacio;
if(op.tipos){
var x = op.coma && /^-?(0|[1-9]\d*),\d+$/.test(c)? c.replace(',','.'): c;
if(NUM.test(x)&& !(/^-?\d+$/.test(x)&& x.replace('-','').length > 15))return{t: 'n',r: x};
if(/^(true|false)$/i.test(c))return{t: 'b',r: c.toLowerCase()};
}
return{t: 's',r: JSON.stringify(c)};
}
var ancho = cab ? cab.length : 0;
datos.forEach(function(f){if(cab ? f.length !== ancho : false)irregulares++;});
var raizNodo;
if(cab){
raizNodo ={t: 'a',e: datos.map(function(f){
var o ={t: 'o',p:[]},k,m = Math.max(f.length,cab.length);
for(k = 0;k < m;k++){var nom = k < cab.length ? cab[k]: 'columna ' +(k + 1);o.p.push({k: JSON.stringify(nom),c: nom,v: k < f.length ? nodo(f[k]): vacio});}
return o;
})};
}else raizNodo ={t: 'a',e: datos.map(function(f){return{t: 'a',e: f.map(nodo)};})};
if(irregulares)avisos.push(TH.pl(irregulares,'fila tiene','filas tienen')+ ' un número de celdas distinto al de la cabecera: las que faltan se han rellenado y las sobrantes llevan el nombre «columna N».');
var sang = op.sangria === 'min' ? null : op.sangria === 'tab' ? '\t' : op.sangria === '4' ? '    ' : '  ';
return{salida: J.escribir(raizNodo,{sangria: sang}),filas:[TH.fila('separador','Separador',op.sep === 'auto' ? sep[1]+ ' (detectado)' : sep[1],'txt'),TH.fila('registros','Registros',datos.length,'n0'),TH.fila('columnas','Columnas',cab ? cab.length :(datos[0]? datos[0].length : 0),'n0')],avisos: avisos};
}
});
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
