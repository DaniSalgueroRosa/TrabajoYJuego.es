(function(){
'use strict';
TH.alCargar(function(raiz){
function paleta(P){
return{piz: P.rgb(0.114,0.227,0.204),blanco: P.rgb(1,1,1),tinta: P.rgb(0.1,0.12,0.11),suave: P.rgb(0.33,0.38,0.36),fin: P.rgb(0.91,0.94,0.93),fest: P.rgb(0.99,0.93,0.55),linea: P.rgb(0.7,0.76,0.73)};
}
function crearPdf(dibujar,titulo){
return TH.pdfLib().then(function(P){
return P.PDFDocument.create().then(function(doc){
return Promise.all([doc.embedFont(P.StandardFonts.Helvetica),doc.embedFont(P.StandardFonts.HelveticaBold)]).then(function(f){
try{doc.setTitle(titulo);doc.setLanguage('es-ES');}catch(x){}
var info = dibujar(P,doc,f[0],f[1])||{};
return TH.bytesPdf(doc).then(function(blob){return{blob: blob,info: info};});
});
});
});
}
function aPng(blob,nombre){
return blob.arrayBuffer().then(function(buf){return TH.abrirPdfjs({name: nombre},buf);})
.then(function(pdf){return TH.pdfPagina(pdf,1,2.5,'#ffffff');})
.then(function(r){return TH.lienzoABlob(r.lienzo,'image/png');});
}
var h = TH.h,CAL,modelo = null,api,zonaPrevia,zonaEntrega,botones =[],estado;
TH.script('lib/calendario.js').then(function(){CAL = TH.cal;iniciar();},function(){
TH.vaciar(raiz).appendChild(h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));
});
function leer(v){
var anio = v.anio;
if(!TH.listos(v,['anio']))return{vacio: true};
if(anio !== Math.floor(anio)|| anio < 1900 || anio > 2200)return{error: 'El año debe ser un número entero entre 1900 y 2200.'};
var lunes = v.semana === 'lunes';
return{modelo:{tipo: v.tipo,anio: anio,mes: v.tipo === 'mes' ? +v.mes - 1 : null,lunes: lunes,numeros: lunes && v.numeros,festivos: v.festivos,titulo:(v.titulo || '').trim()}};
}
function orden(lunes){return lunes ?[0,1,2,3,4,5,6]:[6,0,1,2,3,4,5];}
function tablaMes(mod,m,fest){
var d = CAL.mes(mod.anio,m,mod.lunes),ord = orden(mod.lunes),grande = mod.tipo === 'mes';
var cab = h('tr',{},mod.numeros ? h('th',{scope: 'col',class: 'cal-sem',texto: 'Sem.'}): null,
ord.map(function(i){return h('th',{scope: 'col',abbr: CAL.DIAS[i],texto: grande ? CAL.capitalizar(CAL.DIAS[i]): CAL.INICIALES[i]});}));
var filas = d.semanas.map(function(s){
return h('tr',{},mod.numeros ? h('th',{scope: 'row',class: 'cal-sem',texto: String(s.iso)}): null,s.dias.map(function(dia,c){
if(!dia)return h('td',{class: 'cal-vacio'});
var iso = CAL.iso(mod.anio,m,dia),nom = fest[iso],clases =[(mod.lunes ? c >= 5 :(c === 0 || c === 6))? 'cal-fin' : '',nom ? 'cal-fest' : ''].join(' ').trim();
return h('td',{class: clases,'data-dia': String(dia),'data-mes': String(m + 1),title: nom || null},String(dia),nom ? h('span',{class: grande ? 'cal-nombre' : 'solo-lectores',texto:(grande ? '' : ', festivo: ')+ nom}): null);
}));
});
return h('table',{class: 'cal-mes' +(grande ? ' cal-mes--grande' : ''),'data-mes': String(m + 1)},
h('caption',{texto: CAL.capitalizar(CAL.MESES[m])+(grande ? ' de ' + mod.anio : '')}),h('thead',{},cab),h('tbody',{},filas));
}
function pintar(){
TH.vaciar(zonaPrevia);
botones.forEach(function(b){b.disabled = !modelo;});
zonaEntrega.hidden = true;TH.entregas = null;
if(!modelo)return;
var fest = modelo.festivos ? CAL.festivos(modelo.anio):{},i;
zonaPrevia.appendChild(h('p',{class: 'campo-titulo',texto: 'Vista previa'}));
if(modelo.titulo)zonaPrevia.appendChild(h('p',{class: 'cal-titulo',texto: modelo.titulo}));
if(modelo.tipo === 'mes')zonaPrevia.appendChild(h('div',{class: 'herr-tabla-caja',tabindex: '0',role: 'region','aria-label': 'Calendario del mes'},tablaMes(modelo,modelo.mes,fest)));
else{var rej = h('div',{class: 'cal-anio'});for(i = 0;i < 12;i++)rej.appendChild(tablaMes(modelo,i,fest));zonaPrevia.appendChild(rej);}
zonaPrevia.appendChild(h('p',{class: 'cal-leyenda'},h('span',{class: 'cal-muestra cal-muestra--fin','aria-hidden': 'true'}),' Fin de semana',modelo.festivos ?[h('span',{class: 'cal-muestra cal-muestra--fest','aria-hidden': 'true'}),' Festivo nacional (cada comunidad puede tener otros)']: null));
}
function dibujarAnio(P,doc,f,fb,mod){
var C = paleta(P),W = 841.89,H = 595.28,pag = doc.addPage([W,H]),MX = 34,ord = orden(mod.lunes),fest = mod.festivos ? CAL.festivos(mod.anio):{};
var tit = CAL.limpiar(fb,mod.titulo || String(mod.anio)),perdidos = tit.perdidos;
pag.drawText(tit.texto,{x: MX,y: H - 46,size: 26,font: fb,color: C.piz});
var cols = 4,gap = 14,arriba = H - 64,abajo = 42,cw =(W - 2 * MX -(cols - 1)* gap)/ cols,ch =(arriba - abajo - 2 * gap)/ 3,m;
for(m = 0;m < 12;m++){
var d = CAL.mes(mod.anio,m,mod.lunes),x = MX +(m % cols)*(cw + gap),y = arriba - Math.floor(m / cols)*(ch + gap);
var nw = mod.numeros ? 14 : 0,dw =(cw - nw)/ 7,rh =(ch - 29)/ 6;
pag.drawRectangle({x: x,y: y - 16,width: cw,height: 16,color: C.piz});
pag.drawText(CAL.capitalizar(d.nombre),{x: x + 6,y: y - 12,size: 10.5,font: fb,color: C.blanco});
ord.forEach(function(di,c){var t = CAL.INICIALES[di],w = fb.widthOfTextAtSize(t,7.5);pag.drawText(t,{x: x + nw + c * dw +(dw - w)/ 2,y: y - 26,size: 7.5,font: fb,color: C.suave});});
d.semanas.forEach(function(s,r){
var y0 = y - 29 -(r + 1)* rh;
if(mod.numeros && s.iso){var ws = f.widthOfTextAtSize(String(s.iso),6.5);pag.drawText(String(s.iso),{x: x + nw - 3 - ws,y: y0 + rh / 2 - 2.5,size: 6.5,font: f,color: C.suave});}
s.dias.forEach(function(dia,c){
if(!dia)return;
var esFest = !!fest[CAL.iso(mod.anio,m,dia)],esFin = mod.lunes ? c >= 5 :(c === 0 || c === 6),x0 = x + nw + c * dw,fu = esFest ? fb : f,t = String(dia);
if(esFest || esFin)pag.drawRectangle({x: x0,y: y0,width: dw,height: rh,color: esFest ? C.fest : C.fin});
pag.drawText(t,{x: x0 + dw - 3 - fu.widthOfTextAtSize(t,8.5),y: y0 + rh / 2 - 3,size: 8.5,font: fu,color: C.tinta});
});
});
pag.drawRectangle({x: x,y: y - ch,width: cw,height: ch,borderColor: C.linea,borderWidth: 0.6});
}
leyenda(pag,f,C,mod,MX,24);
return{perdidos: perdidos};
}
function leyenda(pag,f,C,mod,x,y){
pag.drawRectangle({x: x,y: y - 1,width: 10,height: 8,color: C.fin,borderColor: C.linea,borderWidth: 0.5});
pag.drawText('Fin de semana',{x: x + 15,y: y,size: 8,font: f,color: C.suave});
if(mod.festivos){
pag.drawRectangle({x: x + 100,y: y - 1,width: 10,height: 8,color: C.fest,borderColor: C.linea,borderWidth: 0.5});
pag.drawText('Festivo nacional de España (cada comunidad autónoma puede tener otros)',{x: x + 115,y: y,size: 8,font: f,color: C.suave});
}
}
function dibujarMes(P,doc,f,fb,mod){
var C = paleta(P),W = 841.89,H = 595.28,pag = doc.addPage([W,H]),MX = 34,ord = orden(mod.lunes),fest = mod.festivos ? CAL.festivos(mod.anio):{};
var d = CAL.mes(mod.anio,mod.mes,mod.lunes),nombre = CAL.capitalizar(d.nombre)+ ' de ' + mod.anio;
var tit = CAL.limpiar(fb,mod.titulo || nombre),perdidos = tit.perdidos;
pag.drawText(tit.texto,{x: MX,y: H - 50,size: 28,font: fb,color: C.piz});
if(mod.titulo)pag.drawText(nombre,{x: MX,y: H - 68,size: 11,font: f,color: C.suave});
var arriba = H - 80,nw = mod.numeros ? 26 : 0,cw =(W - 2 * MX - nw)/ 7,bajo = 46,rh =(arriba - 22 - bajo)/ d.semanas.length;
pag.drawRectangle({x: MX,y: arriba - 22,width: W - 2 * MX,height: 22,color: C.piz});
if(mod.numeros)pag.drawText('Sem.',{x: MX + 3,y: arriba - 15,size: 8,font: fb,color: C.blanco});
ord.forEach(function(di,c){var t = CAL.capitalizar(CAL.DIAS[di]),w = fb.widthOfTextAtSize(t,10);pag.drawText(t,{x: MX + nw + c * cw +(cw - w)/ 2,y: arriba - 15,size: 10,font: fb,color: C.blanco});});
d.semanas.forEach(function(s,r){
var y0 = arriba - 22 -(r + 1)* rh;
if(mod.numeros){pag.drawRectangle({x: MX,y: y0,width: nw,height: rh,borderColor: C.linea,borderWidth: 0.5});pag.drawText(String(s.iso),{x: MX + 6,y: y0 + rh - 14,size: 9,font: f,color: C.suave});}
s.dias.forEach(function(dia,c){
var x0 = MX + nw + c * cw,nom = dia ? fest[CAL.iso(mod.anio,mod.mes,dia)]: null,esFin = mod.lunes ? c >= 5 :(c === 0 || c === 6);
pag.drawRectangle({x: x0,y: y0,width: cw,height: rh,color: nom ? C.fest :(dia && esFin ? C.fin : undefined),borderColor: C.linea,borderWidth: 0.5});
if(!dia)return;
pag.drawText(String(dia),{x: x0 + 6,y: y0 + rh - 16,size: 13,font: fb,color: C.tinta});
if(nom)CAL.partir(f,CAL.limpiar(f,nom).texto,7.5,cw - 12).slice(0,2).forEach(function(l,i){pag.drawText(l,{x: x0 + 6,y: y0 + rh - 28 - i * 9,size: 7.5,font: f,color: C.tinta});});
});
});
leyenda(pag,f,C,mod,MX,26);
return{perdidos: perdidos};
}
function nombreArchivo(mod,ext){return 'calendario-' + mod.anio +(mod.tipo === 'mes' ? '-' +('0' +(mod.mes + 1)).slice(-2): '')+ '.' + ext;}
function crear(tipo){
var mod = modelo;
if(!mod)return;
estado.poner('Creando el ' +(tipo === 'pdf' ? 'PDF' : 'PNG')+ '…','info');
botones.forEach(function(b){b.disabled = true;});
crearPdf(function(P,doc,f,fb){return(mod.tipo === 'mes' ? dibujarMes : dibujarAnio)(P,doc,f,fb,mod);},'Calendario ' + mod.anio)
.then(function(r){
var nota = r.info.perdidos ? 'Hay caracteres del título que el PDF no puede escribir y se han sustituido por «?».' : null;
return(tipo === 'pdf' ? Promise.resolve(r.blob): aPng(r.blob,nombreArchivo(mod,'pdf'))).then(function(blob){
estado.limpiar();
TH.entrega(zonaEntrega,[{nombre: nombreArchivo(mod,tipo),blob: blob,nota: nota}],'Tu calendario está listo');
});
})
.catch(function(e){estado.poner('No se ha podido crear el archivo: ' +(e && e.message || 'error desconocido')+ '.','error');})
.then(function(){botones.forEach(function(b){b.disabled = !modelo;});});
}
function iniciar(){
var hoy = TH.hoyISO();
api = TH.calculadora(raiz,{
campos:[
{id: 'tipo',tipo: 'select',etiqueta: 'Calendario de',valor: 'anio',opciones:[['anio','Un año completo'],['mes','Un solo mes']]},
{id: 'anio',etiqueta: 'Año',valor: hoy.slice(0,4),entero: true,ph: '2027'},
{id: 'mes',tipo: 'select',etiqueta: 'Mes',valor: String(+hoy.slice(5,7)),opciones: CAL.MESES.map(function(n,i){return[String(i + 1),CAL.capitalizar(n)];}),mostrarSi: function(v){return v.tipo === 'mes';}},
{id: 'semana',tipo: 'select',etiqueta: 'La semana empieza en',valor: 'lunes',opciones:[['lunes','Lunes'],['domingo','Domingo']]},
{id: 'numeros',tipo: 'check',etiqueta: 'Mostrar el número de cada semana (ISO)',valor: false,mostrarSi: function(v){return v.semana === 'lunes';}},
{id: 'festivos',tipo: 'check',etiqueta: 'Marcar los festivos nacionales de España',valor: false},
{id: 'titulo',tipo: 'texto',etiqueta: 'Título (opcional)',max: 60,ph: 'Por ejemplo, Calendario de la familia',ancho: 'completo'}
],
ejemplo:{tipo: 'anio',anio: '2027',semana: 'lunes',numeros: true,festivos: true},
vacio: 'Escribe el año para ver el calendario.',
calcular: function(v){
var r = leer(v);
if(!r.modelo)return r;
var mod = r.modelo,bis =(mod.anio % 4 === 0 && mod.anio % 100 !== 0)|| mod.anio % 400 === 0,fest = mod.festivos ? CAL.festivos(mod.anio):{};
if(mod.tipo === 'mes'){
var n = CAL.diasMes(mod.anio,mod.mes),nf = Object.keys(fest).filter(function(k){return +k.slice(5,7)=== mod.mes + 1;}).length;
var filas =[TH.fila('dias','Días del mes',n,'n0'),TH.fila('primero','El día 1 cae en',CAL.DIAS[CAL.diaSemana(mod.anio,mod.mes,1)],'txt'),TH.fila('filas','Semanas que ocupa en la hoja',CAL.mes(mod.anio,mod.mes,mod.lunes).semanas.length,'n0')];
if(mod.festivos)filas.push(TH.fila('festivos','Festivos nacionales este mes',nf,'n0'));
return{filas: filas};
}
var filas2 =[TH.fila('dias','Días del año',bis ? 366 : 365,'n0'),TH.fila('bisiesto','Año bisiesto',bis ? 'Sí' : 'No','txt'),TH.fila('primero','El 1 de enero cae en',CAL.DIAS[CAL.diaSemana(mod.anio,0,1)],'txt'),TH.fila('semanas','Semanas ISO del año',CAL.semanasDelAnio(mod.anio),'n0')];
if(mod.festivos)filas2.push(TH.fila('festivos','Festivos nacionales marcados',Object.keys(fest).length,'n0'));
return{filas: filas2};
},
alCambiar: function(v){if(!zonaPrevia)return;var r = leer(v);modelo = r.modelo || null;pintar();}
});
zonaPrevia = h('div',{class: 'cal-previa'});
zonaEntrega = h('div',{hidden: true});
estado = TH.estado(raiz);
botones =[h('button',{class: 'boton',type: 'button',onclick: function(){crear('pdf');}},'Crear el PDF'),h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){crear('png');}},'Crear la imagen PNG')];
raiz.appendChild(zonaPrevia);
raiz.appendChild(h('div',{class: 'herr-acciones'},botones));
raiz.appendChild(estado.nodo);
raiz.appendChild(zonaEntrega);
api.actualizar();
}
});
})();
