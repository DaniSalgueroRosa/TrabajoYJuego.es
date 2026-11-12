# -*- coding: utf-8 -*-
"""
Porcentajes de faltas ya investigados de TODAS las comunidades (noviembre de 2026).

Este archivo NO se publica ni lo lee el sitio. Es el material de partida para cuando se añada una comunidad:
    python3 gen/nueva_comunidad.py <carpeta>          (copia de aquí el porcentaje, la nota y las fuentes)
La comunidad solo aparece en el sitio cuando existe su carpeta en  comunidades/<carpeta>/.

  origen  "norma"      el porcentaje sale de la normativa o de instrucciones oficiales de la comunidad
          "indicio"    lo cita un documento de un centro o de un sindicato, no el texto de la norma
          "centro"     la norma autonómica deja el límite en manos de cada centro (valor orientativo)
          "sin-datos"  no he encontrado nada fiable (valor prudente del 15 %)
  cuentan "todas"      cuentan faltas justificadas e injustificadas
          "injust"     solo cuentan las injustificadas
          "centro"     depende de cada centro (la calculadora parte de "todas")
"""

DEFAULT_PCT = 15

PRUDENTE = ("Usamos el 15 % como valor prudente: en las comunidades que sí hemos podido consultar, "
            "el límite va del 10 % al 30 %. Pregunta a tu tutor o tutora cuál es el de tu centro.")

