(function(){
'use strict';
function e(t,d,escala){return{t: t,d: d,escala: escala || 'frecuencia'};}
var P =[
e('Se me acelera el corazón o siento mariposas cuando le veo o le escribo.',{i: 1}),
e('Me sube el ánimo solo con recibir un mensaje suyo.',{i: 1}),
e('Me pongo nervioso/a o me quedo sin palabras a su lado.',{i: 1,n: 1}),
e('Pienso en esa persona sin querer, varias veces al día.',{p: 1}),
e('Me descubro sonriendo al recordar algo que hizo o dijo.',{p: 1}),
e('Me cuesta concentrarme porque tengo la cabeza en esa persona.',{p: 1,n: 1}),
e('Me siento tranquilo/a y a gusto con esa persona, puedo ser yo mismo/a.',{c: 1},'acuerdo'),
e('Me importa de verdad cómo está esa persona y quiero cuidarla.',{c: 1},'acuerdo'),
e('Admiro a esa persona por cómo es, no solo por cómo me hace sentir.',{c: 1},'acuerdo'),
e('Me imagino compartiendo planes con esa persona dentro de unos meses.',{f: 1},'acuerdo'),
e('Estaría dispuesto/a a hacer sacrificios razonables por esa persona.',{f: 1},'acuerdo'),
e('Me agobia pensar que esa persona puede perder el interés o irse.',{n: 1}),
e('Veo a esa persona casi perfecta y me cuesta imaginar defectos en ella.',{n: 1},'acuerdo'),
e('Si pasa un día sin noticias suyas, me siento mal.',{n: 1})
];
var N ={i: 'Ilusión y mariposas',p: 'Pensamientos constantes',c: 'Cariño y confianza',f: 'Planes de futuro',n: 'Nervios e idealización'};
TT.cuestionario({
intro: 'Piensa en esa persona y responde sin darle muchas vueltas. Enamorarse tiene muchas formas: este test solo pone nombre a lo que ya sientes.',
preguntas: P,
resultado: function(c){
var dims =['i','p','c','f'],v = Math.round(TT.media(dims.map(function(d){return c.pct(d);}))),nervios = Math.round(c.pct('n'));
var rango = TT.rango(v,[
[0,'Más amistad o cariño que amor','Lo que describes se parece más a un afecto tranquilo o a una amistad. No hace falta etiquetarlo: a veces el amor llega despacio.'],
[35,'Atracción y cariño, sin etiqueta','Hay ilusión y cariño, pero aún no el torbellino del enamoramiento. Dale tiempo y observa cómo evoluciona.'],
[55,'Muy ilusionado/a: te estás enamorando','Pensamientos, ilusión y ganas de futuro: todo apunta a que el enamoramiento está en marcha.'],
[75,'Estás enamorado/a','Casi todo lo que cuentas encaja con estar enamorado/a. Es una de las emociones más intensas: disfrútala y cuídate.']]);
var aviso = nervios >= 65 ? 'Tus nervios y tu idealización son altos. Es muy normal al empezar, pero conviene tener los pies en el suelo: nadie es perfecto y una relación sana también da calma.' : 'Tus nervios son moderados, buena señal: lo que sientes parece ir acompañado de tranquilidad.';
return{
titulo: 'Tu termómetro',valor: v,unidad: '/ 100',rango: rango,
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Lo que sientes, en un radar'}),TT.graf.radar(['i','p','c','f','n'].map(function(d){return{nombre: N[d],valor: c.pct(d)};}),{descripcion: 'Porcentaje de cada área del enamoramiento'})),
TT.h('p',{'class': 'tt-res-texto',texto: aviso}),
TT.h('p',{'class': 'tt-aviso',texto: 'Esto es un juego y no una evaluación de tus emociones. Enamorarse no tiene una única forma. Si lo que sientes te hace sufrir, habla con alguien de confianza.'})),
detalles:['i','p','c','f','n'].map(function(d){return[N[d],TT.fmt(c.pct(d),0)+ ' %'];}),
copia: 'En el test ¿Estoy enamorado/a? me han salido ' + v + ' de 100.'
};
}
});
})();
