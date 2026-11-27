(function(){
'use strict';
function e(t,d,escala){return{t: t,d: d,escala: escala || 'frecuencia'};}
var P =[
e('Pienso en él varias veces al día.',{m: 1}),
e('Me ilusiona ver su nombre en la pantalla del móvil.',{m: 1}),
e('Me imagino haciendo planes con él.',{m: 1}),
e('Reorganizo mi agenda para coincidir con él.',{m: 1}),
e('Soy yo quien suele escribir primero.',{m: 1}),
e('Le he dejado claro de alguna forma que me gusta.',{m: 1},'verdad'),
e('Me importa mucho lo que piense de mí.',{m: 1},'acuerdo'),
e('Me cuesta ser yo mismo/a cuando está delante.',{m: 1},'acuerdo'),
e('Él me escribe primero.',{e: 1}),
e('Él propone planes concretos para vernos.',{e: 1}),
e('Él se interesa por mi vida: mi familia, mis estudios, mi trabajo.',{e: 1}),
e('Él habla de mí a sus amigos o me presenta a su gente.',{e: 1}),
e('Él me dice cosas bonitas de forma directa.',{e: 1}),
e('Él cumple lo que dice y avisa si no puede venir.',{e: 1}),
e('Él me busca aunque no tenga nada que pedirme.',{e: 1}),
e('Él se alegra de verdad cuando le cuento algo bueno.',{e: 1})
];
var TXT ={
mm:['Parece mutuo','Los dos os implicáis y los gestos van en las dos direcciones. Es una buena base: lo que falta es ponerle palabras.'],
mx:['Tú das más pasos que él','Tú estás muy implicado/a y de su parte ves menos señales. Puede ser timidez, falta de interés o simplemente otro ritmo. Conviene preguntárselo con claridad antes de volcar más energía.'],
xm:['Él parece más implicado que tú','Él muestra más interés del que tú sientes ahora mismo. Si no estás segura o seguro, tómate tu tiempo y sé honesto/a para no crear falsas esperanzas.'],
xx:['Poco movimiento por ambas partes','Ni tú ni él habéis dado muchos pasos. Puede que sea pronto, o que no haya chispa. Un plan sencillo te dirá más que mil cábalas.']
};
TT.cuestionario({
intro: 'Hablamos de «él», pero sirve para cualquier persona que te guste. Responde con sinceridad: son frases sobre lo que haces tú y sobre lo que hace esa persona. Es un juego orientativo.',
preguntas: P,
resultado: function(c){
var m = c.pct('m'),e = c.pct('e'),k =(m >= 50 ? 'm' : 'x')+(e >= 50 ? 'm' : 'x'),t = TXT[k];
return{
titulo: 'Lo vuestro, en un plano',titular: t[0],rango:{nombre: 'Tu implicación ' + TT.fmt(m,0)+ ' % · Su interés ' + TT.fmt(e,0)+ ' %',texto: t[1]},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Dónde estáis'}),TT.graf.plano(e,m,{ejeX: 'Su interés',ejeY: 'Tu implicación',esquinas:['Das más tú','Mutuo','Poco movimiento','Él da más'],descripcion: 'Tu implicación frente a su interés'})),
TT.h('div',{},TT.h('h3',{texto: 'Diferencia de pasos'}),TT.graf.balanza([{nombre: 'Su interés menos tu implicación',valor: Math.round(e - m)}],{max: 100,unidad: ' puntos',descripcion: 'A quién se inclina la balanza'})),
TT.h('p',{'class': 'tt-aviso',texto: 'Un test no puede saber lo que siente otra persona. Úsalo para ordenar tus ideas y, si te apetece, habla con él con calidez y sin presionar.'})),
detalles:[['Tu implicación',TT.fmt(m,0)+ ' %'],['Su interés',TT.fmt(e,0)+ ' %']],
copia: 'En el test ¿Le gusto a él también? me ha salido: ' + t[0].toLowerCase()+ '.'
};
}
});
})();
