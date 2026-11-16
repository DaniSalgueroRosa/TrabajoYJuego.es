/* Test internacional de español: 24 preguntas de opción múltiple por franjas de dificultad. Se corrige al responder y el resultado estima un nivel (una franja
   se da por superada con un 60 % de aciertos, siguiendo el orden). Preguntas y explicaciones propias; nada se envía ni se guarda. */
(function () {
  'use strict';
  var NIVELES = ["Muy conocidas", "Frecuentes", "Regionales", "Muy regionales"];
  var RESULTADOS = [
    ["Español de andar por casa", "Te manejas con las palabras de tu entorno, pero cuando cruzas el charco sorprende cuánto cambia el léxico. Es el momento de curiosear."],
    ["Oído abierto", "Reconoces las diferencias más conocidas entre países, como carro y coche o jugo y zumo."],
    ["Viajero o viajera del español", "Conoces muchas palabras de varios países y sabes que una misma palabra puede significar cosas distintas según dónde estés."],
    ["Dialectólogo o dialectóloga aficionada", "Tienes un gran conocimiento del español de ambos lados del Atlántico y entiendes hasta los regionalismos menos habituales."],
    ["Embajador o embajadora del español", "Dominas el español en toda su variedad: pocas palabras de cualquier país se te escapan."]].map(function (x) { return { n: x[0], d: x[1] }; });
  // [franja, pregunta, [correcta, error, error, error], explicación]: la correcta va primera y el motor mezcla las respuestas
  var P = [
    [0, "En México, ¿qué es un «camión» además de un vehículo de carga?", ["Un autobús urbano", "Una bicicleta", "Un taxi compartido en moto", "Un tren de mercancías"], "En México «camión» se usa también para el autobús que circula por la ciudad."],
    [0, "En gran parte de Latinoamérica, ¿qué significa «carro»?", ["Coche", "Carretilla de mano", "Carro de la compra únicamente", "Caballo de tiro"], "Carro es la palabra habitual para coche en Colombia, Venezuela, Centroamérica y el Caribe, entre otros."],
    [0, "¿Qué es un «celular»?", ["Un teléfono móvil", "Un pequeño sótano", "Una célula del cuerpo", "Una cárcel"], "En América, «celular» es lo que en España se llama móvil."],
    [0, "¿Qué es una «computadora»?", ["Un ordenador", "Una calculadora", "Una impresora", "Una consola de videojuegos"], "Computadora es el término más habitual en América para ordenador."],
    [0, "En muchos países de América se bebe «jugo». ¿Qué es en España?", ["Zumo", "Caldo", "Refresco con gas", "Batido de leche"], "Jugo y zumo son lo mismo; «jugo» predomina en América y «zumo» en España."],
    [0, "¿Qué es una «palta»?", ["Un aguacate", "Una pera", "Una ciruela", "Un plátano"], "Palta es el nombre del aguacate en Chile, Perú, Argentina, Uruguay y otros países andinos."],
    [1, "En Argentina, ¿qué es un «colectivo»?", ["Un autobús urbano", "Un grupo musical", "Un taxi compartido en moto", "Un mercado"], "En Argentina, «colectivo» es el autobús de línea."],
    [1, "¿Qué es un «boleto» en varios países de América?", ["Un billete o entrada", "Un papel para anotar", "Un cheque", "Una multa"], "Boleto es el billete de transporte o la entrada a un espectáculo."],
    [1, "Si en Colombia algo es «chévere», ¿cómo es?", ["Estupendo, genial", "Muy caro", "Frágil", "Aburrido"], "Chévere se usa en Colombia, Venezuela, Perú, el Caribe y otros países con el sentido de estupendo."],
    [1, "En Argentina y Uruguay, ¿qué es un «pibe»?", ["Un chico joven", "Un tipo de pan", "Un perro", "Un coche pequeño"], "Pibe es el chaval o muchacho en el Río de la Plata."],
    [1, "En México y Perú, ¿qué es la «chamba»?", ["El trabajo", "La fiesta", "La comida", "Una moneda"], "Chamba es un modo coloquial de decir trabajo."],
    [1, "¿Qué es un «durazno»?", ["Un melocotón", "Una pera", "Un aguacate pequeño", "Una mandarina"], "Durazno es el melocotón en gran parte de América."],
    [2, "En México, ¿qué es un «popote»?", ["Una pajita para beber", "Una pelota de playa", "Un tipo de sombrero", "Una calle estrecha"], "Popote es la pajita o caña para sorber bebidas en México."],
    [2, "En Argentina, ¿qué son los «pochoclos»?", ["Las palomitas de maíz", "Unos caramelos", "Unas galletas saladas", "Unos panecillos"], "Pochoclo es la palomita de maíz en Argentina y Paraguay."],
    [2, "¿Qué es una «frutilla» en Chile y Argentina?", ["Una fresa", "Una cereza pequeña", "Una uva", "Una frambuesa"], "Frutilla es la fresa en varios países sudamericanos."],
    [2, "En México, ¿qué es la «banqueta»?", ["La acera", "Un taburete", "Un mercado", "Una fiesta"], "En México «banqueta» es la acera; en España es un asiento pequeño."],
    [2, "En Chile y Ecuador, ¿qué es una «guagua»?", ["Un bebé", "Un autobús", "Un perro callejero", "Un insecto"], "En los Andes y Chile, guagua es un bebé; en Cuba y Canarias, en cambio, es un autobús."],
    [2, "En Cuba o en Canarias, ¿qué se toma al subir a una «guagua»?", ["El autobús", "Una barca", "Un taxi aéreo", "El tren"], "En el Caribe hispano y en Canarias, guagua es el autobús."],
    [3, "En Perú, Bolivia y Ecuador, una «chompa» es…", ["Una prenda de abrigo, un jersey", "Una moneda", "Un instrumento musical", "Un sombrero"], "Chompa es el jersey o chaqueta de punto en varios países andinos."],
    [3, "En Argentina, una «pollera» es…", ["Una falda", "Una granja de aves", "Un tipo de pan", "Un sombrero"], "En varios países de América del Sur «pollera» es la falda."],
    [3, "En Venezuela, las «cotufas» son…", ["Las palomitas de maíz", "Unas galletas", "Unos zapatos", "Unas frutas"], "Cotufa es la palomita de maíz en Venezuela."],
    [3, "En Colombia y Ecuador, un «esfero» es…", ["Un bolígrafo", "Un balón", "Una esfera de cristal", "Un lápiz de colores"], "Esfero es el bolígrafo en Colombia y Ecuador."],
    [3, "En México, a alguien «fresa» se le considera…", ["Presumido o de clase acomodada", "Muy dulce", "Muy rojo", "Muy joven"], "En México, «fresa» designa a una persona pija o presumida."],
    [3, "En Venezuela y Ecuador, un «pana» es…", ["Un amigo", "Un tipo de tela", "Un coche", "Una comida"], "Pana es un amigo o colega en varios países de América."]].map(function (x) { return { n: x[0], t: x[1], o: x[2], c: 0, e: x[3] }; });
  TT.quiz({
    intro: 'Veinticuatro palabras que cambian de significado según el país. Del español que se entiende en todas partes al más regional. Se corrige al momento y cada explicación dice dónde se usa.',
    titulo: 'Tu español internacional',
    niveles: NIVELES,
    resultados: RESULTADOS,
    preguntas: P,
    copia: 'En el test internacional de español me ha salido:'
  });
})();
