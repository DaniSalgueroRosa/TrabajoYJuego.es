(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "mm2", n: "Milímetro cuadrado", s: "mm²", f: 1e-06 },
        { id: "cm2", n: "Centímetro cuadrado", s: "cm²", f: 0.0001 },
        { id: "m2", n: "Metro cuadrado", s: "m²", f: 1 },
        { id: "ha", n: "Hectárea", s: "ha", f: 10000 },
        { id: "km2", n: "Kilómetro cuadrado", s: "km²", f: 1000000.0 },
        { id: "in2", n: "Pulgada cuadrada", s: "in²", f: 0.00064516 },
        { id: "ft2", n: "Pie cuadrado", s: "ft²", f: 0.09290304 },
        { id: "yd2", n: "Yarda cuadrada", s: "yd²", f: 0.83612736 },
        { id: "ac", n: "Acre", s: "ac", f: 4046.8564224 },
        { id: "mi2", n: "Milla cuadrada", s: "mi²", f: 2589988.110336 }
      ],
      de: "ha", a: "ac", valor: 1
    });
  });
})();
