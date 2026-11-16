// Ayudas comunes de las pruebas de las herramientas.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export async function capturar(c, nombre, completa = true) {
  const dir = process.env.CAPTURAS;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  await c.captura(`${dir}/${nombre}.png`, completa);
}

export function preparar(c) {
  const fallos = [];
  const ok = (cond, t) => { console.log((cond ? '  ✓ ' : '  ✗ ') + t); if (!cond) fallos.push(t); };
  const esperar = (ms) => new Promise(r => setTimeout(r, ms));
  const q = (sel) => JSON.stringify(sel);
  const ayudas = {
    fallos, ok, esperar,
    /* Escribe en un campo como lo haría una persona: lo enfoca, selecciona todo y teclea. */
    async escribir(sel, texto) {
      await c.js(`(() => { const e = document.querySelector(${q(sel)}); if (!e) throw new Error('No existe ' + ${q(sel)}); e.focus(); if (e.select) e.select(); })()`);
      if (texto === '') await c.enviar('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 }), await c.enviar('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
      else await c.enviar('Input.insertText', { text: String(texto) });
      await esperar(60);
    },
    async elegir(sel, valor) {
      await c.js(`(() => { const e = document.querySelector(${q(sel)}); e.value = ${q(String(valor))}; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
      await esperar(60);
    },
    async marcar(sel, v) { await c.js(`(() => { const e = document.querySelector(${q(sel)}); if (e.checked !== ${!!v}) e.click(); })()`); await esperar(60); },
    async clic(t) { const r = await c.js(`(() => { const b = [...document.querySelectorAll('button, a.boton, label.boton')].find(b => (b.textContent.trim() === ${q(t)} || b.getAttribute('aria-label') === ${q(t)}) && !b.disabled); if (!b) return false; b.click(); return true; })()`); await esperar(80); return r; },
    texto: (sel) => c.js(`document.querySelector(${q(sel)})?.innerText || ''`),
    valor: (sel) => c.js(`document.querySelector(${q(sel)})?.value ?? null`),
    /* Resultado crudo (data-v) o mostrado, según se pida */
    k: (k) => c.js(`document.querySelector('[data-k=${JSON.stringify(k).slice(1, -1)}]')?.dataset.v ?? null`),
    kt: (k) => c.js(`document.querySelector('[data-k=${JSON.stringify(k).slice(1, -1)}]')?.innerText ?? null`),
    hastaQue: async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await esperar(50); } return false; },
  };
  /* ---- Archivos de prueba creados DENTRO de la página (con las mismas librerías que usa el sitio) y entregados al campo de archivos */
  ayudas.subir = async (sel, specs) => {
    await c.js(`(async () => {
      const P = await TH.pdfLib();
      const crear = async (s) => {
        if (s.t === 'b64') { const bin = atob(s.b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new File([u], s.nombre, { type: s.mime || '' }); }
        if (s.t === 'imagen') {
          const cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h; const g = cv.getContext('2d');
          if (s.mime === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, s.w, s.h); }
          if (s.ruido) { const im = g.createImageData(s.w, s.h); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = Math.random() * 255; im.data[i + 1] = Math.random() * 255; im.data[i + 2] = Math.random() * 255; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }
          else { g.fillStyle = s.color || '#c0392b'; g.fillRect(0, 0, s.w / 2, s.h); g.fillStyle = s.color2 || '#2980b9'; g.fillRect(s.w / 2, 0, s.w / 2, s.h / 2); }
          const b = await new Promise(r => cv.toBlob(r, s.mime || 'image/png', 0.92)); return new File([b], s.nombre, { type: s.mime || 'image/png' });
        }
        const d = await P.PDFDocument.create(); const f = await d.embedFont(P.StandardFonts.Helvetica); const fb = await d.embedFont(P.StandardFonts.HelveticaBold);
        if (s.t === 'pdfImagen') {
          const cv = document.createElement('canvas'); cv.width = s.w; cv.height = s.h; const g = cv.getContext('2d'); const im = g.createImageData(s.w, s.h);
          for (let i = 0; i < im.data.length; i += 4) { im.data[i] = Math.random() * 255; im.data[i + 1] = Math.random() * 255; im.data[i + 2] = Math.random() * 255; im.data[i + 3] = 255; }
          g.putImageData(im, 0, 0);
          const b = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.95)); const img = await d.embedJpg(await b.arrayBuffer());
          for (let i = 0; i < (s.paginas || 1); i++) { const p = d.addPage([600, 600]); p.drawImage(img, { x: 0, y: 0, width: 600, height: 600 }); }
        } else if (s.t === 'pdfSolo-imagen') {
          const cv = document.createElement('canvas'); cv.width = 300; cv.height = 300; const g = cv.getContext('2d'); g.fillStyle = '#336'; g.fillRect(0, 0, 300, 300);
          const b = await new Promise(r => cv.toBlob(r, 'image/png')); const img = await d.embedPng(await b.arrayBuffer()); const p = d.addPage([300, 300]); p.drawImage(img, { x: 0, y: 0, width: 300, height: 300 });
        } else if (s.t === 'pdfDiseno') {
          for (const pagina of s.paginas) { const p = d.addPage([595, 842]); for (const b of pagina) p.drawText(b.t, { x: b.x || 50, y: b.y, size: b.size || 11, font: b.neg ? fb : f }); }
        } else {
          for (let i = 0; i < s.paginas; i++) { const p = d.addPage([s.ancho || 300, s.alto || 400]); p.drawText((s.prefijo || 'Doc') + ' pagina ' + (i + 1), { x: 30, y: 340, size: 22, font: f }); }
        }
        return new File([await d.save()], s.nombre, { type: 'application/pdf' });
      };
      const dt = new DataTransfer();
      for (const s of ${JSON.stringify(specs)}) dt.items.add(await crear(s));
      const e = document.querySelector(${JSON.stringify(sel)}); e.files = dt.files; e.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await esperar(250);
  };
  /* Lo que la herramienta ha dejado listo para descargar, como Buffers de Node */
  ayudas.entregas = async () => {
    const lista = await c.js(`(async () => { const out = []; for (const e of (TH.entregas || [])) { const u = new Uint8Array(await e.blob.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); out.push({ nombre: e.nombre, mime: e.blob.type, b64: btoa(s) }); } return out; })()`);
    return lista.map(e => ({ nombre: e.nombre, mime: e.mime, buf: Buffer.from(e.b64, 'base64') }));
  };
  ayudas.reiniciarEntregas = () => c.js(`TH.entregas = null`);
  ayudas.esperarEntregas = async (ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await c.js(`!!(TH.entregas && TH.entregas.length)`)) return true; await esperar(80); } return false; };
  ayudas.estadoTexto = () => c.js(`document.querySelector('.herr-estado:not([hidden])')?.innerText || ''`);
  /* Herramientas externas para comprobar los archivos desde fuera del navegador */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tyj-herr-'));
  let n = 0;
  const guardar = (buf, ext) => { const f = path.join(tmp, 'a' + (++n) + ext); fs.writeFileSync(f, buf); return f; };
  ayudas.ext = {
    guardar,
    pdftotext: (buf) => execFileSync('pdftotext', ['-layout', guardar(buf, '.pdf'), '-'], { encoding: 'utf8' }),
    pdfinfo: (buf) => execFileSync('pdfinfo', [guardar(buf, '.pdf')], { encoding: 'utf8' }),
    paginas: (buf) => +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [guardar(buf, '.pdf')], { encoding: 'utf8' }))[1],
    qpdfValido: (buf) => { try { execFileSync('qpdf', ['--check', guardar(buf, '.pdf')], { stdio: 'pipe' }); return true; } catch (e) { return false; } },
    python: (codigo, ...args) => execFileSync('python3', ['-c', codigo, ...args], { encoding: 'utf8' }),
    limpiar: () => fs.rmSync(tmp, { recursive: true, force: true }),
  };
  return ayudas;
}
