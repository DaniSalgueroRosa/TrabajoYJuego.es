(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'frecuencia'};}
var P =[
e("Me cuesta mantener la atención en tareas largas o aburridas, aunque sean importantes.",{a: 1}),
e("Me pierdo en conversaciones o lecturas y tengo que volver atrás.",{a: 1}),
e("Mi mente se va a otra parte aunque alguien me hable directamente.",{a: 1}),
e("Dejo las tareas a medias porque algo nuevo me llama la atención.",{a: 1}),
e("Cualquier ruido o estímulo me saca de lo que estoy haciendo.",{a: 1}),
e("Pierdo o no encuentro cosas necesarias, como las llaves, el móvil o los documentos.",{o: 1}),
e("Se me olvidan citas, recados o pagos aunque quiera acordarme.",{o: 1}),
e("Dejo para el último momento lo que me exige esfuerzo mental sostenido.",{o: 1}),
e("Me cuesta ordenar tareas, calcular cuánto tiempo llevan y llegar a tiempo.",{o: 1}),
e("Cometo despistes por no fijarme en los detalles en el trabajo o los estudios.",{o: 1}),
e("Me siento inquieto o inquieta: muevo manos o pies, o me cuesta estar sentado mucho rato.",{h: 1}),
e("Noto una inquietud interior, como si tuviera un motor encendido por dentro.",{h: 1}),
e("Me cuesta relajarme o disfrutar de actividades tranquilas en mi tiempo libre.",{h: 1}),
e("Hablo más de la cuenta o me cuesta quedarme callado o callada.",{h: 1}),
e("Estoy siempre en marcha, de un plan a otro, sin descansar.",{h: 1}),
e("Interrumpo o termino las frases de los demás.",{i: 1}),
e("Me cuesta esperar mi turno: colas, esperas, reuniones largas.",{i: 1}),
e("Compro, decido o contesto sin pensar en las consecuencias.",{i: 1}),
e("Me aburro rápido y cambio de tema, de proyecto o de plan.",{i: 1}),
e("Digo cosas que luego lamento por haberlas soltado sin filtro.",{i: 1})
];
var N ={a: "Atención",o: "Organización y olvidos",h: "Inquietud",i: "Impulsividad"};
var AVISO = "Este test es orientativo y no es un diagnóstico: el TDAH solo lo puede diagnosticar un profesional sanitario tras una evaluación completa. Si lo que describes te afecta en el trabajo, los estudios o las relaciones, consúltalo con tu médico de familia, con psicología o con psiquiatría.";
TT.cuestionario({
intro: "Veinte frases. Para cada una, elige con qué frecuencia te pasa en tu vida de adulto, no solo en épocas de estrés. Es orientativo y no es un diagnóstico.",
preguntas: P,
resultado: function(c){
var dims = Object.keys(N),suma = 0,max = 0;
dims.forEach(function(d){suma += c.tot[d];max += c.max[d];});
var v = max ? Math.round(100 * suma / max): 0;
var rango = TT.rango(v,[
[0,"Pocas señales","Te reconoces en pocas de estas frases. Si aun así te preocupa tu atención, comentarlo con un profesional es siempre una buena idea."],
[30,"Algunas señales","Te reconoces en varias frases. Es habitual cuando hay estrés, poco sueño o mucha carga: fíjate en si se mantiene en el tiempo y en si afecta a tu día a día."],
[50,"Bastantes señales","Te reconoces en muchas frases. Si llevan mucho tiempo dificultándote el trabajo, los estudios o las relaciones, merece la pena consultarlo con un profesional."],
[70,"Muchas señales","Te reconoces en casi todas las frases. Eso no es un diagnóstico, pero sí un buen motivo para pedir una evaluación y llevar ejemplos concretos de tu vida diaria."]]);
var frecuentes = c.resp.filter(function(k){return k >= 3;}).length,mayor = c.top(dims,true)[0];
return{
titulo: 'Tu resultado orientativo',valor: v,unidad: '%',rango: rango,
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tus cuatro áreas'}),TT.graf.radar(dims.map(function(d){return{nombre: N[d],valor: c.pct(d)};}),{descripcion: 'Porcentaje de cada área sobre el máximo posible'})),
TT.h('p',{'class': 'tt-res-texto',texto: 'Has contestado «con frecuencia» o «siempre» en ' + frecuentes + ' de ' + c.n + ' frases. El área que más pesa es «' + N[mayor[0]]+ '» (' + TT.fmt(mayor[1],0)+ ' %).'}),
TT.h('p',{'class': 'tt-aviso',texto: AVISO})),
detalles: dims.map(function(d){return[N[d],TT.fmt(c.pct(d),0)+ ' %'];})
};
}
});
})();
