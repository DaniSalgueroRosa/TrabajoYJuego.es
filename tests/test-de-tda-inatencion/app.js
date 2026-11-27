(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'frecuencia'};}
var P =[
e("Me cuesta seguir una película, una clase o una reunión sin desconectar.",{s: 1}),
e("Leo y tengo que repetir el párrafo porque no me he enterado.",{s: 1}),
e("Me resulta difícil terminar tareas que exigen esfuerzo mental constante.",{s: 1}),
e("Pierdo el hilo en medio de lo que estoy haciendo.",{s: 1}),
e("Olvido lo que acabo de decidir hacer, como ir a otra habitación a por algo.",{d: 1}),
e("Se me pasan citas, plazos o recados importantes.",{d: 1}),
e("Cometo errores por descuido aunque sé hacer bien la tarea.",{d: 1}),
e("Pierdo objetos de uso diario: gafas, llaves, cartera, cargador.",{d: 1}),
e("Empiezo muchas cosas y termino pocas.",{o: 1}),
e("Me cuesta ordenar mis tareas y no sé por dónde empezar.",{o: 1}),
e("Mi espacio de trabajo o mi habitación se desordena enseguida.",{o: 1}),
e("Retraso lo que implica organizar o planificar.",{o: 1}),
e("Me quedo mirando a la nada o dándole vueltas a mis pensamientos.",{m: 1}),
e("Parece que no escucho cuando me hablan, aunque quiero hacerlo.",{m: 1}),
e("Me despisto con facilidad cuando estoy en silencio.",{m: 1}),
e("Me distraigo con cosas que otras personas ni notan.",{m: 1})
];
var N ={s: "Atención sostenida",d: "Olvidos y despistes",o: "Organización",m: "Mente en otra parte"};
var AVISO = "Este test es orientativo y no es un diagnóstico: el TDAH solo lo puede diagnosticar un profesional sanitario tras una evaluación completa. Si lo que describes te afecta en el trabajo, los estudios o las relaciones, consúltalo con tu médico de familia, con psicología o con psiquiatría.";
TT.cuestionario({
intro: "Dieciséis frases. Elige con qué frecuencia te pasa cada una en tu vida diaria. Es un test orientativo sobre la atención y no es un diagnóstico.",
preguntas: P,
resultado: function(c){
var dims = Object.keys(N),suma = 0,max = 0;
dims.forEach(function(d){suma += c.tot[d];max += c.max[d];});
var v = max ? Math.round(100 * suma / max): 0;
var rango = TT.rango(v,[
[0,"Pocas señales de inatención","Te reconoces en pocas de estas frases. Si aun así notas que tu atención te limita, merece la pena comentarlo con un profesional."],
[30,"Algunas señales de inatención","Te reconoces en varias frases. El cansancio, el estrés o el mal sueño pueden provocarlo, así que fíjate en si se mantiene y si te afecta."],
[50,"Bastantes señales de inatención","Te reconoces en muchas frases. Si llevan tiempo dificultando tu día a día, una evaluación profesional puede aclarar qué hay detrás."],
[70,"Muchas señales de inatención","Te reconoces en casi todas las frases. No es un diagnóstico, pero es un buen motivo para consultarlo con ejemplos concretos de tu vida diaria."]]);
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
