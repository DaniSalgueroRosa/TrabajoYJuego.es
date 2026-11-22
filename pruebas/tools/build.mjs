#!/usr/bin/env node
/*
  Genera las páginas HTML de la raíz a partir de:
    - src/shell.html       estructura común (cabecera, barra lateral, pie, barra de estado)
    - src/pages/*.html     contenido de cada página, con sus datos arriba entre líneas "---"
    - site.config.json     datos legales, ID de AdSense y estado de borrador

  Uso (hace falta Node 18 o superior, sin instalar nada):
    node tools/build.mjs

  También regenera sitemap.xml, robots.txt y ads.txt.
*/
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const write = (p, s) => {
  mkdirSync(dirname(join(root, p)), { recursive: true });
  writeFileSync(join(root, p), s);
};

const cfg = JSON.parse(read('site.config.json'));
const shell = read('src/shell.html');
const L = cfg.legal || {};
const host = new URL(cfg.domain).host;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const todoMark = (label) => `<mark class="todo">[${label}]</mark>`;
const field = (value, label) => (value && value.trim() ? esc(value.trim()) : todoMark(label));

function spanishDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
}

function fill(tpl, vars, where) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (!(k in vars)) throw new Error(`Variable {{${k}}} desconocida en ${where}`);
    const v = vars[k];
    return typeof v === 'function' ? v() : v;
  });
}

function parsePage(name) {
  const raw = read('src/pages/' + name);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Falta la cabecera "---" en src/pages/${name}`);
  const meta = JSON.parse(m[1]);
  const [content, extra = ''] = m[2].split('<!--@extra-->');
  return { meta, content: content.replace(/\s+$/, ''), extra: extra.trim() };
}

const pages = readdirSync(join(root, 'src/pages'))
  .filter((f) => f.endsWith('.html'))
  .sort()
  .map(parsePage);

const report = [];
const sitemapUrls = [];

for (const { meta, content, extra } of pages) {
  const file = meta.file;
  const depth = file.split('/').length - 1;
  const base = '../'.repeat(depth);
  const canonical = cfg.domain + '/' + (file === 'index.html' ? '' : file);

  const contentVars = {
    base,
    domain: cfg.domain,
    host,
    updated: spanishDate(cfg.updated),
    owner: () => field(L.owner, 'Titular: nombre o razón social'),
    nif: () => field(L.nif, 'NIF o CIF'),
    address: () => field(L.address, 'Dirección postal'),
    city: () => field(L.city, 'Ciudad'),
    email: () => field(L.email, 'Correo de contacto'),
    emailLink: () => (L.email && L.email.trim()
      ? `<a href="mailto:${esc(L.email.trim())}">${esc(L.email.trim())}</a>`
      : todoMark('Correo de contacto')),
    hosting: () => field(L.hosting, 'Proveedor de hosting'),
    mailProvider: () => field(L.mailProvider, 'Proveedor de correo'),
    draftNote: () => (cfg.draft
      ? '<p class="draft-note"><strong>Borrador.</strong> Es un texto de plantilla: completa los campos marcados en amarillo y pide que lo revise un profesional antes de publicar. Este aviso desaparece al poner <code>"draft": false</code> en <code>site.config.json</code>.</p>'
      : '')
  };

  const html = fill(content, contentVars, `src/pages/${file}`);
  const extraHtml = fill(extra, contentVars, `src/pages/${file} (extra)`);

  const crumbs = ['<span>codeladder</span>'];
  if (meta.group) {
    crumbs.push(`<span class="sep">›</span><span data-i18n="${meta.group.key}">${esc(meta.group.text)}</span>`);
  }
  crumbs.push(`<span class="sep">›</span><span data-i18n="${meta.tab.key}">${esc(meta.tab.text)}</span>`);

  const htmlAttrs =
    (meta.titleKey ? ` data-title-key="${meta.titleKey}"` : '') +
    (meta.descKey ? ` data-desc-key="${meta.descKey}"` : '');

  const shellVars = {
    base,
    domain: cfg.domain,
    htmlAttrs,
    title: esc(meta.title),
    description: esc(meta.description),
    robots: meta.robots || 'index,follow',
    canonical,
    jsonld: meta.jsonld
      ? `\n  <script type="application/ld+json">\n    ${JSON.stringify(meta.jsonld)}\n  </script>`
      : '',
    tabAttr: ` data-i18n="${meta.tab.key}"`,
    tabText: esc(meta.tab.text),
    crumbs: crumbs.join(''),
    pageClass: meta.pageClass || '',
    content: html,
    extra: extraHtml ? '\n' + extraHtml.split('\n').map((l) => (l ? '  ' + l : l)).join('\n') + '\n' : ''
  };

  const out = fill(shell, shellVars, 'src/shell.html');
  write(file, out);
  report.push({ file, todo: (out.match(/class="todo"/g) || []).length });
  if (!/noindex/.test(shellVars.robots)) sitemapUrls.push(canonical);
}

/* sitemap.xml */
write('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemapUrls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${cfg.updated}</lastmod>\n  </url>\n`).join('') +
  '</urlset>\n');

/* robots.txt */
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${cfg.domain}/sitemap.xml\n`);

/* ads.txt */
const pub = (cfg.adsensePublisherId || '').trim().replace(/^ca-/, '');
if (pub && !/^pub-\d{10,}$/.test(pub)) {
  throw new Error('adsensePublisherId debe tener el formato pub-0000000000000000');
}
write('ads.txt', pub
  ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
  : '# ads.txt de ' + host + '\n' +
    '# Cuando AdSense te dé tu ID de editor, ponlo en site.config.json (adsensePublisherId,\n' +
    '# con el formato pub-0000000000000000) y vuelve a ejecutar: node tools/build.mjs\n');

/* Resumen */
const totalTodo = report.reduce((n, r) => n + r.todo, 0);
console.log(`Generadas ${report.length} páginas, sitemap.xml, robots.txt y ads.txt`);
for (const r of report) if (r.todo) console.log(`  ${r.file}: ${r.todo} campo(s) por completar`);
if (totalTodo) {
  console.log(`\nQuedan ${totalTodo} campo(s) marcados por completar (datos en site.config.json, sección "legal", y frases marcadas en los textos).`);
  if (!cfg.draft) {
    console.error('Error: "draft" es false pero faltan datos legales. Complétalos antes de publicar.');
    process.exitCode = 1;
  }
}
if (cfg.draft) console.log('Modo borrador activo: las páginas legales muestran el aviso de borrador.');
