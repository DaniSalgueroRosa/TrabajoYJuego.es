(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'acuerdo'};}
var P =[
e('Cuando me ilusiono con alguien, suele ser una persona de mi mismo género.',{a: 1}),
e('Me atraen físicamente personas de mi mismo género.',{a: 1}),
e('Desde hace años me llaman la atención personas de mi mismo género.',{a: 1}),
e('Me siento más a gusto en la intimidad emocional con personas de mi mismo género.',{a: 1}),
e('Me imagino compartiendo mi vida con alguien de mi mismo género.',{i: 1}),
e('Al ver a una pareja del mismo género, me siento reflejado/a.',{i: 1}),
e('Mis mayores ilusiones o enamoramientos han sido con personas de mi mismo género.',{i: 1}),
e('Cuando fantaseo con una pareja, casi siempre es de mi mismo género.',{i: 1}),
e('Me sentiría tranquilo/a si mi familia o mis amigos lo supieran.',{e: 1}),
e('Me gustaría tener cerca a gente que me entienda en esto.',{e: 1}),
e('Ocultar esto me pesa más de lo que me da miedo contarlo.',{e: 1}),
e('Me sentiría cómodo/a usando la palabra «gay» o «lesbiana» para mí.',{e: 1})
];
var N ={a: 'Atracción',i: 'Imaginación y recuerdos',e: 'Entorno y comodidad'};
TT.cuestionario({
intro: 'Pensado para quien se pregunta si le atraen personas de su mismo género. «Homosexual» es la palabra más técnica; mucha gente prefiere «gay» o «lesbiana». Responde para ti, sin prisa.',
escala: 'acuerdo',
preguntas: P,
resultado: function(c){
var dims =['a','i','e'],v = Math.round(TT.media(dims.map(function(d){return c.pct(d);})));
var rango = TT.rango(v,[
[0,'Poca afinidad por ahora','Tus respuestas muestran poca afinidad con la atracción hacia tu mismo género. Puede que no sea tu caso, y eso también está bien.'],
[30,'Curiosidad o atracción puntual','Hay algo de atracción o curiosidad, sin una dirección clara. Explorar con calma es una opción válida; también lo es no darle más vueltas.'],
[55,'Bastante afinidad','Tus respuestas muestran bastante atracción hacia personas de tu mismo género. Hay quien usa la palabra gay o lesbiana, quien prefiere bisexual y quien no usa ninguna.'],
[75,'Mucha afinidad','Tus respuestas muestran una atracción muy presente hacia personas de tu mismo género. Muchas personas con este perfil se identifican como gays o lesbianas.']]);
return{
titulo: 'Tu afinidad',valor: v,unidad: '/ 100',rango: rango,
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Espectro de afinidad'}),TT.graf.espectro(v,{izq: 'Poca afinidad',der: 'Mucha afinidad',descripcion: 'Afinidad con la atracción hacia tu mismo género'})),
TT.h('div',{},TT.h('h3',{texto: 'Tres áreas'}),TT.graf.barras(dims.map(function(d){return{nombre: N[d],valor: c.pct(d)};}),{descripcion: 'Porcentaje en cada área'})),
TT.h('p',{'class': 'tt-aviso',texto: 'La orientación sexual no se decide con un test: solo tú sabes cómo te sientes. Ser homosexual no es una enfermedad ni un problema, y no tienes que contarlo hasta que quieras. Si lo necesitas, habla con alguien de confianza o con una asociación LGTBI+ de tu zona.'})),
detalles: dims.map(function(d){return[N[d],TT.fmt(c.pct(d),0)+ ' %'];}),
copia: 'En el test homosexual me ha salido una afinidad de ' + v + ' sobre 100.'
};
}
});
})();
