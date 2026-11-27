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
var MAX_TAREAS = 30,MAX_LARGO = 140;
function lineas(t){return String(t || '').split(/\n/).map(function(x){return x.trim();}).filter(Boolean);}
function leer(v){
var f = TH.fechaUTC(v.fecha);
if(!v.fecha)return{vacio: true};
if(!f)return{error: 'Elige una fecha válida.'};
var lun = TH.sumarDias(f,-((f.getUTCDay()+ 6)% 7)),dias =[],i,total = 0;
for(i = 0;i < 7;i++){
var d = TH.sumarDias(lun,i),t = lineas(v['d' + i]);
if(t.length > MAX_TAREAS)return{error: 'Hay demasiadas tareas el ' + CAL.DIAS[i]+ ': el máximo es ' + MAX_TAREAS + ' por día.'};
if(t.some(function(x){return x.length > MAX_LARGO;}))return{error: 'Alguna tarea del ' + CAL.DIAS[i]+ ' es demasiado larga: el máximo es de ' + MAX_LARGO + ' letras.'};
if(i < 5 || v.finde)total += t.length;
dias.push({i: i,anio: d.getUTCFullYear(),mes: d.getUTCMonth(),dia: d.getUTCDate(),tareas: t});
}
var iso = CAL.semanaISO(lun.getUTCFullYear(),lun.getUTCMonth(),lun.getUTCDate()),dom = TH.sumarDias(lun,6);
return{modelo:{titulo:(v.titulo || '').trim(),finde: v.finde,dias: v.finde ? dias : dias.slice(0,5),notas: String(v.notas || '').replace(/\s+$/,''),semana: iso.semana,lunes: lun,domingo: dom,total: total}};
}
function rango(m){
var a = m.lunes,b = m.domingo,mismoMes = a.getUTCMonth()=== b.getUTCMonth(),mismoAnio = a.getUTCFullYear()=== b.getUTCFullYear();
return 'del ' + a.getUTCDate()+(mismoMes ? '' : ' de ' + CAL.MESES[a.getUTCMonth()])+(mismoAnio ? '' : ' de ' + a.getUTCFullYear())+ ' al ' + b.getUTCDate()+ ' de ' + CAL.MESES[b.getUTCMonth()]+ ' de ' + b.getUTCFullYear();
}
function pintar(){
TH.vaciar(zonaPrevia);
botones.forEach(function(b){b.disabled = !modelo;});
zonaEntrega.hidden = true;TH.entregas = null;
if(!modelo)return;
zonaPrevia.appendChild(h('p',{class: 'campo-titulo',texto: 'Vista previa'}));
zonaPrevia.appendChild(h('p',{class: 'pl-titulo'},modelo.titulo ? modelo.titulo + ' · ' : '','Semana ' + modelo.semana + ', ' + rango(modelo)));
zonaPrevia.appendChild(h('div',{class: 'pl-semana' +(modelo.finde ? '' : ' pl-semana--cinco')},modelo.dias.map(function(d){
return h('section',{class: 'pl-dia','data-dia': String(d.i + 1),'aria-label': CAL.capitalizar(CAL.DIAS[d.i])+ ' ' + d.dia + ' de ' + CAL.MESES[d.mes]},
h('h3',{class: 'pl-dia-nombre'},CAL.capitalizar(CAL.DIAS[d.i]),h('span',{class: 'pl-dia-fecha',texto: d.dia + ' ' + CAL.MESES[d.mes].slice(0,3)})),
d.tareas.length ? h('ul',{class: 'pl-tareas'},d.tareas.map(function(t){return h('li',{texto: t});})): h('p',{class: 'pl-libre',texto: 'Día libre de tareas'}));
})));
if(modelo.notas)zonaPrevia.appendChild(h('section',{class: 'pl-notas','aria-label': 'Notas de la semana'},h('h3',{texto: 'Notas'}),h('p',{class: 'pl-notas-texto',texto: modelo.notas})));
}
function dibujar(P,doc,f,fb,mod){
var C = paleta(P),W = 841.89,H = 595.28,pag = doc.addPage([W,H]),MX = 30,perdidos = 0,truncadas = 0;
function lim(t,fu){var r = CAL.limpiar(fu || f,t);perdidos += r.perdidos;return r.texto;}
pag.drawText(lim(mod.titulo || 'Planificador semanal',fb),{x: MX,y: H - 40,size: 20,font: fb,color: C.piz});
pag.drawText(lim('Semana ' + mod.semana + ' · ' + rango(mod)),{x: MX,y: H - 58,size: 11,font: f,color: C.suave});
var cols = mod.dias.length,gap = 8,cw =(W - 2 * MX -(cols - 1)* gap)/ cols,arriba = H - 72,notasAlto = mod.notas ? 86 : 0,abajo = 28 +(notasAlto ? notasAlto + 10 : 0),alto = arriba - abajo,cab = 28,LIN = 16;
var huecos = Math.floor((alto - cab - 4)/ LIN);
mod.dias.forEach(function(d,c){
var x = MX + c *(cw + gap),y0 = arriba - alto;
pag.drawRectangle({x: x,y: y0,width: cw,height: alto,borderColor: C.linea,borderWidth: 0.7});
pag.drawRectangle({x: x,y: arriba - cab,width: cw,height: cab,color: C.piz});
pag.drawText(lim(CAL.capitalizar(CAL.DIAS[d.i]),fb),{x: x + 6,y: arriba - 13,size: 10.5,font: fb,color: C.blanco});
pag.drawText(lim(d.dia + ' de ' + CAL.MESES[d.mes]),{x: x + 6,y: arriba - 24,size: 8,font: f,color: C.blanco});
var k;
for(k = 1;k <= huecos;k++)pag.drawLine({start:{x: x + 4,y: arriba - cab - k * LIN},end:{x: x + cw - 4,y: arriba - cab - k * LIN},thickness: 0.4,color: C.linea});
var usados = 0,ancho = cw - 24;
d.tareas.forEach(function(t,ti){
var ls = CAL.partir(f,lim(t),8.5,ancho);
if(usados + ls.length > huecos){
if(usados < huecos){var resto = d.tareas.length - ti;pag.drawText(lim('… y ' + resto +(resto === 1 ? ' tarea más' : ' tareas más')),{x: x + 8,y: arriba - cab -(usados + 1)* LIN + 4,size: 8,font: fb,color: C.suave});usados = huecos;}
truncadas++;return;
}
pag.drawRectangle({x: x + 7,y: arriba - cab -(usados + 1)* LIN + 4,width: 7,height: 7,borderColor: C.piz,borderWidth: 0.8});
ls.forEach(function(l,li){pag.drawText(l,{x: x + 19,y: arriba - cab -(usados + li + 1)* LIN + 4,size: 8.5,font: f,color: C.tinta});});
usados += ls.length;
});
});
if(notasAlto){
var ny = 28;
pag.drawRectangle({x: MX,y: ny,width: W - 2 * MX,height: notasAlto,borderColor: C.linea,borderWidth: 0.7});
pag.drawText('Notas',{x: MX + 6,y: ny + notasAlto - 13,size: 10,font: fb,color: C.piz});
var nl =[],maxl = Math.floor((notasAlto - 24)/ 11);
mod.notas.split(/\n/).forEach(function(p){var ls = CAL.partir(f,lim(p),9,W - 2 * MX - 14);(ls.length ? ls :['']).forEach(function(l){nl.push(l);});});
if(nl.length > maxl){nl = nl.slice(0,maxl);truncadas++;nl[maxl - 1]= nl[maxl - 1]+ ' …';}
nl.forEach(function(l,i){pag.drawText(l,{x: MX + 6,y: ny + notasAlto - 26 - i * 11,size: 9,font: f,color: C.tinta});});
}
return{perdidos: perdidos,truncadas: truncadas};
}
function nombreArchivo(mod,ext){var l = mod.lunes;return 'planificador-semana-' + l.getUTCFullYear()+ '-' +('0' + mod.semana).slice(-2)+ '.' + ext;}
function crear(tipo){
var mod = modelo;
if(!mod)return;
estado.poner('Creando el ' +(tipo === 'pdf' ? 'PDF' : 'PNG')+ '…','info');
botones.forEach(function(b){b.disabled = true;});
crearPdf(function(P,doc,f,fb){return dibujar(P,doc,f,fb,mod);},'Planificador de la semana ' + mod.semana)
.then(function(r){
var notas =[];
if(r.info.truncadas)notas.push('Algunas tareas o notas no caben en la hoja y se han recortado');
if(r.info.perdidos)notas.push('Hay caracteres que el PDF no puede escribir y se han sustituido por «?»');
return(tipo === 'pdf' ? Promise.resolve(r.blob): aPng(r.blob,nombreArchivo(mod,'pdf'))).then(function(blob){
estado.limpiar();
TH.entrega(zonaEntrega,[{nombre: nombreArchivo(mod,tipo),blob: blob,nota: notas.length ? notas.join('. '): null}],'Tu planificador está listo');
});
})
.catch(function(e){estado.poner('No se ha podido crear el archivo: ' +(e && e.message || 'error desconocido')+ '.','error');})
.then(function(){botones.forEach(function(b){b.disabled = !modelo;});});
}
function iniciar(){
var campos =[
{id: 'titulo',tipo: 'texto',etiqueta: 'Título (opcional)',max: 60,ph: 'Por ejemplo, Semana de exámenes',ancho: 'completo'},
{id: 'fecha',tipo: 'fecha',etiqueta: 'Un día de la semana que quieres planificar',valor: 'hoy'},
{id: 'finde',tipo: 'check',etiqueta: 'Incluir sábado y domingo',valor: true}
];
CAL.DIAS.forEach(function(d,i){campos.push({id: 'd' + i,tipo: 'area',etiqueta: CAL.capitalizar(d)+ ' (una tarea por línea)',filas: 4,mostrarSi: function(v){return i < 5 || v.finde;}});});
campos.push({id: 'notas',tipo: 'area',etiqueta: 'Notas de la semana',filas: 3,ancho: 'completo'});
api = TH.calculadora(raiz,{
campos: campos,
ejemplo:{titulo: 'Semana de entregas',fecha: '2026-11-11',d0: 'Entregar el informe\nReunión de equipo a las 10:00',d1: 'Clase de inglés',d2: 'Revisar el presupuesto',d3: 'Llamar al dentista',d4: 'Compra semanal\nLimpiar el coche',d5: 'Comida familiar',d6: 'Preparar la semana',notas: 'Recordar renovar el seguro antes del viernes.'},
vacio: 'Elige una fecha para ver su semana.',
calcular: function(v){
var r = leer(v);
if(!r.modelo)return r;
var m = r.modelo;
return{filas:[TH.fila('semana','Semana del año',m.semana,'n0'),TH.fila('rango','Periodo',rango(m),'txt'),TH.fila('tareas','Tareas apuntadas',m.total,'n0')],sinDestacar: false};
},
alCambiar: function(v){if(!zonaPrevia)return;var r = leer(v);modelo = r.modelo || null;pintar();}
});
zonaPrevia = h('div',{class: 'pl-previa'});
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
