(function(){
'use strict';
TH.alCargar(function(raiz){
Promise.all([TH.script('lib/estilo.js')]).then(function(){
var cg = raiz.querySelector('#herr-carga');
if(cg)cg.remove();
var E = TH.estilo,h = TH.h,EJEMPLO = "En la era digital actual, la tecnología juega un papel fundamental en la vida de las personas. Además, la tecnología permite acceder a información de forma rápida y sencilla. Además, la tecnología facilita la comunicación entre las personas de todo el mundo. Asimismo, la tecnología ofrece una amplia gama de herramientas para el trabajo y el estudio. Por otro lado, la tecnología plantea nuevos retos para la sociedad actual. Por otra parte, la tecnología exige que las personas aprendan nuevas habilidades cada año. Cabe destacar que la tecnología también cambia la forma en que las personas se relacionan. En conclusión, la tecnología juega un papel esencial en el desarrollo de la sociedad. En resumen, la tecnología es una herramienta que debe usarse con responsabilidad.";
var entrada = h('textarea',{id: 't-entrada',rows: 10,placeholder: 'Pega aquí el texto que quieres revisar. Hacen falta al menos 100 palabras.',spellcheck: 'false'});
var salida = h('div',{class: 'herr-salida','aria-live': 'polite'});
function dibujar(){
TH.vaciar(salida);
var t = entrada.value;
if(!t.trim()){salida.appendChild(h('p',{class: 'herr-vacio','data-k': 'vacio',texto: 'Pega un texto de al menos 100 palabras y aquí verás qué señales aparecen, sin porcentajes ni veredictos.'}));return;}
var r = E.analizar(t),filas =[TH.fila('palabras','Palabras',r.palabras,'n0'),TH.fila('frases','Frases',r.frases,'n0')];
if(!r.suficiente){
salida.appendChild(TH.listaFilas(filas));
salida.appendChild(h('p',{class: 'herr-estado herr-estado--info',role: 'status','data-k': 'lectura','data-v': 'insuficiente',texto: r.resumen}));
return;
}
filas.push(TH.fila('activas','Señales que aparecen',r.activas,function(n){return n + ' de ' + r.total;}));
salida.appendChild(TH.listaFilas(filas));
salida.appendChild(h('p',{class: 'herr-estado' +(r.activas ? ' herr-estado--aviso' : ''),role: 'status','data-k': 'lectura','data-v': r.lectura,texto: r.resumen}));
var ul = h('ul',{class: 'herr-senales'});
r.senales.forEach(function(s){
ul.appendChild(h('li',{class: s.activa ? 'es-activa' : ''},h('strong',{texto: s.titulo + ': '}),h('span',{'data-k': 'senal-' + s.id,'data-v': s.activa ? '1' : '0',texto: s.activa ? 'aparece' : 'no aparece'}),h('span',{class: 'herr-chico',texto: s.detalle})));
});
salida.appendChild(ul);
}
entrada.addEventListener('input',dibujar);
raiz.appendChild(h('p',{class: 'herr-estado herr-estado--aviso',role: 'note','data-k': 'aviso',texto: E.AVISO}));
raiz.appendChild(h('div',{class: 'campo'},h('label',{for: 't-entrada',texto: 'Texto que quieres revisar'}),entrada));
raiz.appendChild(h('div',{class: 'herr-acciones'},
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){entrada.value = EJEMPLO;dibujar();}},'Probar con un ejemplo'),
h('button',{class: 'boton boton--secundario',type: 'button',onclick: function(){entrada.value = '';dibujar();entrada.focus();}},'Borrar')));
raiz.appendChild(salida);
dibujar();
},function(){TH.vaciar(raiz).appendChild(TH.h('p',{class: 'herr-estado herr-estado--error',role: 'alert',texto: 'No se ha podido cargar la herramienta. Recarga la página.'}));});
});
})();
