/* Convierte tablas de texto (CSV) en un libro de Excel (.xlsx) sin dependencias. Se carga con TH.script('lib/excel.js') y queda en TH.excel:
   TH.excel.detectarSeparador(texto)               → ',' | ';' | '\t' | '|'
   TH.excel.analizarCsv(texto, sep)                → { filas: [[texto]] } o { error }   (comillas dobles, saltos de línea dentro de campos, RFC 4180)
   TH.excel.tipoDeNumeros(filas)                   → 'punto' | 'coma'   (cómo escriben los decimales los datos: 3.14 o 3,14)
   TH.excel.celda(texto, { numeros: 'punto' | 'coma' | 'texto', fechas: true|false }) → { t: 's' | 'n' | 'd' | 'f', v }   tipo de la celda: texto, número, fecha o fecha con hora (v = número de serie de Excel)
   TH.excel.libro(hojas, { cabecera, numeros, fechas }) → { archivos: { 'ruta/dentro/del/zip': 'contenido XML' }, avisos: [texto] }
       hojas: [{ nombre, filas: [[texto]] }]. Los textos se guardan siempre como texto (nunca como fórmula): un valor que empiece por = + - @ no se evalúa.
   TH.excel.nombreHoja(nombre, usados)             → nombre válido de hoja (≤ 31 caracteres, sin []:*?/\ y sin repetir)
   TH.excel.referencia(columna, fila)              → 'A1' (columna y fila desde 0 y 1)
   Se verifica en pruebas/test_excel_lib.py (los libros se abren con openpyxl). */
