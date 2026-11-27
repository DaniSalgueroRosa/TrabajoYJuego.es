(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'frecuencia'};}
var P =[
e("Parece que no escucha cuando se le habla directamente.",{a: 1}),
e("Se distrae con facilidad con ruidos o con cosas que pasan alrededor.",{a: 1}),
e("Le cuesta mantener la atención en tareas o juegos largos.",{a: 1}),
e("Comete errores por descuido en los deberes o en otras tareas.",{a: 1}),
e("Pierde cosas necesarias: lápices, libros, ropa o juguetes.",{a: 1}),
e("Mueve las manos o los pies, o se retuerce en el asiento.",{h: 1}),
e("Se levanta cuando debería estar sentado o sentada, en clase o en la mesa.",{h: 1}),
e("Corre o trepa en situaciones en las que no toca.",{h: 1}),
e("Habla sin parar.",{h: 1}),
e("Responde antes de que terminen la pregunta.",{i: 1}),
e("Le cuesta esperar su turno.",{i: 1}),
e("Interrumpe a los demás o se mete en sus juegos.",{i: 1}),
e("Actúa sin pensar y se mete en peligros o problemas.",{i: 1}),
e("No termina los deberes o los encargos y los deja a medias.",{o: 1}),
e("Le cuesta organizar sus tareas, su mochila o su cuarto.",{o: 1}),
e("Evita o pospone las tareas que exigen un esfuerzo mental sostenido.",{o: 1}),
e("Se olvida de las rutinas diarias, como lavarse los dientes, recoger o llevar la bolsa.",{o: 1}),
e("Necesita que se lo recuerden una y otra vez.",{o: 1})
];
var N ={a: "Atención",h: "Actividad",i: "Impulsividad",o: "Tareas y rutinas"};
var AVISO = "Este test es orientativo y no es un diagnóstico: el TDAH solo lo puede diagnosticar un profesional sanitario tras una evaluación completa del niño o la niña. Si te preocupa, habla con su pediatra, con su centro educativo o con un especialista, y evita poner etiquetas delante del menor.";
TT.cuestionario({
intro: "Dieciocho frases para madres, padres, tutores o docentes. Piensa en el niño o la niña y compáralo con otros de su edad. Es orientativo y no es un diagnóstico.",
preguntas: P,
resultado: function(c){
var dims = Object.keys(N),suma = 0,max = 0;
dims.forEach(function(d){suma += c.tot[d];max += c.max[d];});
var v = max ? Math.round(100 * suma / max): 0;
var rango = TT.rango(v,[
[0,"Pocas señales","Reconoces pocas de estas frases en el niño o la niña. Es lo habitual: a estas edades, moverse y distraerse es normal."],
[30,"Algunas señales","Reconoces varias frases. Los niños son movidos y despistados por naturaleza, así que fíjate en si es constante, si ocurre en casa y en el colegio, y si les afecta."],
[50,"Bastantes señales","Reconoces muchas frases. Si esto le trae dificultades en el colegio, en casa o con otros niños, merece la pena hablarlo con su pediatra o con un especialista."],
[70,"Muchas señales","Reconoces casi todas las frases. No es un diagnóstico, pero sí un buen motivo para pedir una valoración profesional con ejemplos concretos del colegio y de casa."]]);
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
