(function () {
  'use strict';
  TH.alCargar(function (raiz) {
    TH.conversor(raiz, {
      unidades: [
        { id: "j", n: "Julio", s: "J", f: 1 },
        { id: "kj", n: "Kilojulio", s: "kJ", f: 1000 },
        { id: "cal", n: "Caloría", s: "cal", f: 4.184 },
        { id: "kcal", n: "Kilocaloría", s: "kcal", f: 4184 },
        { id: "wh", n: "Vatio hora", s: "Wh", f: 3600 },
        { id: "kwh", n: "Kilovatio hora", s: "kWh", f: 3600000.0 },
        { id: "btu", n: "BTU", s: "BTU", f: 1055.05585262 },
        { id: "ftlb", n: "Pie-libra fuerza", s: "ft·lbf", f: 1.3558179483314003 },
        { id: "ev", n: "Electronvoltio", s: "eV", f: 1.602176634e-19 }
      ],
      de: "kcal", a: "kj", valor: 1
    });
  });
})();
