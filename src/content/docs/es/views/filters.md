---
title: "Filtros de las plantillas"
description: "Referencia práctica de los filtros Orionis y los filtros Jinja incluidos en el entorno de vistas."
editUrl: true
lastUpdated: false
---

Un filtro transforma el valor situado a la izquierda de `|`. Puedes encadenarlos y pasar argumentos: `{{ names | sort | join(", ") }}`. El entorno de Orionis incluye los filtros estándar de Jinja y añade `json` y `markdown`. Los ejemplos siguientes cubren todos los nombres registrados por defecto, incluidos sus alias.

Los filtros que producen un iterador se combinan con `|list` cuando necesitas mostrar su contenido o reutilizarlo. Los ejemplos son fragmentos de archivos dentro de `resources/views/`; no se ejecutan como código Python.

## Filtros añadidos por Orionis

### json: mostrar datos serializados

`json(value, indent=None)` utiliza msgspec y devuelve una cadena. Úsalo para presentar datos en un bloque de diagnóstico o un panel; `indent` aplica sangría. Con autoescape activo, las comillas se escapan en el código HTML y el navegador muestra el JSON como texto.

```html
<pre>{{ {"name": "Ada", "active": true} | json(indent=2) }}</pre>
```

Si el valor no se puede codificar, el filtro devuelve `str(value)`: no garantiza JSON válido para cualquier objeto. Para incorporar datos en un bloque `<script>`, utiliza `tojson`, explicado más adelante; añadir `|safe` a `json` no proporciona ese escape específico.

### markdown: convertir texto Markdown

`markdown(value)` convierte `str(value)` a HTML con las extensiones Markdown `extra`, `codehilite` y `toc`. Permite tablas, bloques de código y generación de contenido de encabezados, entre otras funciones de esas extensiones. Devuelve una cadena normal: el autoescape también se aplica a ese resultado.

```html
<pre>{{ "## Release notes\n\nA **small** update." | markdown }}</pre>
```

Este primer ejemplo muestra las etiquetas como texto. Cuando el Markdown es contenido confiable mantenido por la aplicación, puedes insertar el HTML:

```html
<article>{{ "## Release notes\n\nA **small** update." | markdown | safe }}</article>
```

El filtro no sanitiza HTML aportado por usuarios. Si aceptas Markdown externo, aplica una sanitización adecuada antes de marcar su resultado como seguro.

## Texto

### lower, upper, capitalize y title

Normalizan mayúsculas y minúsculas. `capitalize` pone en mayúscula el primer carácter y en minúsculas el resto; `title` aplica formato de título a las palabras.

```html
{{ "ORIONIS" | lower }}       {# orionis #}
{{ "Orionis" | upper }}       {# ORIONIS #}
{{ "hELLO WORLD" | capitalize }} {# Hello world #}
{{ "hello orionis" | title }}  {# Hello Orionis #}
```

### trim, replace y string

`trim` elimina caracteres de los extremos; `replace` sustituye coincidencias y admite un límite opcional; `string` convierte un valor a texto.

```html
{{ "  Orionis  " | trim }}
{{ "--Orionis--" | trim("-") }}
{{ "red red red" | replace("red", "blue", 2) }} {# blue blue red #}
{{ 42 | string }}
```

### format, center e indent

`format` usa formato `%` de Python; `center` centra texto con espacios; `indent` añade sangría, útil en texto preformateado. Sus opciones `first` y `blank` incluyen la primera línea y las líneas vacías.

```html
<pre>{{ "%s: %03d" | format("Item", 7) }}</pre>
<pre>{{ "hi" | center(6) }}</pre>
<pre>{{ "first\nsecond" | indent(2, first=true) }}</pre>
```

### truncate, wordwrap y wordcount

`truncate(length, killwords=False, end="...", leeway=None)` acorta textos. El ejemplo fija `leeway=0` para aplicar el límite sin tolerancia. `wordwrap` reparte texto en líneas; `wordcount` cuenta palabras.

```html
{{ "Orionis Framework" | truncate(10, true, "...", 0) }} {# Orionis... #}
<pre>{{ "one two three" | wordwrap(7) }}</pre>
{{ "one two three" | wordcount }} {# 3 #}
```

### striptags

Elimina etiquetas y normaliza espacios al presentar un resumen de HTML. No lo utilices como una política general de sanitización de HTML.

```html
{{ "<p>Hello <strong>Ada</strong></p>" | striptags }} {# Hello Ada #}
```

## Números y valores ausentes

