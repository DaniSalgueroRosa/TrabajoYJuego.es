// Pequeño cliente del protocolo de Chrome (CDP) sin dependencias: abre Chrome sin interfaz y permite navegar, ejecutar JS y sacar capturas.
// Solo para probar el sitio en local; no forma parte de lo que se publica.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* Busca Chrome o Chromium: usa la variable CHROME si existe y, si no, las rutas habituales de Linux, macOS y Windows. */
export function encontrarChrome() {
  const candidatos = [process.env.CHROME,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'];
  return candidatos.find(c => c && fs.existsSync(c)) || null;
}

export async function abrirChrome(puerto = 9333, extra = []) {
  const chrome = encontrarChrome();
  if (!chrome) throw new Error('No encuentro Chrome ni Chromium. Instálalo o indica su ruta con la variable CHROME.');
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-perfil-'));
  const proc = spawn(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + puerto, '--user-data-dir=' + perfil, '--no-first-run', ...extra, 'about:blank',
  ], { stdio: 'ignore' });
  let info = null;
  for (let i = 0; i < 60 && !info; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + puerto + '/json');
      info = (await r.json()).find(t => t.type === 'page');
    } catch (e) { await new Promise(r => setTimeout(r, 150)); }
  }
  if (!info) throw new Error('Chrome no arrancó');
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let n = 0; const pend = new Map(); const eventos = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const { res, rej } = pend.get(d.id); pend.delete(d.id); d.error ? rej(new Error(d.error.message)) : res(d.result); }
    else if (d.method) eventos.push(d);
  };
  const enviar = (method, params = {}) => new Promise((res, rej) => { const id = ++n; pend.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
  await enviar('Page.enable'); await enviar('Runtime.enable'); await enviar('Log.enable');

  const api = {
    enviar, eventos,
    async vista(ancho, alto, esquema = 'light', movil = false) {
      await enviar('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil });
      await enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: esquema }] });
    },
    async ir(url, espera = 1600) {
      eventos.length = 0;
      await enviar('Page.navigate', { url });
      for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 100));
        const r = await enviar('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        if (r.result.value === 'complete') break;
      }
      await new Promise(r => setTimeout(r, espera));
    },
    async js(expresion) {
      const r = await enviar('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('JS: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async captura(ruta, completa = true) {
      let params = { format: 'png' };
      if (completa) {
        const m = await enviar('Page.getLayoutMetrics');
        const w = Math.ceil(m.cssContentSize.width), h = Math.min(Math.ceil(m.cssContentSize.height), 9000);
        params = { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } };
      }
      const r = await enviar('Page.captureScreenshot', params);
      fs.writeFileSync(ruta, Buffer.from(r.data, 'base64'));
    },
    consola() {
      return eventos.filter(e => e.method === 'Runtime.consoleAPICalled' || e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level)))
        .map(e => e.method === 'Log.entryAdded' ? e.params.entry.level + ': ' + e.params.entry.text + ' ' + (e.params.entry.url || '') : e.method === 'Runtime.exceptionThrown' ? 'EXCEPCIÓN: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text) : 'consola.' + e.params.type + ': ' + e.params.args.map(a => a.value ?? a.description).join(' '));
    },
    async cerrar() { try { ws.close(); } catch (e) {} proc.kill('SIGKILL'); await new Promise(r => setTimeout(r, 300)); try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5 }); } catch (e) {} },
  };
  return api;
}
