# FP Cuenta: ideas guardadas

Lo que se habló y se decidió sobre el futuro de la web (12 de noviembre de 2026). Nada de esto está hecho todavía, salvo lo marcado.

## Aprobadas (hacer cuando toque)

### 1. Contenido propio: artículos
Páginas de texto útiles para el alumnado, escritas con cuidado y con fuentes. Sirven a quien las lee y refuerzan la web ante AdSense,
que valora el contenido original (una web con solo herramientas suele tener menos fuerza). Primeras propuestas:
- Qué pasa si pierdes la evaluación continua en FP.
- Cómo se calcula la nota de un módulo (resultados de aprendizaje, pesos, redondeos).
- Qué es la FCT y cómo se evalúa.
- Convocatoria extraordinaria: cuándo hay y qué te juegas.
Una sección `articulos/` con una página por artículo, enlazada desde el menú y desde las calculadoras. Cada una con fecha de revisión
y fuentes enlazadas, como la normativa.

### 2. Calculadora de nota media del ciclo y de nota de admisión a la universidad
Nota media del ciclo a partir de las notas de los módulos ponderadas por horas, y nota de admisión (media del ciclo más la fase de
admisión opcional). Hay que revisar la normativa vigente antes de escribirla.

### 3. Calculadora de FCT
Horas de FCT (formación en centros de trabajo) por ciclo y comunidad, horas por día y fecha estimada de fin según el calendario
que escriba la persona.

## Hecho
- Modo oscuro con botón en la cabecera (ver LEEME).
- Preparación de AdSense: ID en un solo archivo, metaetiqueta, `ads.txt`, huecos de anuncio, mensaje de consentimiento de Google.

## Descartadas
- **Resultados de aprendizaje reales de cada módulo.** Basta con «RA 1, RA 2…» y la persona escribe los pesos. No se cargan los RA oficiales
  (`datos/ra.js` queda vacío a propósito).
- **Una página por comunidad o por ciclo.** Se queda como está: una calculadora y una página de normativa.

## Aplazadas
- **Web instalable y sin conexión (PWA).** Todavía no: añade complicaciones (versiones en caché, actualizaciones) que ahora no compensan.
