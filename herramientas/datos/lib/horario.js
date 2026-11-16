/* Cálculos del generador de tablas de horarios. Se carga con TH.script('lib/horario.js') y queda en TH.horario:
   TH.horario.DIAS / DIAS_CORTOS                    → nombres de lunes (0) a domingo (6)
   TH.horario.aMinutos('08:30')                     → 510 (o null si no es una hora válida HH:MM)
   TH.horario.aHora(510)                            → '08:30'
   TH.horario.COLORES                               → [{ id, nombre, fondo, borde, texto }]  (texto oscuro sobre fondo claro: contraste ≥ 7:1)
   TH.horario.preparar(filas, { finde, gran })      → { dias:[{ indice, nombre, bloques:[…] }], desde, hasta, marcas, conflictos, avisos, usadas }
       filas: [{ actividad, lugar, inicio:'HH:MM', fin:'HH:MM', dias:[0..6], color:'azul' }]
       bloque: { n (fila, desde 1), actividad, lugar, ini, fin (minutos), color, carril, carriles, arriba, alto, izq, ancho (porcentajes) }
       Lunes a viernes se muestran siempre; sábado y domingo solo si alguna actividad los usa o si finde = true.
       desde/hasta: se redondean a la rejilla (gran minutos) y marcas = [{ min, etiqueta, hora (bool: es hora en punto) }].
   TH.horario.texto(prep, titulo)                   → el horario como texto, un día por bloque
   Se verifica en pruebas/test_horario_lib.py. */
