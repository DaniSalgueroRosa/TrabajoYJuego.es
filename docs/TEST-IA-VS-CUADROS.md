# Test «IA vs cuadros reales»: cómo ponerlo en marcha

El motor del test ya está hecho (`tests/ia-vs-cuadros-reales/`). Lo que no puede traer el proyecto son **las imágenes**: tienen que ser tuyas, con su
autor, su fuente y una licencia que permita mostrarlas. Mientras no las añadas, el test sale en el listado como **«Próximamente»** (tarjeta sin enlace) y no tiene página.

## Qué hay que hacer

1. Reúne **al menos 12 imágenes: 6 o más de cuadros reales y 6 o más hechas con IA** (cuantas más, más variadas serán las partidas; cada partida elige 10).
   - **Cuadros reales:** obras de dominio público o con licencia libre. Buenas fuentes de colecciones abiertas: Wikimedia Commons, el programa de acceso abierto
     del Metropolitan Museum of Art, el Rijksmuseum y el Art Institute of Chicago. Anota en cada una el autor, el año y la fuente exacta, y copia su licencia tal como aparece allí.
   - **Imágenes de IA:** genéralas con una herramienta cuyas condiciones te permitan usarlas en una web, y anota cuál es en el campo `autor`
     (por ejemplo «Generada con …»). Procura que imiten estilos de pintura variados.
   - Formato JPG o WebP, de unos 1000 a 1400 px de lado largo y menos de 250 KB cada una. **No pongas nombres que delaten el tipo** (nada de `ia-01.jpg`): usa `001.jpg`, `002.jpg`…
2. Copia las imágenes en `tests/ia-vs-cuadros-reales/imagenes/`.
3. Crea `tests/ia-vs-cuadros-reales/banco.json` con este formato (un objeto por imagen):

```json
{
  "imagenes": [
    {
      "archivo": "imagenes/001.jpg",
      "tipo": "real",
      "titulo": "Título de la obra",
      "autor": "Nombre del pintor",
      "anio": "1889",
      "fuente": "Dónde la has conseguido (colección y dirección)",
      "licencia": "Dominio público (o la licencia exacta)",
      "pista": "Qué rasgo ayuda a reconocerla (opcional)"
    },
    {
      "archivo": "imagenes/002.jpg",
      "tipo": "ia",
      "titulo": "Paisaje al óleo (imagen generada)",
      "autor": "Generada con la herramienta X",
      "anio": "2026",
      "fuente": "Creada para este sitio",
      "licencia": "Uso permitido por las condiciones de la herramienta",
      "pista": "Qué detalle la delata (opcional)"
    }
  ]
}
```

   `tipo` solo puede ser `real` o `ia`. Después de responder, el visitante ve título, autor, año, fuente, licencia y la pista: **rellénalos con datos verdaderos**.
4. En `tests/ia-vs-cuadros-reales/ficha.json` cambia `"estado": "proximamente"` por `"estado": "publicado"`.
5. Ejecuta `python3 sitio.py probar`. Si falta una imagen o un dato, las pruebas te dicen cuál. Con las imágenes puestas, `python3 sitio.py probar --navegador`
   juega una partida completa en Chrome con tu banco.

## Notas

- El test pide `banco.json` al propio sitio, así que **no funciona abriendo el HTML suelto desde el disco** (el navegador lo bloquea): ábrelo con `ver-el-sitio` o desde el hosting.
- No se guarda nada y no se llama a ningún servidor de fuera.
- Revisa que las imágenes de IA no imiten a un artista vivo concreto ni reproduzcan una obra protegida.