### abs, int, float y round

`abs` obtiene el valor absoluto. `int` y `float` convierten texto y aceptan un valor predeterminado cuando falla la conversión; `int` admite `base`. `round` admite precisión y los métodos `common`, `ceil` y `floor`; devuelve un número de punto flotante, por lo que puedes encadenar `|int` si necesitas un entero.

```html
{{ -7 | abs }}                    {# 7 #}
{{ "ff" | int(default=0, base=16) }} {# 255 #}
{{ "bad" | int(default=0) }}        {# 0 #}
{{ "12.5" | float(default=0.0) }}    {# 12.5 #}
{{ 3.14159 | round(2) }}            {# 3.14 #}
```

### sum y filesizeformat

`sum` suma valores o el atributo indicado de una secuencia. `filesizeformat` presenta tamaños con unidades decimales; `binary=true` utiliza unidades binarias.

```html
{{ [10, 20, 30] | sum }} {# 60 #}
{{ [{"price": 10}, {"price": 20}] | sum(attribute="price") }} {# 30 #}
{{ 1000 | filesizeformat }}       {# 1.0 kB #}
{{ 1024 | filesizeformat(true) }} {# 1.0 KiB #}
```

### default y d

`default` sustituye una variable indefinida; `d` es su alias. El segundo argumento `boolean=true` también sustituye valores falsos como una cadena vacía, `None` o cero. No lo actives si cero es un valor significativo.

```html
{{ missing_title | default("Untitled") }} {# Untitled #}
{{ missing_title | d("Untitled") }}       {# Untitled #}
{{ "" | default("Empty", true) }}         {# Empty #}
{{ 0 | default(100) }}                    {# 0 #}
```

## Colecciones y diccionarios

### length, count, first, last y list

`length` y su alias `count` obtienen el tamaño. `first` y `last` seleccionan extremos; convierte un generador a lista antes de usar `last`. `list` materializa iterables, incluidas cadenas.

```html
{{ ["Ada", "Lin"] | length }} {# 2 #}
{{ ["Ada", "Lin"] | count }}  {# 2 #}
{{ ["Ada", "Lin"] | first }}  {# Ada #}
{{ ["Ada", "Lin"] | last }}   {# Lin #}
{{ "api" | list }}            {# ['a', 'p', 'i'] #}
```

### join, reverse, sort y unique

`join` une elementos con un separador y admite `attribute`. `reverse` invierte el orden; `sort` lo ordena. `unique` conserva la primera aparición de cada valor. `sort` y `unique` permiten configurar comparación sensible a mayúsculas y usar un atributo.

```html
{{ ["Ada", "Lin"] | join(", ") }}          {# Ada, Lin #}
{{ [{"name": "Ada"}] | join(", ", attribute="name") }}
{{ [1, 2, 3] | reverse | list }}           {# [3, 2, 1] #}
{{ [3, 1, 2] | sort }}                     {# [1, 2, 3] #}
{{ [3, 1, 2] | sort(reverse=true) }}        {# [3, 2, 1] #}
{{ ["api", "API", "web"] | unique | list }} {# ['api', 'web'] #}
```

### batch y slice

`batch(n, fill_with=None)` crea filas de hasta `n` elementos. `slice(n, fill_with=None)` distribuye los elementos en `n` columnas. Úsalos al construir rejillas; el valor de relleno completa los grupos cortos cuando se proporciona.

```html
{{ [1, 2, 3, 4, 5] | batch(2, "-") | list }}
{# [[1, 2], [3, 4], [5, '-']] #}
{{ [1, 2, 3, 4, 5] | slice(2) | list }}
{# [[1, 2, 3], [4, 5]] #}
```

### items, dictsort y attr

`items` itera pares de un diccionario; `dictsort` los ordena por `key` o `value`. `attr` obtiene un atributo del objeto y no busca una clave de diccionario como alternativa.

```html
{% for key, value in {"name": "Ada", "role": "editor"} | items %}
  <p>{{ key }}: {{ value }}</p>
{% endfor %}
{{ {"b": 2, "a": 1} | dictsort }} {# [('a', 1), ('b', 2)] #}
{{ ("orionis" | attr("upper"))() }} {# ORIONIS #}
```

### groupby

Agrupa por un atributo, ordenando previamente los elementos. Cada grupo expone `grouper` y `list`. Usa `default` para elementos sin ese atributo y `case_sensitive=true` cuando necesites distinguir mayúsculas.

