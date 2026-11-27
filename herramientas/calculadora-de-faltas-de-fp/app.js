(function(){
'use strict';
TH.alCargar(function(raiz){
var estadoGlobal = TH.estado(raiz);
Promise.all([TH.datos('calculadora-de-faltas-de-fp/comunidad-andalucia.json'),TH.datos('calculadora-de-faltas-de-fp/ciclos-andalucia.json')]).then(function(r){
iniciar(r[0],r[1]);
},function(){
TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se han podido cargar los datos de los ciclos. Comprueba tu conexión y recarga la página.'}));
});
function iniciar(com,ciclos){
var h = TH.h,filas =[],curso = '1',porcentaje = com.porcentaje,trimestres = com.trimestres,semanas = com.horas.semanas;
TH.vaciar(raiz);
var grado = h('select',{id: 'c-grado'},h('option',{value: ''},'Todos'),h('option',{value: 'medio'},'Grado medio'),h('option',{value: 'superior'},'Grado superior'));
var buscar = h('input',{id: 'c-buscar',type: 'text',autocomplete: 'off',placeholder: 'Ej.: informática, SMR, enfermería…'});
var ciclo = h('select',{id: 'c-ciclo'});
var cursoSel = h('select',{id: 'c-curso'},h('option',{value: '1'},'1.º curso'),h('option',{value: '2'},'2.º curso'));
var contador = h('span',{class: 'campo-ayuda',id: 'c-ciclo-ayuda','aria-live': 'polite'});
ciclo.setAttribute('aria-describedby','c-ciclo-ayuda');
function texto(c){return TH.norm([c.nombre,c.sigla || '',c.alias || '',c.familia,c.familia2 || ''].join(' '));}
ciclos.forEach(function(c){c._t = texto(c);});
function etiquetaCiclo(c){return c.nombre +(c.sigla ? ' (' + c.sigla + ')' : '')+ ' · ' +(c.grado === 'medio' ? 'G. medio' : 'G. superior');}
function pintarCiclos(){
var q = TH.norm(buscar.value).trim(),g = grado.value,previo = ciclo.value;
var lista = ciclos.filter(function(c){return(!g || c.grado === g)&&(!q || q.split(/\s+/).every(function(p){return c._t.indexOf(p)>= 0;}));});
TH.vaciar(ciclo);
ciclo.appendChild(h('option',{value: ''},lista.length ? 'Elige tu ciclo (' + lista.length + ')' : 'Ningún ciclo coincide'));
lista.forEach(function(c){ciclo.appendChild(h('option',{value: c.id,selected: c.id === previo},etiquetaCiclo(c)));});
contador.textContent = lista.length ? lista.length +(lista.length === 1 ? ' ciclo disponible.' : ' ciclos disponibles.'): 'Prueba con otra palabra o quita el filtro de grado.';
}
function porId(id){return ciclos.filter(function(c){return c.id === id;})[0];}
function cargarModulos(){
var c = porId(ciclo.value);
if(!c){return;}
curso = cursoSel.value;
var mods = c.modulos[curso]||[];
filas = mods.map(function(m){return{nombre: m[0],horas: m[1],faltas: ''};});
pintarTabla();
}
var formCiclo = h('form',{class: 'herr-form',novalidate: true,onsubmit: function(e){e.preventDefault();}},
h('div',{class: 'herr-campos'},
h('div',{class: 'campo'},h('label',{for: 'c-grado',texto: 'Grado'}),grado),
h('div',{class: 'campo'},h('label',{for: 'c-buscar',texto: 'Buscar ciclo'}),buscar),
h('div',{class: 'campo campo--completo'},h('label',{for: 'c-ciclo',texto: 'Ciclo formativo'}),ciclo,contador),
h('div',{class: 'campo'},h('label',{for: 'c-curso',texto: 'Curso'}),cursoSel)));
raiz.appendChild(formCiclo);
[grado,buscar].forEach(function(el){el.addEventListener('input',pintarCiclos);});
ciclo.addEventListener('change',cargarModulos);
cursoSel.addEventListener('change',cargarModulos);
var salida = h('div',{class: 'herr-salida',id: 'fp-salida'});
var resumen = h('div',{class: 'herr-salida',id: 'fp-resumen'});
raiz.appendChild(resumen);
raiz.appendChild(salida);
var acciones = h('div',{class: 'herr-acciones'},
h('button',{class: 'boton boton--secundario',type: 'button',id: 'fp-anadir',onclick: function(){filas.push({nombre: '',horas: '',faltas: '',propio: true});pintarTabla();var i = filas.length - 1;var el = TH.$('#fp-n-' + i);if(el)el.focus();}},'Añadir un módulo a mano'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'fp-ejemplo',onclick: function(){filas =[{nombre: 'Módulo de 96 horas',horas: 96,faltas: 14,propio: true}];pintarTabla();}},'Probar con un ejemplo'),
h('button',{class: 'boton boton--secundario',type: 'button',id: 'fp-borrar',onclick: function(){filas.forEach(function(f){f.faltas = '';});pintarTabla();}},'Poner las faltas a cero'));
raiz.appendChild(acciones);
var notaFuente = h('div',{class: 'herr-nota',id: 'fp-fuente'});
raiz.appendChild(notaFuente);
function limite(horas){return Math.floor(horas * porcentaje / 100 + 1e-9);}
function calc(f){
var horas = TH.num(f.horas),faltas = f.faltas === '' ? 0 : TH.num(f.faltas);
if(!(horas > 0)|| isNaN(faltas)|| faltas < 0)return null;
var lim = limite(horas),pf = faltas / horas * 100;
var estado = faltas > lim ? 'superado' :(lim > 0 && faltas >= 0.8 * lim ? 'cerca' : 'bien');
if(lim === 0 && faltas > 0)estado = 'superado';
return{horas: horas,faltas: faltas,lim: lim,quedan: lim - faltas,pf: pf,asistencia: 100 - pf,estado: estado};
}
var TEXTO_ESTADO ={bien: 'Dentro del límite',cerca: 'Cerca del límite',superado: 'Límite superado'};
function pintarTabla(){
TH.vaciar(salida);TH.vaciar(resumen);
if(!filas.length){
salida.appendChild(h('p',{class: 'herr-vacio',texto: 'Elige tu ciclo y tu curso para ver los módulos, o añade un módulo a mano.'}));
notaFuente.textContent = '';
return;
}
var cuerpo = h('tbody',{});
var res =[],tH = 0,tF = 0,malos = 0,riesgo = 0,invalidos = 0;
filas.forEach(function(f,i){
var r = calc(f);res.push(r);
if(r){tH += r.horas;tF += r.faltas;if(r.estado === 'superado')malos++;else if(r.estado === 'cerca')riesgo++;}else invalidos++;
var nombre = f.propio ? h('input',{id: 'fp-n-' + i,type: 'text',autocomplete: 'off',value: f.nombre,placeholder: 'Nombre del módulo','aria-label': 'Nombre del módulo ' +(i + 1)}): h('span',{class: 'fp-nombre',texto: f.nombre});
var horas = h('input',{id: 'fp-h-' + i,type: 'text',inputmode: 'decimal',autocomplete: 'off',value: f.horas === '' ? '' : String(f.horas).replace('.',','),'aria-label': 'Horas del módulo ' + f.nombre});
var faltas = h('input',{id: 'fp-f-' + i,type: 'text',inputmode: 'decimal',autocomplete: 'off',value: f.faltas === '' ? '' : String(f.faltas).replace('.',','),placeholder: '0','aria-label': 'Horas de falta en ' +(f.nombre || 'el módulo ' +(i + 1))});
if(f.propio)nombre.addEventListener('input',function(){f.nombre = nombre.value;});
horas.addEventListener('input',function(){f.horas = horas.value;refrescar();});
faltas.addEventListener('input',function(){f.faltas = faltas.value;refrescar();});
var estadoCelda = r ? h('span',{class: 'fp-estado fp-estado--' + r.estado,'data-k': 'estado-' + i,'data-v': r.estado,texto: TEXTO_ESTADO[r.estado]}): h('span',{class: 'herr-chico','data-k': 'estado-' + i,'data-v': 'sin-datos',texto: 'Revisa los números'});
var celdaMax = r ?[h('span',{'data-k': 'limite-' + i,'data-v': String(r.lim),texto: TH.fmt(r.lim,0)+ ' h'}),h('span',{class: 'herr-chico fp-trim',texto: trimestres[curso]? '≈ ' + TH.fmt(r.lim / trimestres[curso],1)+ ' h por trimestre' : ''})]: '—';
var quitar = h('button',{class: 'boton boton--secundario boton--chico',type: 'button','aria-label': 'Quitar ' +(f.nombre || 'el módulo ' +(i + 1)),onclick: function(){filas.splice(i,1);pintarTabla();}},'Quitar');
cuerpo.appendChild(h('tr',{class: r ? 'fp-fila fp-fila--' + r.estado : 'fp-fila'},
h('th',{scope: 'row','data-label': 'Módulo'},nombre),
h('td',{'data-label': 'Horas del módulo'},horas),
h('td',{'data-label': 'Tus faltas (horas)'},faltas),
h('td',{'data-label': 'Máximo permitido'},celdaMax),
h('td',{'data-label': 'Te quedan'},r ? h('span',{'data-k': 'quedan-' + i,'data-v': String(r.quedan),texto: r.quedan >= 0 ? TH.fmt(r.quedan,[0,2])+ ' h' : 'Te pasas ' + TH.fmt(-r.quedan,[0,2])+ ' h'}): '—'),
h('td',{'data-label': 'Tu asistencia'},r ? h('span',{'data-k': 'asist-' + i,'data-v': String(r.asistencia),texto: TH.pct(r.asistencia,[0,1])}): '—'),
h('td',{'data-label': 'Situación'},estadoCelda),
h('td',{class: 'fp-quitar'},quitar)));
});
var tabla = h('table',{class: 'herr-tabla fp-tabla'},
h('caption',{texto: 'Módulos del ' +(curso === '1' ? 'primer' : 'segundo')+ ' curso: horas, faltas y margen'}),
h('thead',{},h('tr',{},['Módulo','Horas del módulo','Tus faltas (horas)','Máximo permitido','Te quedan','Tu asistencia','Situación',''].map(function(t,k){return h('th',{scope: 'col'},k === 7 ? h('span',{class: 'solo-lectores',texto: 'Acciones'}): t);}))),
cuerpo);
salida.appendChild(h('div',{class: 'herr-tabla-caja fp-caja',role: 'region','aria-label': 'Tabla de módulos',tabindex: '0'},tabla));
var dl = h('dl',{class: 'herr-res'},
h('div',{class: 'herr-fila herr-fila--destacada'},h('dt',{texto: 'Módulos con el límite superado'}),h('dd',{'data-k': 'superados','data-v': String(malos),texto: String(malos)})),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Módulos cerca del límite'}),h('dd',{'data-k': 'cerca','data-v': String(riesgo),texto: String(riesgo)})),
h('div',{class: 'herr-fila'},h('dt',{texto: 'Horas de falta en total'}),h('dd',{'data-k': 'faltas-total','data-v': String(tF),texto: TH.fmt(tF,[0,2])+ ' h de ' + TH.fmt(tH,[0,2])+ ' h'})));
resumen.appendChild(dl);
if(invalidos)resumen.appendChild(h('p',{class: 'herr-estado herr-estado--aviso',role: 'note',texto: 'Hay ' + invalidos +(invalidos === 1 ? ' módulo con horas o faltas que no son un número válido.' : ' módulos con horas o faltas que no son un número válido.')+ ' No se cuentan hasta que los corrijas.'}));
if(malos)resumen.appendChild(h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'Has superado el ' + porcentaje + ' % de faltas en ' + malos +(malos === 1 ? ' módulo' : ' módulos')+ '. Según la ' + com.norma + ', en ese caso se pierde la evaluación continua del módulo y se pasa a una vía alternativa de evaluación. Habla con tu tutor o tutora.'}));
notaFuente.textContent = '';
notaFuente.appendChild(document.createTextNode('Reglas aplicadas: ' + com.nombre + ', ' + com.norma + '. Máximo de faltas: el ' + porcentaje + ' % de las horas del módulo (' +(com.cuentan === 'todas' ? 'justificadas o no' : com.cuentan)+ '). Las horas de los módulos salen de ' + com.horas.fuente + ' (horas semanales × ' + semanas + ' semanas); corrígelas si tu centro usa otras.'));
TH.resultado ={filas: res.map(function(r,i){return r ?{k: 'limite-' + i,v: r.lim}: null;}),texto: ''};
}
function refrescar(){
var cuerpo = TH.$('.fp-tabla tbody');if(!cuerpo)return;
var activo = document.activeElement && document.activeElement.id,pos = document.activeElement && document.activeElement.selectionStart;
pintarTabla();
var el = activo && document.getElementById(activo);
if(el){el.focus();try{el.setSelectionRange(pos,pos);}catch(e){}}
}
var fuentes = h('ul',{class: 'fp-fuentes'});
com.fuentes.concat(com.horas.enlaces).forEach(function(f){fuentes.appendChild(h('li',{},h('a',{href: f.u,rel: 'noopener noreferrer',target: '_blank'},f.t)));});
raiz.appendChild(h('div',{class: 'herr-privacidad fp-aviso',id: 'fp-aviso'},
h('p',{},h('strong',{texto: 'Importante: '}),'esta calculadora es una ayuda orientativa y no sustituye a tu centro. Confirma con tu tutor o tutora el cómputo oficial de tus faltas y las horas reales de cada módulo.'),
h('p',{texto: com.nota}),h('p',{class: 'herr-chico',texto: 'Fuentes consultadas:'}),fuentes));
pintarCiclos();
pintarTabla();
}
});
})();
