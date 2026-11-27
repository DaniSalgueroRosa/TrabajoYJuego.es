(function(){
'use strict';
TH.alCargar(function(raiz){
TH.conversor(raiz,{
unidades:[
{id: "ml",n: "Mililitro",s: "ml",f: 0.001},
{id: "cl",n: "Centilitro",s: "cl",f: 0.01},
{id: "dl",n: "Decilitro",s: "dl",f: 0.1},
{id: "l",n: "Litro",s: "l",f: 1},
{id: "m3",n: "Metro cúbico",s: "m³",f: 1000},
{id: "cm3",n: "Centímetro cúbico",s: "cm³",f: 0.001},
{id: "galus",n: "Galón (EE. UU.)",s: "gal US",f: 3.785411784},
{id: "ctous",n: "Cuarto de galón (EE. UU.)",s: "qt US",f: 0.946352946},
{id: "pintus",n: "Pinta (EE. UU.)",s: "pt US",f: 0.473176473},
{id: "tazaus",n: "Taza (EE. UU.)",s: "taza US",f: 0.2365882365},
{id: "flozus",n: "Onza líquida (EE. UU.)",s: "fl oz US",f: 0.0295735295625},
{id: "tbsp",n: "Cucharada (EE. UU.)",s: "cda",f: 0.01478676478125},
{id: "tsp",n: "Cucharadita (EE. UU.)",s: "cdta",f: 0.00492892159375},
{id: "galuk",n: "Galón (Reino Unido)",s: "gal UK",f: 4.54609},
{id: "pintuk",n: "Pinta (Reino Unido)",s: "pt UK",f: 0.56826125}
],
de: "l",a: "galus",valor: 1
});
});
})();