```html
{% set users = [{"name": "Ada", "team": "api"}, {"name": "Lin", "team": "web"}] %}
{% for group in users | groupby("team", default="other") %}
  <h2>{{ group.grouper }}</h2>
  <p>{{ group.list | map(attribute="name") | join(", ") }}</p>
{% endfor %}
```

### map, select, reject, selectattr y rejectattr

`map` obtiene un atributo o aplica otro filtro a cada elemento. `select`/`reject` conservan o descartan elementos según un test Jinja; las variantes terminadas en `attr` aplican el test a un atributo. Sin test explícito, se utiliza el valor booleano del atributo.

```html
{{ ["api", "web"] | map("upper") | list }} {# ['API', 'WEB'] #}
{{ [{"name": "Ada"}, {}] | map(attribute="name", default="Guest") | list }}
{{ [1, 2, 3, 4] | select("even") | list }} {# [2, 4] #}
{{ [1, 2, 3, 4] | reject("even") | list }} {# [1, 3] #}
{% set users = [{"name": "Ada", "active": true}, {"name": "Lin", "active": false}] %}
{{ users | selectattr("active") | map(attribute="name") | list }} {# ['Ada'] #}
{{ users | rejectattr("active") | map(attribute="name") | list }} {# ['Lin'] #}
```

### min y max

Obtienen el mínimo o máximo; admiten `attribute` y comparación sensible a mayúsculas. Una secuencia vacía produce un valor indefinido, por lo que puedes añadir `default`.

```html
{{ [10, 30, 20] | min }} {# 10 #}
{{ [10, 30, 20] | max }} {# 30 #}
{{ [] | max | default("No data") }}
```

## HTML, URLs y JSON para el navegador

### escape, e, forceescape y safe

`escape` y su alias `e` convierten caracteres especiales en entidades HTML. `forceescape` vuelve a escapar incluso contenido marcado seguro. `safe` marca un valor como HTML confiable y evita el autoescape: úsalo únicamente con markup controlado por la aplicación.

```html
{{ "<strong>Ada</strong>" | escape }}
{{ "<strong>Ada</strong>" | e }}
{{ "<strong>Ada</strong>" | safe | forceescape }}
{{ "<strong>Application-owned heading</strong>" | safe }}
```

### urlencode y urlize

`urlencode` codifica una cadena o una colección de parámetros. Para una cadena conserva `/`, ya que permite codificar un path; no lo confundas con la codificación de un segmento individual. `urlize` convierte URLs reconocidas en enlaces HTML.

```html
{{ "search term" | urlencode }} {# search%20term #}
{{ {"q": "hello world", "page": 2} | urlencode }}
{{ "Visit https://example.com" | urlize(nofollow=true, target="_blank") }}
```

### xmlattr

Convierte un diccionario en atributos HTML y escapa sus valores. Los valores `None` e indefinidos se omiten. Mantén los nombres de atributos bajo control de la aplicación; el escape de valores no convierte cualquier nombre externo en un atributo admisible.

```html
<div{{ {"class": "notice", "data-id": 7, "hidden": none} | xmlattr }}>
  Saved
</div>
```

### tojson

Serializa datos y devuelve HTML marcado seguro con el escape necesario para un bloque `<script>`. A diferencia de `json`, no es una conversión con fallback a `str(value)`. También permite `indent`.

```html
<script id="page-data" type="application/json">
  {{ {"name": "Ada", "label": "<demo>"} | tojson(indent=2) }}
</script>
```

JavaScript puede leer `JSON.parse(document.getElementById("page-data").textContent)`. Para atributos HTML con comillas dobles necesitas un escape adicional; utiliza el bloque anterior para no mezclar contextos de escape.

## Diagnóstico y selección aleatoria

### pprint y random

`pprint` presenta la representación legible de un objeto, útil durante diagnóstico. `random` selecciona un elemento de una secuencia no vacía; no lo utilices para decisiones de seguridad ni esperes un resultado reproducible.

```html
<pre>{{ {"team": "api", "members": ["Ada", "Lin"]} | pprint }}</pre>
{{ ["API tip", "Web tip", "Testing tip"] | random }}
```

## Añadir filtros propios

Registra funciones mediante `IViewEnvironment.addFilter()` en el `boot()` de un provider. Consulta [Providers y extensiones](/es/views/providers-and-extensions) para el registro completo y los filtros asíncronos; modifica el entorno durante el arranque, antes de atender peticiones.

---

[Vistas](/es/views) · [Globals y contexto](/es/views/globals) · [Layouts y herencia](/es/views/template-language)
