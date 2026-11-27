(function(){
'use strict';
function e(t,d){return{t: t,d: d,escala: 'acuerdo'};}
var P =[
e('Me han atraído personas de géneros distintos.',{a: 1}),
e('Me he ilusionado o enamorado de personas de más de un género.',{a: 1}),
e('Me imagino teniendo una relación con personas de más de un género.',{a: 1}),
e('Una persona me puede atraer sea del género que sea.',{a: 1}),
e('Mi atracción depende más de cómo es la persona que de su género.',{p: 1}),
e('Me atrae la personalidad, el humor o la forma de ser antes que el género.',{p: 1}),
e('Siento que no encajo del todo en «solo con hombres» ni en «solo con mujeres».',{p: 1}),
e('Mi atracción por un género y por otro no tiene por qué ser igual para ser real.',{p: 1}),
e('Me sentiría cómodo/a usando la palabra «bisexual» o «pansexual» para mí.',{c: 1}),
e('Me gustaría hablar con otras personas bisexuales.',{c: 1}),
e('Me molesta la idea de que «bisexual» sea una fase o una indecisión.',{c: 1}),
e('Pensar en esto me produce más curiosidad que miedo.',{c: 1})
];
var N ={a: 'Atracción hacia varios géneros',p: 'La persona importa más que el género',c: 'Comodidad con la palabra'};
TT.cuestionario({
intro: 'Pensado para quien se pregunta si le atraen personas de más de un género. Responde para ti, sin prisa y sin etiquetas obligatorias.',
escala: 'acuerdo',
preguntas: P,
resultado: function(c){
var dims =['a','p','c'],v = Math.round(TT.media(dims.map(function(d){return c.pct(d);})));
var rango = TT.rango(v,[
[0,'Poca afinidad por ahora','Tus respuestas muestran poca afinidad con la atracción hacia varios géneros. Todo está bien: no hace falta etiquetar nada.'],
[30,'Curiosidad o atracción puntual','Hay algo de curiosidad o de atracción que no apunta siempre en la misma dirección. Puedes explorarlo con calma o dejarlo estar.'],
[55,'Bastante afinidad','Tus respuestas muestran una atracción que puede ir hacia más de un género. Algunas personas con este perfil usan la palabra bisexual o pansexual, y otras ninguna.'],
[75,'Mucha afinidad','Tus respuestas muestran una atracción muy presente hacia varios géneros y cómoda con esa idea. Muchas personas con este perfil se identifican como bisexuales o pansexuales.']]);
return{
titulo: 'Tu afinidad',valor: v,unidad: '/ 100',rango: rango,
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'De un género a varios'}),TT.graf.espectro(c.pct('a'),{izq: 'Un solo género',der: 'Varios géneros',descripcion: 'Atracción hacia uno o hacia varios géneros'})),
TT.h('div',{},TT.h('h3',{texto: 'Tres áreas'}),TT.graf.radar(dims.map(function(d){return{nombre: N[d],valor: c.pct(d)};}),{descripcion: 'Porcentaje en cada área'})),
TT.h('p',{'class': 'tt-aviso',texto: 'Ningún test puede decirte si eres bisexual: solo tú lo sabes. Sentir atracción por más de un género es una orientación completa y no una fase ni una indecisión. Si lo necesitas, habla con alguien de confianza o con una asociación LGTBI+ de tu zona.'})),
detalles: dims.map(function(d){return[N[d],TT.fmt(c.pct(d),0)+ ' %'];}),
copia: 'En el test bisexual me ha salido una afinidad de ' + v + ' sobre 100.'
};
}
});
})();
