/* =========================================================
   FP Cuenta · compartido/datos.js
   Funciones para consultar los datos de las comunidades (window.FP_DATA).
   Cada comunidad se registra sola desde su carpeta (comunidades/<comunidad>/datos.js):
     FP_DATA.comunidades          lista de comunidades (nombre, porcentaje de faltas, fuentes…)
     FP_DATA.ciclos[<comunidad>]  ciclos de esa comunidad
     FP_DATA.modulos[<comunidad>][<ciclo>]  { trimestres, modulos: { "1": [[nombre, horas]], "2": [...] } }
   Este archivo va después de los de las comunidades.
   ========================================================= */
(function () {
  'use strict';
  var D = (window.FP_DATA = window.FP_DATA || {});
  D.comunidades = D.comunidades || [];
  D.ciclos = D.ciclos || {};
  D.modulos = D.modulos || {};

  // Comunidad por id (o null)
  D.comunidad = function (id) {
    for (var i = 0; i < D.comunidades.length; i++) if (D.comunidades[i].id === id) return D.comunidades[i];
    return null;
  };

  // Ciclos de una comunidad
  D.ciclosDe = function (comunidadId) {
    return (comunidadId && D.ciclos[comunidadId]) || [];
  };

  // Ciclo de una comunidad por id (o null)
  D.cicloDe = function (comunidadId, cicloId) {
    var list = D.ciclosDe(comunidadId);
    for (var i = 0; i < list.length; i++) if (list[i].id === cicloId) return list[i];
    return null;
  };

  // Datos de los módulos de un ciclo en una comunidad: { trimestres, modulos } o null
  D.modulosDe = function (comunidadId, cicloId) {
    var m = D.modulos[comunidadId];
    return (m && m[cicloId]) || null;
  };

  // Todos los ciclos de todas las comunidades, sin repetir ids (para páginas que no piden la comunidad)
  D.todosLosCiclos = function () {
    var seen = {}, out = [];
    D.comunidades.forEach(function (c) {
      D.ciclosDe(c.id).forEach(function (x) {
        if (!seen[x.id]) { seen[x.id] = true; out.push(x); }
      });
    });
    return out;
  };
})();
