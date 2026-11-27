(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'frecuencia'};}
var P =[
e("No puedo estar quieto o quieta: muevo piernas, manos o juego con objetos.",{q: 1}),
e("Me levanto cuando se supone que debería estar sentado o sentada.",{q: 1}),
e("Siento necesidad de moverme aunque no haya motivo.",{q: 1}),
e("Me cuesta hacer actividades tranquilas sin inquietarme.",{q: 1}),
e("Hablo mucho y me cuesta dejar hablar a los demás.",{h: 1}),
e("Contesto antes de que acaben de preguntarme.",{h: 1}),
e("Interrumpo conversaciones o actividades de otras personas.",{h: 1}),
e("Cuento algo que no debía porque lo suelto enseguida.",{h: 1}),
e("Compro cosas o tomo decisiones sin pensarlas.",{d: 1}),
e("Me lanzo a planes o proyectos sin valorar los riesgos.",{d: 1}),
e("Hago algo por impulso y después me arrepiento.",{d: 1}),
e("Cambio de plan de golpe por un impulso del momento.",{d: 1}),
e("Me impaciento en las colas o en las esperas.",{p: 1}),
e("Me cuesta esperar mi turno en un juego o en una conversación.",{p: 1}),
e("Me irrito si algo tarda más de lo previsto.",{p: 1}),
e("Me aburro enseguida si no pasa nada.",{p: 1})
];
var N ={q: "Inquietud física",h: "Hablar e interrumpir",d: "Decisiones impulsivas",p: "Paciencia y espera"};
var AVISO = "Este test es orientativo y no es un diagnóstico: el TDAH solo lo puede diagnosticar un profesional sanitario tras una evaluación completa. Si lo que describes te afecta en el trabajo, los estudios o las relaciones, consúltalo con tu médico de familia, con psicología o con psiquiatría.";
TT.cuestionario({
intro: "Dieciséis frases. Elige con qué frecuencia te pasa cada una en tu vida diaria. Es un test orientativo sobre la inquietud y la impulsividad, y no es un diagnóstico.",
preguntas: P,
resultado: function(c){
var dims = Object.keys(N),suma = 0,max = 0;
dims.forEach(function(d){suma += c.tot[d];max += c.max[d];});
var v = max ? Math.round(100 * suma / max): 0;
var rango = TT.rango(v,[
[0,"Pocas señales","Te reconoces en pocas de estas frases. Tu nivel de inquietud y de impulsividad parece moderado en tu día a día."],
[30,"Algunas señales","Te reconoces en varias frases. La cafeína, el estrés o la falta de sueño también pueden provocar inquietud, así que mira si es algo constante."],
[50,"Bastantes señales","Te reconoces en muchas frases. Si esta inquietud o esta impulsividad te traen problemas con frecuencia, un profesional puede ayudarte a entender por qué."],
[70,"Muchas señales","Te reconoces en casi todas las frases. No es un diagnóstico, pero sí un buen motivo para hablarlo con un profesional y llevar ejemplos concretos."]]);
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
