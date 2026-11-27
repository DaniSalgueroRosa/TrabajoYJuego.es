(function(){
'use strict';
TH.alCargar(function(raiz){
TH.conversor(raiz,{
unidades:[
{id: "pa",n: "Pascal",s: "Pa",f: 1},
{id: "hpa",n: "Hectopascal",s: "hPa",f: 100},
{id: "kpa",n: "Kilopascal",s: "kPa",f: 1000},
{id: "mpa",n: "Megapascal",s: "MPa",f: 1000000.0},
{id: "bar",n: "Bar",s: "bar",f: 100000.0},
{id: "mbar",n: "Milibar",s: "mbar",f: 100},
{id: "atm",n: "Atmósfera estándar",s: "atm",f: 101325},
{id: "psi",n: "Libra por pulgada cuadrada",s: "psi",f: 6894.757293168361},
{id: "mmhg",n: "Milímetro de mercurio",s: "mmHg",f: 133.322387415},
{id: "torr",n: "Torr",s: "Torr",f: 133.32236842105263},
{id: "kgcm2",n: "Kilogramo-fuerza por cm²",s: "kgf/cm²",f: 98066.5}
],
de: "bar",a: "psi",valor: 1
});
});
})();
