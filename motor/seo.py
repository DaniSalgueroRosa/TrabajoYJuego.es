# -*- coding: utf-8 -*-
"""SEO técnico: JSON-LD, robots.txt y sitemap.xml.

Regla del entorno (config/sitio.json → «entorno»):
    preproduccion  (por defecto)  las páginas llevan noindex, robots.txt prohíbe rastrear y el sitemap sale vacío,
                                  para que una copia de pruebas nunca acabe en Google.
    produccion                    todo abierto, con sitemap completo.
"""
from __future__ import annotations

import json
from datetime import date
from xml.sax.saxutils import escape


def jsonld(objeto: dict) -> str:
    """JSON listo para ir dentro de <script type="application/ld+json">."""
    return json.dumps(objeto, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def absoluta(cfg: dict, ruta: str) -> str:
    return cfg["url"].rstrip("/") + "/" + ruta.lstrip("/")


def es_produccion(cfg: dict) -> bool:
    return cfg.get("entorno") == "produccion"


def robots_txt(cfg: dict) -> str:
    if not es_produccion(cfg):
        return ("# Entorno de pruebas: no rastrear.\n"
                "User-agent: *\nDisallow: /\n")
    return f"User-agent: *\nAllow: /\n\nSitemap: {absoluta(cfg, 'sitemap.xml')}\n"


def sitemap_xml(cfg: dict, paginas: list) -> str:
    """paginas: lista de (ruta, fecha o None)."""
    cabecera = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    if not es_produccion(cfg):
        return cabecera + "  <!-- Entorno de pruebas: el mapa del sitio está vacío a propósito. -->\n</urlset>\n"
    lineas = []
    for ruta, fecha in paginas:
        lineas.append("  <url>\n    <loc>" + escape(absoluta(cfg, ruta)) + "</loc>\n"
                      + (f"    <lastmod>{fecha.isoformat()}</lastmod>\n" if isinstance(fecha, date) else "")
                      + "  </url>\n")
    return cabecera + "".join(lineas) + "</urlset>\n"


def migas_jsonld(cfg: dict, migas: list) -> dict:
    """migas: lista de (nombre, ruta relativa a la raíz)."""
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": absoluta(cfg, r)}
                                for i, (n, r) in enumerate(migas)]}


def organizacion_jsonld(cfg: dict) -> dict:
    url = absoluta(cfg, "")
    return {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": url + "#sitio", "url": url, "name": cfg["nombre"], "inLanguage": cfg["idioma"]},
        {"@type": "Organization", "@id": url + "#organizacion", "name": cfg["nombre"], "url": url,
         "logo": absoluta(cfg, "assets/img/logo.svg")}]}
