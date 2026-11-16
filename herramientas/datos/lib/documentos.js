/* Lectura y escritura de documentos de texto (Word .docx y OpenDocument .odt) y dibujo de texto en PDF. Todo en el navegador, con JSZip y pdf-lib
   (que se cargan desde herramientas/datos/vendor/). Es una conversión de TEXTO: títulos, negritas, listas y tablas sencillas; no copia imágenes ni el diseño. */
(function (global) {
  'use strict';
  var TH = global.TH, D = TH.documentos = {};

  function xml(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); }

  /* ---- Crear un .docx. parrafos: [{ t: 'texto', h: 0|1|2|3, b: true, lista: true, salto: true }] */
  D.crearDocx = function (parrafos) {
    return TH.jszip().then(function (JSZip) {
      var z = new JSZip();
      z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
      z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      z.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
      var estilo = function (id, nombre, tam, neg) { return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + nombre + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr>' + (neg ? '<w:b/>' : '') + '<w:sz w:val="' + tam + '"/></w:rPr></w:style>'; };
      z.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' + estilo('Ttulo1', 'heading 1', 36, true) + estilo('Ttulo2', 'heading 2', 30, true) + estilo('Ttulo3', 'heading 3', 26, true) + '</w:styles>');
      var cuerpo = parrafos.map(function (p) {
        var pr = '';
        if (p.h) pr += '<w:pStyle w:val="Ttulo' + p.h + '"/>';
        if (p.salto) pr += '<w:pageBreakBefore/>';
        if (p.lista) pr += '<w:ind w:left="360" w:hanging="260"/>';
        var texto = (p.lista ? '• ' : '') + p.t;
        var runs = texto.split('\n').map(function (l, i) { return (i ? '<w:r><w:br/></w:r>' : '') + '<w:r>' + (p.b ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + xml(l) + '</w:t></w:r>'; }).join('');
        return '<w:p>' + (pr ? '<w:pPr>' + pr + '</w:pPr>' : '') + runs + '</w:p>';
      }).join('');
      z.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + cuerpo + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
      return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
    });
  };

  /* ---- Leer un .docx o un .odt → [{ t, h, b, lista }] */
  function textoNodo(n, ns) {
    var s = '';
    (function rec(x) {
      for (var c = x.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { if (ns === 'odt') s += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        var ln = c.localName;
        if (ln === 't' && ns === 'docx') s += c.textContent;
        else if (ln === 'tab' || (ns === 'odt' && ln === 'tab')) s += '\t';
        else if (ln === 'br' || ln === 'line-break') s += '\n';
        else if (ln === 's' && ns === 'odt') s += ' ';
        else if (ns === 'docx' && (ln === 'delText' || ln === 'instrText')) continue;
        else rec(c);
      }
    })(n);
    return s;
  }
  function leerDocx(zip) {
    var f = zip.file('word/document.xml');
    if (!f) throw new Error('Este archivo no parece un documento de Word (.docx).');
    return f.async('string').then(function (t) {
      var d = new DOMParser().parseFromString(t, 'application/xml');
      if (d.getElementsByTagName('parsererror').length) throw new Error('No se ha podido leer el contenido del documento.');
      var cuerpo = d.getElementsByTagNameNS('*', 'body')[0], out = [];
      function parrafo(p) {
        var texto = textoNodo(p, 'docx');
        var pPr = null; for (var c = p.firstChild; c; c = c.nextSibling) if (c.localName === 'pPr') pPr = c;
        var h = 0, lista = false;
        if (pPr) {
          [].forEach.call(pPr.getElementsByTagNameNS('*', 'pStyle'), function (e) { var v = (e.getAttribute('w:val') || e.getAttributeNS('*', 'val') || '').toLowerCase(); var m = /^(?:heading|t[ií]tulo|ttulo)\s?(\d)$/.exec(v); if (m) h = Math.min(3, +m[1]); else if (v === 'title' || v === 'ttulo') h = 1; else if (/list/.test(v)) lista = true; });
          if (pPr.getElementsByTagNameNS('*', 'numPr').length) lista = true;
        }
        var neg = false, runs = p.getElementsByTagNameNS('*', 'r');
        if (runs.length) { neg = [].every.call(runs, function (r) { return !textoNodo(r, 'docx').trim() || r.getElementsByTagNameNS('*', 'b').length > 0; }); }
        return { t: texto, h: h, lista: lista, b: neg && !h };
      }
      function recorrer(nodo) {
        for (var c = nodo.firstChild; c; c = c.nextSibling) {
          if (c.nodeType !== 1) continue;
          if (c.localName === 'p') out.push(parrafo(c));
          else if (c.localName === 'tbl') {
            [].forEach.call(c.getElementsByTagNameNS('*', 'tr'), function (tr) {
              var celdas = [].map.call(tr.getElementsByTagNameNS('*', 'tc'), function (tc) { return [].map.call(tc.getElementsByTagNameNS('*', 'p'), function (p) { return textoNodo(p, 'docx'); }).join(' ').trim(); });
              out.push({ t: celdas.join('  |  '), h: 0, lista: false, b: false });
            });
          } else if (c.localName === 'sdt' || c.localName === 'sdtContent') recorrer(c);
        }
      }
      recorrer(cuerpo);
      return out;
    });
  }
  function leerOdt(zip) {
    var f = zip.file('content.xml');
    if (!f) throw new Error('Este archivo no parece un documento de texto de OpenDocument (.odt).');
    return f.async('string').then(function (t) {
      var d = new DOMParser().parseFromString(t, 'application/xml'), out = [];
      var cuerpo = d.getElementsByTagNameNS('*', 'text')[0];
      (function rec(n, lista) {
        for (var c = n.firstChild; c; c = c.nextSibling) {
          if (c.nodeType !== 1) continue;
          if (c.localName === 'h') out.push({ t: textoNodo(c, 'odt'), h: Math.min(3, +c.getAttribute('text:outline-level') || 1), lista: false, b: false });
          else if (c.localName === 'p') out.push({ t: textoNodo(c, 'odt'), h: 0, lista: lista, b: false });
          else if (c.localName === 'list' || c.localName === 'list-item') rec(c, true);
          else if (c.localName === 'table') [].forEach.call(c.getElementsByTagNameNS('*', 'table-row'), function (tr) { out.push({ t: [].map.call(tr.getElementsByTagNameNS('*', 'table-cell'), function (x) { return textoNodo(x, 'odt').trim(); }).join('  |  '), h: 0, lista: false, b: false }); });
          else if (c.localName === 'section') rec(c, lista);
        }
      })(cuerpo, false);
      return out;
    });
  }
  D.leerDocumento = function (archivo) {
    return TH.leer(archivo, 'bytes').then(function (buf) {
      return TH.jszip().then(function (JSZip) { return JSZip.loadAsync(buf); }).then(function (zip) {
        return /\.odt$/i.test(archivo.name) || zip.file('content.xml') && !zip.file('word/document.xml') ? leerOdt(zip) : leerDocx(zip);
      }, function () { throw new Error('«' + archivo.name + '» no se puede abrir. Si es un .doc antiguo, guárdalo antes como .docx desde Word, LibreOffice o Google Docs.'); });
    });
  };

  /* ---- Dibujar parrafos en un PDF A4 con Helvetica. Los caracteres que Helvetica no admite se sustituyen por «?». */
  D.parrafosAPdf = function (parrafos, opciones) {
    opciones = opciones || {};
    return TH.pdfLib().then(function (P) {
      return P.PDFDocument.create().then(function (pdf) {
        return Promise.all([pdf.embedFont(P.StandardFonts.Helvetica), pdf.embedFont(P.StandardFonts.HelveticaBold)]).then(function (fs) {
          var normal = fs[0], neg = fs[1], W = 595.28, H = 841.89, M = 62, ancho = W - 2 * M, y, pag, sustituidos = 0;
          function nueva() { pag = pdf.addPage([W, H]); y = H - M; }
          function limpio(f, t) {
            var s = '';
            for (var ch of t.replace(/\t/g, '    ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[   ]/g, ' ')) {
              try { f.widthOfTextAtSize(ch, 10); s += ch; } catch (e) { s += '?'; sustituidos++; }
            }
            return s;
          }
          nueva();
          parrafos.forEach(function (p) {
            var tam = p.h === 1 ? 20 : p.h === 2 ? 16 : p.h === 3 ? 13 : 11, f = p.h || p.b ? neg : normal, sangria = p.lista ? 16 : 0, inter = tam * 1.35;
            var texto = limpio(f, (p.lista ? '• ' : '') + p.t);
            if (p.salto || (p.h && y < M + 90)) nueva();
            if (p.h) y -= tam * 0.5;
            texto.split('\n').forEach(function (linea) {
              var palabras = linea.split(' '), actual = '';
              var emitir = function (s) {
                if (y - tam < M) nueva();
                if (s.trim()) pag.drawText(s, { x: M + sangria, y: y - tam, size: tam, font: f, color: P.rgb(0.08, 0.1, 0.1) });
                y -= inter;
              };
              palabras.forEach(function (w) {
                var prueba = actual ? actual + ' ' + w : w;
                if (f.widthOfTextAtSize(prueba, tam) <= ancho - sangria || !actual) {
                  if (f.widthOfTextAtSize(prueba, tam) > ancho - sangria) {                   // una palabra más larga que la línea: se parte
                    var trozo = '';
                    for (var ch of prueba) { if (f.widthOfTextAtSize(trozo + ch, tam) > ancho - sangria) { emitir(trozo); trozo = ch; } else trozo += ch; }
                    actual = trozo;
                  } else actual = prueba;
                } else { emitir(actual); actual = w; }
              });
              emitir(actual);
            });
            y -= p.h ? tam * 0.3 : 4;
          });
          pdf.setCreator('TrabajoYJuego'); pdf.setProducer('TrabajoYJuego');
          return pdf.save().then(function (bytes) { return { blob: new Blob([bytes], { type: 'application/pdf' }), paginas: pdf.getPageCount(), sustituidos: sustituidos }; });
        });
      });
    });
  };

  /* ---- Extraer el texto de un PDF con PDF.js, página a página: [{ pagina, lineas: ['…'] }] */
  D.textoDePdf = function (buf, alProgreso) {
    return TH.pdfjs().then(function (pdfjs) {
      return pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, standardFontDataUrl: TH.url('herramientas/datos/vendor/standard_fonts/') }).promise.then(function (doc) {
        var paginas = [], n = doc.numPages;
        function una(i) {
          if (i > n) return paginas;
          return doc.getPage(i).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
            var items = tc.items.filter(function (it) { return it.str !== undefined; }).map(function (it) { return { s: it.str, x: it.transform[4], y: it.transform[5], h: Math.abs(it.transform[3]) || it.height || 10, w: it.width, eol: it.hasEOL }; });
            var lineas = [], tolerancia = 3;
            items.sort(function (a, b) { return Math.abs(b.y - a.y) > tolerancia ? b.y - a.y : a.x - b.x; });
            var actual = null;
            items.forEach(function (it) {
              if (!actual || Math.abs(actual.y - it.y) > tolerancia) { actual = { y: it.y, h: it.h, partes: [], x0: it.x }; lineas.push(actual); }
              var ult = actual.partes[actual.partes.length - 1];
              if (ult && it.x - (ult.x + ult.w) > it.h * 0.15 && !/^\s/.test(it.s) && !/\s$/.test(ult.s)) actual.partes.push({ s: ' ', x: ult.x + ult.w, w: 0 });
              actual.partes.push(it);
              if (it.h > actual.h) actual.h = it.h;
            });
            paginas.push({ pagina: i, lineas: lineas.map(function (l) { return { t: l.partes.map(function (p) { return p.s; }).join('').replace(/\s+$/, ''), y: l.y, h: l.h, x: l.x0 }; }).filter(function (l) { return l.t.trim(); }) });
            if (alProgreso) alProgreso(i, n);
            return una(i + 1);
          });
        }
        return una(1);
      });
    });
  };
})(window);
