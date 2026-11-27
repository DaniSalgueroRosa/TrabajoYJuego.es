(function(){
'use strict';
function q(t,s,p,r){return{t: t,o:[[s,{s: 1}],[p,{p: 1}],[r,{r: 1}]]};}
var P =[
q('Tu equipo se atasca en un proyecto. ¿Qué haces?','Me pongo a trabajar en lo que toca, sin quejarme','Busco una idea distinta que dé otro sentido a todo','Reúno a todos, reparto tareas y fijo un plan'),
q('Tienes una tarde libre.','Hago por fin lo que tenía pendiente','Me pierdo en un libro, una canción o un paseo','Organizo un plan para que otros lo pasen bien'),
q('Alguien comete un error grave.','Lo arreglo y no hace falta decir más','Intento entender qué le pasaba por dentro','Hablo con esa persona y decido qué cambia'),
q('¿Qué te enorgullece más?','Haber cumplido siempre mi palabra','Haber creado algo que emociona','Haber conseguido que algo grande saliera adelante'),
q('En una discusión del grupo…','Aguanto el tipo y espero a que acabe','Ofrezco una imagen o una frase que cambia el tono','Tomo la palabra y encamino la conversación'),
q('¿Qué te cuesta más?','Pedir ayuda','Dejar de darle vueltas a las cosas','Delegar sin controlarlo todo'),
q('Tu mochila para un viaje largo lleva…','Lo justo y bien ordenado','Un cuaderno y algo para inspirarme','Mapas, planes y contactos de repuesto'),
q('Ante un reto imposible…','Insisto hasta que salga','Lo miro desde un ángulo nuevo','Calculo los recursos y asumo el riesgo'),
q('Te piden una palabra para describirte.','Fiable','Sensible','Decidido/a'),
q('Una norma te parece injusta.','La cumplo y la señalo por el cauce correcto','La cuestiono con una historia o una obra','Intento cambiarla desde dentro'),
q('¿Qué papel tienes en un cumpleaños sorpresa?','Me encargo de que todo esté a tiempo','Escribo la tarjeta o preparo el detalle emotivo','Coordino a los invitados y lo dirijo'),
q('Un día horrible…','Cuando acaba, descanso y sigo','Escribo, dibujo o escucho música para sacarlo','Busco qué puedo cambiar mañana'),
q('Tu mayor miedo es…','Fallar a los míos','Pasar la vida sin sentir nada especial','Perder el control de lo que construí'),
q('Lo que más valoras en una amistad es…','Que esté a mi lado en lo difícil','Que me entienda sin explicarle nada','Que compartamos metas y nos empujemos')
];
var T ={
s:['El Soldado','Eres disciplina, lealtad y constancia. Cuando algo hay que hacerlo, lo haces, y no necesitas medallas. Tu fuerza está en no rendirte y en cuidar de los tuyos con hechos.','Cumples y aguantas. Aprende también a descansar y a pedir ayuda: no todo se gana a base de resistir.'],
p:['El Poeta','Eres sensibilidad, imaginación y mirada propia. Ves lo que otros pasan por alto y lo conviertes en palabras, ideas o arte. Tu fuerza está en dar sentido y belleza a lo que vives.','Sientes y creas. Ponle también calendario a tus sueños: lo que escribes o imaginas merece llegar al mundo.'],
r:['El Rey','Eres visión, decisión y responsabilidad. Te sale organizar, tomar la palabra y empujar a otros hacia una meta común. Tu fuerza está en convertir ideas en proyectos.','Diriges y decides. Acuérdate de escuchar: los mejores reyes se rodean de soldados y poetas.']
};
var MEZCLAS ={sp: 'Soldado con alma de poeta',ps: 'Poeta con disciplina de soldado',sr: 'Soldado que lidera',rs: 'Rey que no teme mancharse las manos',pr: 'Poeta con vocación de rey',rp: 'Rey con alma de poeta'};
TT.cuestionario({
intro: 'Catorce situaciones con tres respuestas. Elige la que más se parezca a ti. Es un juego de arquetipos, no una prueba psicológica.',
preguntas: P,
resultado: function(c){
var orden = c.top(['s','p','r']),k = orden[0][0],t = T[k],total = c.tot.s + c.tot.p + c.tot.r;
var mezcla = orden[0][1]- orden[1][1]<= 1 ? MEZCLAS[orden[0][0]+ orden[1][0]]: null;
return{
titulo: 'Tu arquetipo',titular: t[0],rango:{nombre: mezcla || 'Arquetipo claro',texto: t[1]},
extra: TT.h('div',{'class': 'tt-res-extra'},
TT.h('div',{},TT.h('h3',{texto: 'Tu mezcla'}),TT.graf.triangulo(['Rey','Soldado','Poeta'],[c.tot.r,c.tot.s,c.tot.p],{descripcion: 'Reparto de tus respuestas entre rey, soldado y poeta'})),
TT.h('p',{'class': 'tt-res-texto',texto: t[2]})),
detalles:[['Soldado',c.tot.s + ' de ' + total],['Poeta',c.tot.p + ' de ' + total],['Rey',c.tot.r + ' de ' + total]],
copia: 'En el test Soldado, Poeta o Rey me ha salido: ' + t[0]+ '.'
};
}
});
})();
