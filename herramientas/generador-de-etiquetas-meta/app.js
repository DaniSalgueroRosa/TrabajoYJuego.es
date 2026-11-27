(function(){
'use strict';
TH.alCargar(function(raiz){
var IDIOMAS =[["es_ES","Español (España)"],["es_MX","Español (México)"],["es_AR","Español (Argentina)"],["es_CO","Español (Colombia)"],["ca_ES","Catalán"],["gl_ES","Gallego"],["eu_ES","Euskera"],["en_GB","Inglés (Reino Unido)"],["en_US","Inglés (EE. UU.)"],["fr_FR","Francés"],["pt_PT","Portugués (Portugal)"],["pt_BR","Portugués (Brasil)"],["it_IT","Italiano"],["de_DE","Alemán"]],ROBOTS =[["","Sin etiqueta (se puede indexar)"],["index, follow","index, follow (explícito)"],["noindex, follow","noindex, follow (no indexar, seguir enlaces)"],["noindex, nofollow","noindex, nofollow (ni indexar ni seguir)"]],EJ ={"titulo": "Calculadora del IVA online | Ejemplo S. L.","url": "https://www.ejemplo.es/herramientas/calculadora-del-iva","imagen": "https://www.ejemplo.es/img/calculadora-iva.png","sitio": "Ejemplo S. L.","usuario": "@ejemplosl","descripcion": "Calcula el IVA de cualquier importe: añade o quita el 21 %, el 10 % o el 4 % y obtén la base imponible y el total al momento, sin registrarte."};
function norm(t){return String(t).replace(/\s+/g,' ').trim();}
function largo(t){return Array.from(t).length;}
function escTexto(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(t){return escTexto(t).replace(/"/g,'&quot;');}
function meta(clase,nombre,valor){return '<meta ' + clase + '="' + nombre + '" content="' + escAttr(valor)+ '">';}
function direccion(t){try{var u = new URL(t);return u.protocol === 'https:' || u.protocol === 'http:';}catch(e){return false;}}
TH.texto(raiz,{
entrada:{etiqueta: 'Descripción de la página (meta description)',ph: 'Resume en una o dos frases lo que encontrará quien entre…'},
salida:{etiqueta: 'Etiquetas para el <head>'},
filas: 11,
opciones:[
{id: 'titulo',tipo: 'texto',etiqueta: 'Título de la página',ph: 'Título que verán en Google',ancho: 'completo'},
{id: 'url',tipo: 'texto',etiqueta: 'Dirección canónica (opcional)',ph: 'https://www.ejemplo.es/mi-pagina',ancho: 'completo'},
{id: 'imagen',tipo: 'texto',etiqueta: 'Imagen para compartir (opcional)',ph: 'https://www.ejemplo.es/imagen.jpg',ancho: 'completo'},
{id: 'sitio',tipo: 'texto',etiqueta: 'Nombre del sitio (opcional)',ph: 'Mi sitio web'},
{id: 'usuario',tipo: 'texto',etiqueta: 'Usuario en X (opcional)',ph: '@tuusuario'},
{id: 'idioma',tipo: 'select',etiqueta: 'Idioma de la página',valor: 'es_ES',opciones: IDIOMAS},
{id: 'robots',tipo: 'select',etiqueta: 'Indexación (robots)',valor: '',opciones: ROBOTS},
{id: 'tipo',tipo: 'select',etiqueta: 'Tipo de contenido (Open Graph)',valor: 'website',opciones:[['website','Página web'],['article','Artículo']]},
{id: 'tarjeta',tipo: 'select',etiqueta: 'Tarjeta de X',valor: 'summary_large_image',opciones:[['summary_large_image','Con imagen grande'],['summary','Pequeña']]}
],
botones:[{texto: 'Rellenar con un ejemplo',accion: function(api){
['titulo','url','imagen','sitio','usuario'].forEach(function(k){raiz.querySelector('#c-' + k).value = EJ[k];});
api.entrada.value = EJ.descripcion;api.actualizar();
}}],
procesar: function(desc,op){
var titulo = norm(op.titulo),d = norm(desc),url = op.url.trim(),img = op.imagen.trim(),sitio = norm(op.sitio),user = op.usuario.trim();
if(!titulo && !d && !url && !img && !sitio && !user)return{salida: ''};
if(!titulo)return{salida: '',avisos:['Escribe el título de la página: es la etiqueta más importante.']};
if(url && !direccion(url))return{salida: '',avisos:['La dirección canónica debe ser una dirección completa que empiece por https:// o http://.']};
if(img && !direccion(img))return{salida: '',avisos:['La imagen debe ser una dirección completa que empiece por https:// o http://.']};
if(user && !/^@?[A-Za-z0-9_]{1,15}$/.test(user))return{salida: '',avisos:['El usuario de X tiene hasta 15 caracteres: letras sin tilde, cifras y guion bajo, con o sin @ delante.']};
var L =['<title>' + escTexto(titulo)+ '</title>'];
if(d)L.push(meta('name','description',d));
if(url)L.push('<link rel="canonical" href="' + escAttr(url)+ '">');
if(op.robots)L.push(meta('name','robots',op.robots));
L.push(meta('property','og:type',op.tipo),meta('property','og:title',titulo));
if(d)L.push(meta('property','og:description',d));
if(url)L.push(meta('property','og:url',url));
if(img)L.push(meta('property','og:image',img));
if(sitio)L.push(meta('property','og:site_name',sitio));
L.push(meta('property','og:locale',op.idioma),meta('name','twitter:card',op.tarjeta));
if(user)L.push(meta('name','twitter:site','@' + user.replace(/^@/,'')));
var avisos =[],nt = largo(titulo),nd = largo(d);
if(nt > 60)avisos.push('El título tiene ' + nt + ' caracteres. Por encima de unos 60 suele cortarse en los resultados de búsqueda.');
if(!d)avisos.push('No has escrito descripción: sin ella, el buscador elegirá un fragmento del contenido de la página.');
else if(nd > 160)avisos.push('La descripción tiene ' + nd + ' caracteres. Por encima de unos 160 suele cortarse en los resultados de búsqueda.');
else if(nd < 70)avisos.push('La descripción es corta (' + nd + ' caracteres). Entre 70 y 160 suele aprovechar bien el espacio.');
if(op.tarjeta === 'summary_large_image' && !img)avisos.push('La tarjeta grande de X necesita una imagen: añade su dirección o elige la tarjeta pequeña.');
return{salida: L.join('\n'),avisos: avisos,filas:[TH.fila('etiquetas','Etiquetas generadas',L.length,'n0'),TH.fila('titulo-largo','Caracteres del título',nt,'n0'),TH.fila('descripcion-largo','Caracteres de la descripción',nd,'n0')]};
}
});
});
})();
