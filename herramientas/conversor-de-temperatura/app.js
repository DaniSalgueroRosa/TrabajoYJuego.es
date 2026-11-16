(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: 'c', n: 'Grado Celsius', s: '°C', a: function (x) { return x; }, de: function (b) { return b; } },
        { id: 'f', n: 'Grado Fahrenheit', s: '°F', a: function (x) { return (x - 32) * 5 / 9; }, de: function (b) { return b * 9 / 5 + 32; } },
        { id: 'k', n: 'Kelvin', s: 'K', a: function (x) { return x - 273.15; }, de: function (b) { return b + 273.15; } },
        { id: 'r', n: 'Grado Rankine', s: '°R', a: function (x) { return x * 5 / 9 - 273.15; }, de: function (b) { return (b + 273.15) * 9 / 5; } }
      ],
      de: "c", a: "f", valor: 20,
      valida: function (b) { return b >= -273.15 - 1e-9; },
      mensajeInvalido: 'Esa temperatura es inferior al cero absoluto (−273,15 °C, 0 K), que no se puede alcanzar.'
    });
  });
})();