(function (global) {
  'use strict';
  var DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  var COLORES = [
    { id: 'azul', nombre: 'Azul', fondo: '#CFE3FA', borde: '#5B8FD0', texto: '#14233A' },
    { id: 'verde', nombre: 'Verde', fondo: '#CDEBD3', borde: '#4FA566', texto: '#12281A' },
    { id: 'amarillo', nombre: 'Amarillo', fondo: '#FBEBB5', borde: '#C9A227', texto: '#2E2508' },
    { id: 'naranja', nombre: 'Naranja', fondo: '#FAD7B5', borde: '#D9803A', texto: '#33200B' },
    { id: 'rosa', nombre: 'Rosa', fondo: '#F7CFD9', borde: '#D0607E', texto: '#38121E' },
    { id: 'morado', nombre: 'Morado', fondo: '#E0D4F5', borde: '#8A66C8', texto: '#221338' },
    { id: 'turquesa', nombre: 'Turquesa', fondo: '#C6EBEA', borde: '#3A9E9B', texto: '#0E2B2A' },
    { id: 'gris', nombre: 'Gris', fondo: '#E3E6E5', borde: '#8A9490', texto: '#1C2220' }
  ];
  function aMinutos(t) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(t == null ? '' : t).trim());
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    return h < 24 && mi < 60 ? h * 60 + mi : null;
  }
  function aHora(min) { var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function color(id) { for (var i = 0; i < COLORES.length; i++) if (COLORES[i].id === id) return COLORES[i]; return COLORES[0]; }

  function preparar(filas, op) {
    op = op || {};
    var gran = op.gran === 15 || op.gran === 60 ? op.gran : 30, avisos = [], validas = [], conflictos = [], usadas = {}, i, j, k;
    filas.forEach(function (f, idx) {
      var n = idx + 1, a = String(f.actividad || '').trim(), lugar = String(f.lugar || '').trim(), ini = aMinutos(f.inicio), fin = aMinutos(f.fin), dias = (f.dias || []).filter(function (d) { return d >= 0 && d <= 6; });
      var vacia = !a && !lugar && !f.inicio && !f.fin && !dias.length;
      if (vacia) return;
      if (ini === null || fin === null) { avisos.push('La actividad ' + n + (a ? ' («' + a + '»)' : '') + ' no tiene hora de inicio y de fin: no se muestra.'); return; }
      if (fin <= ini) { avisos.push('La actividad ' + n + (a ? ' («' + a + '»)' : '') + ' termina a las ' + aHora(fin) + ', antes o a la misma hora en que empieza (' + aHora(ini) + '). Una actividad no puede pasar de un día a otro: no se muestra.'); return; }
      if (!dias.length) { avisos.push('La actividad ' + n + (a ? ' («' + a + '»)' : '') + ' no tiene ningún día marcado: no se muestra.'); return; }
      validas.push({ n: n, actividad: a || 'Sin nombre', lugar: lugar, ini: ini, fin: fin, dias: dias, color: f.color || 'azul' });
      dias.forEach(function (d) { usadas[d] = true; });
    });
    var visibles = [];
    for (i = 0; i < 7; i++) if (i < 5 || usadas[i] || op.finde) visibles.push(i);
    var minIni = 24 * 60, maxFin = 0;
    validas.forEach(function (v) { if (v.ini < minIni) minIni = v.ini; if (v.fin > maxFin) maxFin = v.fin; });
    var desde, hasta;
    if (validas.length) { desde = Math.floor(minIni / gran) * gran; hasta = Math.ceil(maxFin / gran) * gran; }
    else { desde = 8 * 60; hasta = 15 * 60; }
    if (hasta - desde < 60) hasta = desde + 60;
    if (hasta > 24 * 60) hasta = 24 * 60;
    var dias = visibles.map(function (d) { return { indice: d, nombre: DIAS[d], bloques: [] }; });
    var porDia = {};
    dias.forEach(function (d) { porDia[d.indice] = d; });
    validas.forEach(function (v) { v.dias.forEach(function (d) { porDia[d].bloques.push({ n: v.n, actividad: v.actividad, lugar: v.lugar, ini: v.ini, fin: v.fin, color: v.color }); }); });
    var total = hasta - desde;
    dias.forEach(function (d) {
      var bl = d.bloques.sort(function (a, b) { return a.ini - b.ini || b.fin - a.fin || a.n - b.n; });
      var grupo = [], finGrupo = -1, carrilesFin = [];
      function cerrar() { grupo.forEach(function (b) { b.carriles = carrilesFin.length; }); grupo = []; carrilesFin = []; finGrupo = -1; }
      bl.forEach(function (b) {
        if (grupo.length && b.ini >= finGrupo) cerrar();
        var c = -1;
        for (k = 0; k < carrilesFin.length; k++) if (carrilesFin[k] <= b.ini) { c = k; break; }
        if (c < 0) { c = carrilesFin.length; carrilesFin.push(0); }
        carrilesFin[c] = b.fin; b.carril = c; grupo.push(b); if (b.fin > finGrupo) finGrupo = b.fin;
      });
      cerrar();
      bl.forEach(function (b) { b.arriba = (b.ini - desde) / total * 100; b.alto = (b.fin - b.ini) / total * 100; b.ancho = 100 / b.carriles; b.izq = b.carril * b.ancho; });
      for (i = 0; i < bl.length; i++) for (j = i + 1; j < bl.length; j++) if (bl[i].ini < bl[j].fin && bl[j].ini < bl[i].fin) conflictos.push({ dia: d.nombre, a: bl[i], b: bl[j] });
    });
    var marcas = [];
    for (i = desde; i < hasta; i += gran) marcas.push({ min: i, etiqueta: aHora(i), hora: i % 60 === 0 });
    marcas.push({ min: hasta, etiqueta: aHora(hasta === 24 * 60 ? 23 * 60 + 59 : hasta), hora: hasta % 60 === 0, fin: true });
    conflictos.forEach(function (c) { avisos.push('El ' + c.dia.toLowerCase() + ' se solapan «' + c.a.actividad + '» (' + aHora(c.a.ini) + '–' + aHora(c.a.fin) + ') y «' + c.b.actividad + '» (' + aHora(c.b.ini) + '–' + aHora(c.b.fin) + ').'); });
    return { dias: dias, desde: desde, hasta: hasta, marcas: marcas, conflictos: conflictos, avisos: avisos, usadas: Object.keys(usadas).length, actividades: validas.length };
  }
  function texto(prep, titulo) {
    var out = [];
    if (titulo) out.push(titulo, '');
    prep.dias.forEach(function (d) {
      out.push(d.nombre);
      if (!d.bloques.length) out.push('  (sin actividades)');
      d.bloques.forEach(function (b) { out.push('  ' + aHora(b.ini) + '–' + aHora(b.fin) + '  ' + b.actividad + (b.lugar ? ' (' + b.lugar + ')' : '')); });
      out.push('');
    });
    return out.join('\n').replace(/\n+$/, '\n');
  }
  var API = { DIAS: DIAS, DIAS_CORTOS: DIAS_CORTOS, COLORES: COLORES, color: color, aMinutos: aMinutos, aHora: aHora, preparar: preparar, texto: texto };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else { global.TH = global.TH || {}; global.TH.horario = API; }
})(typeof window !== 'undefined' ? window : globalThis);