COMUNIDADES = [
    dict(
        id="and", nombre="Andalucía", alias="", pct=20, origen="norma", cuentan="todas",
        norma="Orden de 18 de septiembre de 2025",
        nota=("La Orden de 18 de septiembre de 2025 exige una asistencia mínima del 80 % de las horas del módulo "
              "en la modalidad presencial, así que puedes faltar hasta el 20 %. Según una guía sindical, la normativa "
              "andaluza no distingue entre faltas justificadas e injustificadas para este cómputo."),
        fuentes=[
            ("CSIF: nueva orden de FP en Andalucía (septiembre de 2025)", "https://www.csif.es/es/articulo/andalucia/educacion/77515"),
            ("USTEA: preguntas frecuentes sobre la orden (2026)", "https://educacion.ustea.org/wp-content/uploads/2026/03/260323-FAQ.pdf"),
        ],
    ),
    dict(
        id="ara", nombre="Aragón", alias="", pct=15, origen="norma", cuentan="centro",
        norma="Normativa de evaluación de Grados D y E",
        nota=("En Aragón el límite es, como máximo, el 15 % de la duración del módulo. Tu centro concreta el porcentaje "
              "en su proyecto curricular, así que puede ser menor, pero no mayor."),
        fuentes=[
            ("Catedu: la evaluación en la FP (Aragón)", "https://libros.catedu.es/books/funcionariado-en-practicas-lomloe/page/la-evaluacion-en-la-fp/export/pdf"),
        ],
    ),
    dict(
        id="ast", nombre="Asturias (Principado de)", alias="asturies", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota="No hemos encontrado una norma asturiana con un porcentaje concreto. " + PRUDENTE,
        fuentes=[],
    ),
    dict(
        id="bal", nombre="Illes Balears", alias="baleares islas", pct=15, origen="centro", cuentan="centro",
        norma="",
        nota=("No hemos encontrado una norma balear con un porcentaje para la enseñanza presencial. Un instituto de Mallorca "
              "aplica el 20 % contando faltas justificadas e injustificadas, pero otros centros pueden usar otro valor. "
              "Partimos del 15 % para no quedarnos cortos."),
        fuentes=[
            ("IES Marratxí: criterios de evaluación del departamento de FP", "https://redols.caib.es/c07008818/wp-content/uploads/sites/29/2024/05/Criteris-avaluacio-departament-FP.pdf"),
        ],
    ),
    dict(
        id="can", nombre="Canarias", alias="", pct=15, origen="sin-datos", cuentan="centro",
        norma="Resolución de 9 de junio de 2025 (modificada el 3 de diciembre de 2025)",
        nota=("Las instrucciones de evaluación de FP vigentes son la Resolución de 9 de junio de 2025, modificada el 3 de "
              "diciembre de 2025. No hemos podido consultar su texto, así que no sé qué porcentaje fija. " + PRUDENTE),
        fuentes=[
            ("Gobierno de Canarias: evaluación del sistema de FP", "https://www.gobiernodecanarias.org/educacion/web/formacion_profesional/evaluacion/index.html"),
        ],
    ),
    dict(
        id="cnt", nombre="Cantabria", alias="", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota="No hemos encontrado una norma cántabra con un porcentaje concreto. " + PRUDENTE,
        fuentes=[],
    ),
    dict(
        id="cyl", nombre="Castilla y León", alias="", pct=15, origen="centro", cuentan="centro",
        norma="Orden EDU/1575/2024, art. 2.6",
        nota=("La Orden EDU/1575/2024 deja que la programación didáctica de cada módulo fije el número de faltas que impide "
              "la evaluación continua, y no da ningún porcentaje. Partimos del 15 %, pero mira cuál es en tu programación."),
        fuentes=[
            ("BOCYL: Orden EDU/1575/2024, de evaluación en grados D y E", "https://www.educa.jcyl.es/fp/en/nueva-formacion-profesional-castilla-leon.files/1754892-Orden%20de%20Evaluaci%C3%B3n.pdf"),
        ],
    ),
    dict(
        id="clm", nombre="Castilla-La Mancha", alias="castilla la mancha", pct=20, pct_curso={1: 25},
        origen="indicio", cuentan="injust",
        norma="Orden 201/2024, de 28 de noviembre",
        nota=("La orden de 2010 exigía asistir al menos al 80 % de las horas del módulo y no contaba las faltas debidamente "
              "justificadas. Para 1º, un modelo de comunicación de un centro de Guadalajara cita la nueva norma (Orden 201/2024) "
              "con un mínimo del 75 %, es decir, hasta un 25 % de faltas. Para 2º no hemos encontrado el dato y usamos el 20 %. "
              "En esa norma, una falta solo es justificada si es no voluntaria y sobrevenida, o un deber legal inexcusable."),
        fuentes=[
            ("IES Julio Verne: normativa sobre la pérdida de la evaluación continua", "https://ies-julioverne.centros.castillalamancha.es/print/39"),
            ("Modelo de comunicación de un centro de Guadalajara (cita la Orden 201/2024)", "https://docs.google.com/document/d/12Ryd9E6qNuzz9BcPvIE4R-HqzJSQUgTM/export?format=pdf"),
        ],
    ),
    dict(
        id="cat", nombre="Cataluña", alias="catalunya", pct=15, origen="centro", cuentan="centro",
        norma="",
        nota=("En Cataluña cada módulo se divide en unidades formativas (UF) y los centros fijan sus propios límites. Un instituto "
              "catalán pide no pasar del 20 % de faltas en cada UF. La calculadora trabaja por módulo: si tu centro aplica el "
              "límite por UF, apunta cada UF como un módulo con sus horas. Partimos del 15 % para no quedarnos cortos."),
        fuentes=[
            ("Criterios de evaluación de grado medio de un instituto catalán (curso 2023-2024)", "https://educaciodigital.cat/iesb7/moodle/pluginfile.php/228901/mod_resource/content/4/Criteris%20Avaluaci%C3%B3%20Grau%20Mig%20curs%202023_2024.pdf"),
        ],
    ),
    dict(
        id="val", nombre="Comunitat Valenciana", alias="valencia comunidad valenciana alicante castellon", pct=15,
        origen="norma", cuentan="todas",
        norma="Orden 8/2025, de 22 de abril, art. 7",
        nota=("La Orden 8/2025 (DOGV del 30 de abril de 2025) hace perder la evaluación continua en un módulo al superar el 15 % "
              "de inasistencia, contando faltas justificadas e injustificadas."),
        matricula=("Aparte de la evaluación continua, el centro puede anular la matrícula si acumulas el 15 % de faltas "
                   "injustificadas en el curso o 10 días lectivos seguidos sin justificar."),
        fuentes=[
            ("IES Doctor Balmis: información sobre inasistencia (curso 2026-27)", "https://portal.edu.gva.es/iesdoctorbalmis/wp-content/uploads/sites/434/2026/07/Inasistencia-a-clase-2026-27.pdf"),
            ("DOGV: Orden 8/2025 de evaluación de FP", "https://www.mclibre.org/consultar/legislacion/files/dogv/DOGV-2025-8-O-evaluacion-fp-es.pdf"),
        ],
    ),
    dict(
        id="ext", nombre="Extremadura", alias="", pct=15, origen="centro", cuentan="centro",
        norma="Orden de 20 de junio de 2012",
        nota=("La Orden de 20 de junio de 2012 remite al máximo que fije el proyecto curricular de cada ciclo. Institutos "
              "extremeños aplican el 15 % o el 20 %, y alguno solo cuenta las faltas injustificadas. Partimos del 15 % para no "
              "quedarnos cortos. Son documentos anteriores al nuevo sistema de FP, así que confírmalo en tu centro."),
        fuentes=[
            ("IES Bartolomé J. Gallardo: criterios de un módulo (15 %)", "https://iesbjgallardo.educarex.es/wp-content/uploads/sites/96/2025/10/APLICACIONES_OFIMATICAS._CRITERIOS_DE_EVALUACION_Y_CALIFICACION.pdf"),
            ("Instituto extremeño: programación de FOL (20 %)", "https://ies.educarex.es/wp-content/uploads/sites/109/2016/11/1FOL.pdf"),
            ("Instituto extremeño: criterios del departamento de servicios a la comunidad (20 % injustificadas)", "https://ies.educarex.es/wp-content/uploads/sites/60/2022/12/Criterios_Calificacin_Dpto_SSC.pdf"),
        ],
    ),
    dict(
        id="gal", nombre="Galicia", alias="galiza", pct=10, origen="norma", cuentan="injust",
        norma="Orden de 12 de julio de 2011, art. 25",
        nota=("Las instrucciones de la Xunta (2016 y 2021) aplican el artículo 25 de la Orden de 12 de julio de 2011: pierdes la "
              "evaluación continua al acumular un 10 % de faltas injustificadas en el módulo, y el centro te avisa al superar el 6 %. "
              "El profesorado valora tus circunstancias personales y laborales al aceptar las justificaciones. Son las últimas "
              "instrucciones que hemos encontrado."),
        fuentes=[
            ("DOG de 30 de junio de 2021: instrucciones de la Xunta", "https://www.xunta.gal/dog/Publicados/2021/20210630/AnuncioG0598-180621-0005_es.html"),
            ("DOG de 18 de agosto de 2016: instrucciones de la Xunta", "https://www.xunta.gal/dog/Publicados/2016/20160818/AnuncioG0164-050816-0003_es.html"),
        ],
    ),
    dict(
        id="mad", nombre="Comunidad de Madrid", alias="madrid", pct=15, origen="centro", cuentan="centro",
        norma="Orden publicada en el BOCM del 4 de mayo de 2022, art. 43",
        nota=("En Madrid cada centro fija el máximo de faltas en su plan de convivencia, y la programación de cada módulo define "
              "cómo se te evalúa si lo superas. Los institutos que hemos visto usan el 15 %, el 20 %, o el 20 % de injustificadas y "
              "el 25 % sumando justificadas. Partimos del 15 % para no quedarnos cortos."),
        matricula=("Esa orden también prevé avisarte al llegar a la mitad de las faltas permitidas, y plantea anular la matrícula "
                   "cuando las faltas equivalen al 15 % de las horas de formación en el centro. Una falta solo se considera "
                   "justificada si la documentas en dos días hábiles."),
        fuentes=[
            ("BOCM del 4 de mayo de 2022: orden de evaluación de FP", "https://www.comunidad.madrid/transparencia/sites/default/files/bocm-4-5-22.pdf"),
            ("IES Ángel Corella: criterios de calificación 2025-26 (15 %)", "https://site.educa.madrid.org/ies.angelcorella.colmenarviejo//wp-content/uploads/ies.angelcorella.colmenarviejo/2026/02/ADM-Criterios-Calificacion-20252026.pdf"),
            ("IES Churriguera: evaluación de un módulo optativo 2025-26 (20 % y 25 %)", "https://site.educa.madrid.org/ies.churriguera.leganes//wp-content/uploads/ies.churriguera.leganes/2026/01/25-26-EVALUACION-OPTATIVA-DPI.pdf"),
        ],
    ),
    dict(
        id="mur", nombre="Región de Murcia", alias="murcia", pct=30, origen="norma", cuentan="todas",
        norma="Orden de 28 de julio de 2026, art. 4.3",
        nota=("La Orden de 28 de julio de 2026 (BORM del 31 de julio) fija, con carácter general, el 30 % de las horas lectivas de la "
              "fase de centro del módulo, contando faltas justificadas e injustificadas desde la fecha de matrícula. Si tu módulo "
              "incluye horas de formación en la empresa, no las sumes a las horas del módulo."),
        matricula=("La dirección puede iniciar la anulación de matrícula si superas el 30 % de faltas injustificadas del total de "
                   "periodos lectivos, o si acumulas diez días lectivos seguidos sin justificar."),
        fuentes=[
            ("BORM n.º 175, de 31 de julio de 2026: orden de evaluación de grados D y E", "https://www.borm.es/services/anuncio/ano/2026/numero/3812/pdf?id=844494"),
        ],
    ),
    dict(
        id="nav", nombre="Navarra (Comunidad Foral de)", alias="nafarroa", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota="No hemos encontrado una norma navarra de FP con un porcentaje concreto. " + PRUDENTE,
        fuentes=[],
    ),
    dict(
        id="pv", nombre="País Vasco", alias="euskadi pais vasco", pct=20, origen="indicio", cuentan="centro",
        norma="",
        nota=("La guía de un centro vasco (Egibide) resume la normativa así: en FP la asistencia regular no puede ser inferior al "
              "80 % para mantener la evaluación continua, es decir, hasta un 20 % de faltas. No hemos podido comprobarlo en el texto "
              "de la norma."),
        fuentes=[
            ("Egibide: evaluaciones y reclamaciones (curso 2023-24)", "https://www.egibide.org/file/2023/12/evaluaciones-y-reclamaciones_010248_con_anexo.pdf"),
        ],
    ),
    dict(
        id="rio", nombre="La Rioja", alias="rioja", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota="No hemos encontrado una norma riojana con un porcentaje concreto. " + PRUDENTE,
        fuentes=[],
    ),
    dict(
        id="ceu", nombre="Ceuta", alias="ministerio", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota=("Los centros de Ceuta dependen del Ministerio de Educación, Formación Profesional y Deportes. No hemos encontrado un "
              "porcentaje concreto. " + PRUDENTE),
        fuentes=[],
    ),
    dict(
        id="mel", nombre="Melilla", alias="ministerio", pct=15, origen="sin-datos", cuentan="centro",
        norma="",
        nota=("Los centros de Melilla dependen del Ministerio de Educación, Formación Profesional y Deportes. No hemos encontrado un "
              "porcentaje concreto. " + PRUDENTE),
        fuentes=[],
    ),
]

def buscar(clave):
    """Busca una comunidad por id o por nombre (sin tildes ni mayúsculas)."""
    import unicodedata

    def plano(t):
        t = unicodedata.normalize("NFD", t)
        return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()

    for c in COMUNIDADES:
        if plano(clave) in (plano(c["id"]), plano(c["nombre"])) or plano(clave) in plano(c.get("alias", "")).split():
            return c
    return None


if __name__ == "__main__":
    from comunidades import ORIGEN_ETIQUETA, CUENTAN_TEXTO
    ids = [c["id"] for c in COMUNIDADES]
    assert len(ids) == len(set(ids))
    for c in COMUNIDADES:
        assert c["origen"] in ORIGEN_ETIQUETA, c["id"]
        assert c["cuentan"] in CUENTAN_TEXTO, c["id"]
        assert 1 <= c["pct"] <= 100, c["id"]
        for t, u in c["fuentes"]:
            assert u.startswith("https://"), (c["id"], u)
        if c["origen"] in ("norma", "indicio"):
            assert c["fuentes"], c["id"] + " sin fuentes"
    print(len(COMUNIDADES), "comunidades OK")