(function (global) {
  'use strict';
  var MAX_FILAS = 1048576, MAX_COLS = 16384, MAX_TEXTO = 32767, NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  function detectarSeparador(t) {
    var SEPS = [',', ';', '\t', '|'], linea = '', q = false, k, c;
    for (k = 0; k < t.length; k++) { c = t.charAt(k); if (c === '"') q = !q; if (!q && (c === '\n' || c === '\r')) { if (linea.trim()) break; linea = ''; continue; } linea += c; }
    var mejor = ',', max = 0;
    SEPS.forEach(function (s) { var n = 0, qq = false, i; for (i = 0; i < linea.length; i++) { var x = linea.charAt(i); if (x === '"') qq = !qq; else if (!qq && x === s) n++; } if (n > max) { max = n; mejor = s; } });
    return mejor;
  }
  function analizarCsv(t, sep) {
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
    var filas = [], fila = [], campo = '', k = 0, n = t.length, entre = false, linea = 1, desde = 1, c;
    while (k < n) {
      c = t.charAt(k);
      if (entre) {
        if (c === '"') { if (t.charAt(k + 1) === '"') { campo += '"'; k += 2; continue; } entre = false; k++; continue; }
        if (c === '\n') linea++;
        campo += c; k++; continue;
      }
      if (c === '"' && campo === '') { entre = true; desde = linea; k++; continue; }
      if (c === sep) { fila.push(campo); campo = ''; k++; continue; }
      if (c === '\r' || c === '\n') {
        if (c === '\r' && t.charAt(k + 1) === '\n') k++;
        k++; linea++; fila.push(campo); campo = '';
        if (!(fila.length === 1 && fila[0] === '')) filas.push(fila);
        fila = []; continue;
      }
      campo += c; k++;
    }
    if (entre) return { error: 'Las comillas que se abren en la línea ' + desde + ' no se cierran. Cierra el campo con otra comilla doble.' };
    if (campo !== '' || fila.length) { fila.push(campo); if (!(fila.length === 1 && fila[0] === '')) filas.push(fila); }
    return { filas: filas };
  }

  var RE_COMA = /^[-+]?(\d{1,3}(\.\d{3})+|\d+),\d+$/, RE_PUNTO = /^[-+]?(\d{1,3}(,\d{3})+|\d+)\.\d+$/;
  function tipoDeNumeros(filas) {
    var coma = 0, punto = 0;
    filas.forEach(function (f) { f.forEach(function (c) { c = c.trim(); if (RE_COMA.test(c)) coma++; else if (RE_PUNTO.test(c)) punto++; }); });
    return coma > punto ? 'coma' : 'punto';
  }
  function serial(y, m, d, hh, mi, ss) {
    var f = new Date(Date.UTC(y, m - 1, d));
    if (f.getUTCFullYear() !== y || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
    if (y < 1900 || (y === 1900 && m < 3) || y > 9999) return null;                // Excel cuenta mal el febrero de 1900: se dejan como texto
    var dias = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
    return dias + (hh * 3600 + mi * 60 + ss) / 86400;
  }
  function celda(texto, op) {
    op = op || {};
    var s = String(texto), t = s.trim();
    if (t === '') return null;
    var numeros = op.numeros || 'punto';
    if (op.fechas !== false) {
      var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(t), y, mo, d, hh = 0, mi = 0, ss = 0, ok;
      if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; if (m[4] !== undefined) { hh = +m[4]; mi = +m[5]; ss = m[6] ? +m[6] : 0; } ok = true; }
      else {
        m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(t);
        if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; if (m[4] !== undefined) { hh = +m[4]; mi = +m[5]; ss = m[6] ? +m[6] : 0; } ok = true; }
      }
      if (ok && hh < 24 && mi < 60 && ss < 60) { var v = serial(y, mo, d, hh, mi, ss); if (v !== null) return { t: m[4] !== undefined ? 'f' : 'd', v: v }; }
    }
    if (numeros !== 'texto') {
      var x = null;
      if (/^[-+]?\d+$/.test(t)) { if (!/^[-+]?0\d/.test(t) && !/^\+/.test(t) && t.replace(/^[-+]/, '').length <= 15) x = t; }
      else if (numeros === 'coma' && RE_COMA.test(t)) x = t.replace(/\./g, '').replace(',', '.');
      else if (numeros === 'punto' && RE_PUNTO.test(t)) x = t.replace(/,/g, '');
      if (x !== null && !/^[-+]?0\d/.test(x) && isFinite(+x)) return { t: 'n', v: +x };
    }
    return { t: 's', v: s };
  }

  function referencia(col, fila) {
    var l = '', n = col + 1;
    while (n > 0) { var r = (n - 1) % 26; l = String.fromCharCode(65 + r) + l; n = Math.floor((n - 1) / 26); }
    return l + fila;
  }
  function esc(t) { return String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function nombreHoja(nombre, usados) {
    var base = String(nombre || '').replace(/[\[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^'+|'+$/g, '').slice(0, 31).trim() || 'Hoja', n = base, i = 2;
    function usado(x) { return usados.some(function (u) { return u.toLowerCase() === x.toLowerCase(); }); }
    while (usado(n)) { var suf = ' (' + i++ + ')'; n = base.slice(0, 31 - suf.length).trim() + suf; }
    return n;
  }
  function numTxt(v) { return String(+v.toPrecision(15)).replace(/e\+?/, 'E').replace(/E-/, 'E-'); }

  function hojaXml(filas, op, primera, avisos, nombre) {
    var cab = !!op.cabecera, nCols = 0, anchos = [], xml = [], r, c;
    filas.forEach(function (f) { if (f.length > nCols) nCols = f.length; });
    if (filas.length > MAX_FILAS) throw new Error('La hoja «' + nombre + '» tiene ' + filas.length.toLocaleString('es-ES') + ' filas y Excel admite como máximo ' + MAX_FILAS.toLocaleString('es-ES') + '.');
    if (nCols > MAX_COLS) throw new Error('La hoja «' + nombre + '» tiene ' + nCols + ' columnas y Excel admite como máximo ' + MAX_COLS + '.');
    var cortadas = 0;
    for (r = 0; r < filas.length; r++) {
      var celdas = [], f = filas[r], x, ref;
      for (c = 0; c < f.length; c++) {
        x = celda(f[c], op); if (!x) continue;
        ref = referencia(c, r + 1);
        var largo;
        if (cab && r === 0) { x = { t: 's', v: String(f[c]) }; }
        if (x.t === 'n') { celdas.push('<c r="' + ref + '"><v>' + numTxt(x.v) + '</v></c>'); largo = numTxt(x.v).length; }
        else if (x.t === 'd' || x.t === 'f') { celdas.push('<c r="' + ref + '" s="' + (x.t === 'd' ? 2 : 3) + '"><v>' + String(+x.v.toFixed(10)) + '</v></c>'); largo = x.t === 'd' ? 10 : 16; }
        else {
          var s = x.v; if (s.length > MAX_TEXTO) { s = s.slice(0, MAX_TEXTO); cortadas++; }
          celdas.push('<c r="' + ref + '"' + (cab && r === 0 ? ' s="1"' : '') + ' t="inlineStr"><is><t xml:space="preserve">' + esc(s) + '</t></is></c>');
          largo = Math.max.apply(null, s.split('\n').map(function (l) { return l.length; })) + (cab && r === 0 ? 2 : 0);
        }
        if (!(anchos[c] >= largo)) anchos[c] = largo;
      }
      xml.push('<row r="' + (r + 1) + '">' + celdas.join('') + '</row>');
    }
    if (cortadas) avisos.push((cortadas === 1 ? 'Una celda de «' : cortadas + ' celdas de «') + nombre + '» superaban los ' + MAX_TEXTO.toLocaleString('es-ES') + ' caracteres que admite Excel y se han recortado.');
    var vistas = '<sheetViews><sheetView workbookViewId="0"' + (primera ? ' tabSelected="1"' : '') + '>' + (cab && filas.length > 1 ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/>' : '') + '</sheetView></sheetViews>';
    var cols = '';
    if (nCols) { cols = '<cols>'; for (c = 0; c < nCols; c++) cols += '<col min="' + (c + 1) + '" max="' + (c + 1) + '" width="' + Math.min(60, Math.max(8, (anchos[c] || 0) + 2)) + '" customWidth="1"/>'; cols += '</cols>'; }
    var filtro = cab && filas.length > 1 && nCols ? '<autoFilter ref="A1:' + referencia(nCols - 1, filas.length) + '"/>' : '';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="' + NS + '">' + vistas + '<sheetFormatPr defaultRowHeight="15"/>' + cols + '<sheetData>' + xml.join('') + '</sheetData>' + filtro + '</worksheet>';
  }

  var ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="' + NS + '"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy\\ hh:mm"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function libro(hojas, op) {
    op = op || {};
    if (!hojas.length) throw new Error('No hay ninguna tabla que convertir.');
    var avisos = [], archivos = {}, usados = [], nombres = [], ops = Object.assign({}, op);
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
    var libroX = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="' + NS + '" xmlns:r="' + REL + '"><sheets>', rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    hojas.forEach(function (h, i) {
      var nombre = nombreHoja(h.nombre, usados); usados.push(nombre); nombres.push(nombre);
      var o = Object.assign({}, ops); if (hojas.length > 0 && !o.numeros) o.numeros = 'punto';
      archivos['xl/worksheets/sheet' + (i + 1) + '.xml'] = hojaXml(h.filas, o, i === 0, avisos, nombre);
      ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      libroX += '<sheet name="' + esc(nombre).replace(/"/g, '&quot;') + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      rels += '<Relationship Id="rId' + (i + 1) + '" Type="' + REL + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
    });
    rels += '<Relationship Id="rId' + (hojas.length + 1) + '" Type="' + REL + '/styles" Target="styles.xml"/></Relationships>';
    ct += '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    archivos['[Content_Types].xml'] = ct;
    archivos['_rels/.rels'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + REL + '/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    archivos['xl/workbook.xml'] = libroX + '</sheets></workbook>';
    archivos['xl/_rels/workbook.xml.rels'] = rels;
    archivos['xl/styles.xml'] = ESTILOS;
    return { archivos: archivos, avisos: avisos, nombres: nombres };
  }

  var API = { detectarSeparador: detectarSeparador, analizarCsv: analizarCsv, tipoDeNumeros: tipoDeNumeros, celda: celda, libro: libro, nombreHoja: nombreHoja, referencia: referencia };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else { global.TH = global.TH || {}; global.TH.excel = API; }
})(typeof window !== 'undefined' ? window : globalThis);
