---
title: "Traducir mensajes y plurales"
description: "Usa Lang para resolver mensajes, comprobar traducciones, sustituir variables y seleccionar plurales con recursos JSON reales."
editUrl: true
lastUpdated: false
---

La fachada `Lang` permite traducir desde los controladores, servicios y demás componentes de una aplicación Orionis iniciada. Importa siempre `from orionis.support.facades import Lang`. Sus métodos `get()`, `has()` y `choice()` son **síncronos**: se pueden llamar dentro de un método asíncrono sin `await`.

Esta página se centra en resolver mensajes. Para crear los archivos y configurar el idioma predeterminado, consulta [Mensajes e idiomas](/es/localization/messages-and-locales); para inyectar el traductor o usarlo en Jinja, consulta [Aplicación y vistas](/es/localization/application-and-views).

## Recursos para los ejemplos

Crea estos archivos JSON UTF-8. Si ya existen, combina las claves con sus traducciones. Los ejemplos utilizan `en` como fallback.

`resources/lang/en/messages.json`:

```json
{
  "greeting": "Hello :name",
  "welcome": "Welcome to Orionis",
  "names": ":name | :Name | :NAME",
  "contacts": ":name (:name_full)",
  "reports": "{0} No reports|{1} One report|[2,*] :count reports",
  "items": "One item|:count items",
  "stock": "[*,0] Out of stock|[1,5] Low stock: :count|[6,*] In stock: :count",
  "universal": "{0} No messages|{*} :count messages",
  "only_in_english": "Available in English"
}
```

`resources/lang/es/messages.json`:

```json
{
  "greeting": "Hola :name",
  "welcome": "Bienvenido a Orionis",
  "names": ":name | :Name | :NAME",
  "contacts": ":name (:name_full)",
  "reports": "{0} No hay informes|{1} Un informe|[2,*] :count informes",
  "items": "Un artículo|:count artículos",
  "stock": "[*,0] Sin existencias|[1,5] Pocas existencias: :count|[6,*] Existencias: :count",
  "universal": "{0} No hay mensajes|{*} :count mensajes"
}
```

El nombre del archivo aporta el prefijo: `messages.greeting` identifica `greeting` dentro de `messages.json`. La clave `messages.only_in_english` se omite intencionadamente en español para mostrar el fallback.

## Obtener un mensaje con get()

`Lang.get(key, locale=None, **replace)` devuelve un `str`. `key` identifica el mensaje; `locale` permite elegir el idioma para esa llamada; los demás argumentos con nombre aportan valores para sus placeholders.

Un servicio puede preparar los textos que un controlador, un correo o una tarea necesiten:

```python
from orionis.support.facades import Lang


class WelcomeMessages:

    def for_user(self, name: str, locale: str) -> dict[str, str]:
        return {
            "title": Lang.get("messages.welcome", locale=locale),
            "greeting": Lang.get(
                "messages.greeting",
                locale=locale,
                name=name,
            ),
        }
```

`WelcomeMessages().for_user("Ada", "es")` devuelve `{"title": "Bienvenido a Orionis", "greeting": "Hola Ada"}`. Con `"en"` devuelve `{"title": "Welcome to Orionis", "greeting": "Hello Ada"}`.

Cuando omites `locale` o pasas `None`, se utiliza el idioma activo del traductor. Para una petición o trabajo con idioma propio, pasa `locale=` en **cada llamada**. El traductor es compartido en el proceso: `Lang.setLocale()` cambia su estado global y no constituye una selección de idioma aislada por petición.

### Placeholders y capitalización

Con un argumento `name="ada lovelace"`, el mismo mensaje puede usar tres variantes:

| Placeholder | Resultado |
|---|---|
| `:name` | `ada lovelace` |
| `:Name` | `Ada lovelace` |
| `:NAME` | `ADA LOVELACE` |

`:Name` utiliza `str.capitalize()`: pone el primer carácter en mayúscula y el resto en minúsculas; no capitaliza cada palabra. Los valores se convierten con `str()`, por lo que también puedes reemplazar números y otros objetos.

```python
from orionis.support.facades import Lang


class ContactMessages:

    def preview(self, locale: str) -> dict[str, str]:
        return {
            "variants": Lang.get(
                "messages.names",
                locale=locale,
                name="ada lovelace",
            ),
            "contact": Lang.get(
                "messages.contacts",
                locale=locale,
                name="Ada",
                name_full="Ada Lovelace",
            ),
            "pending": Lang.get("messages.greeting", locale=locale),
        }
```

Con `locale="es"`:

- `variants` es `ada lovelace | Ada lovelace | ADA LOVELACE`.
- `contact` es `Ada (Ada Lovelace)`.
- `pending` es `Hola :name`, porque no se proporcionó `name`.

Los nombres largos se reemplazan antes que los cortos: `name_full` se procesa antes que `name`. La sustitución es literal, sin expresiones ni formateadores de fechas, números o HTML. Si un placeholder no recibe valor, permanece en el mensaje. El traductor devuelve texto; el escape HTML corresponde al contexto que lo presenta, como el autoescape de las vistas.

## Fallback y claves ausentes

Para cada `get()`, Orionis consulta:

1. El idioma indicado en `locale`, o el activo si no se indicó.
2. El fallback configurado, si es diferente.
3. El callback de claves ausentes, cuando existe.
4. La propia clave, si el callback no devuelve un `str`.

Una traducción vacía (`""`) cuenta como existente y no provoca fallback. No se recorren idiomas regionales de forma automática: solicitar `es-CO` no prueba `es` antes del fallback. El locale tampoco se normaliza: `es-CO` y `es_CO` son identificadores diferentes.

### Comprobar si existe una traducción con has()

Usa `Lang.has(key, locale=None, *, fallback=True)` para consultar la existencia. Por defecto incluye el fallback; con `fallback=False` comprueba únicamente el idioma solicitado.

```python
from orionis.support.facades import Lang


class TranslationStatus:

    def inspect(self, locale: str) -> dict[str, str | bool]:
        return {
            "text": Lang.get("messages.only_in_english", locale=locale),
            "available": Lang.has("messages.only_in_english", locale=locale),
            "translated_here": Lang.has(
                "messages.only_in_english",
                locale=locale,
                fallback=False,
            ),
            "missing": Lang.get("messages.unknown", locale=locale),
            "missing_exists": Lang.has("messages.unknown", locale=locale),
        }
```

Con `locale="es"`, fallback `en` y sin callback personalizado, el resultado es:

```json
{
  "text": "Available in English",
  "available": true,
  "translated_here": false,
  "missing": "messages.unknown",
  "missing_exists": false
}
```

`has()` no ejecuta el callback de claves ausentes. Es preferible a comparar `get(key) != key`: una traducción válida puede tener exactamente el mismo texto que su clave.

### Personalizar las claves ausentes

`Lang.missing(handler)` registra un callback síncrono con firma `(key: str, locale: str) -> str | None`. Recibe el idioma solicitado, aunque se haya consultado el fallback. Devuelve un `str` para reemplazar el mensaje o `None` para conservar la clave; los placeholders se aplican después sobre el texto resultante.

Configura este comportamiento una vez durante el arranque de la aplicación. `Lang.missing(None)` retira el callback. El registro es compartido: evita instalar y retirar callbacks por petición, llamar recursivamente al traductor desde el callback o pasar una función `async`.

## Seleccionar plurales con choice()

`Lang.choice(key, count, locale=None, **replace)` obtiene el mensaje con el mismo fallback que `get()`, selecciona un segmento y sustituye sus placeholders. `count` representa la cantidad y está disponible como `:count` sin tener que repetirlo en los argumentos de reemplazo.

```python
from orionis.support.facades import Lang


class ReportMessages:

    def summary(self, count: int, locale: str) -> str:
        return Lang.choice("messages.reports", count, locale=locale)
```

Para `locale="es"`:

| Cantidad | Resultado |
|---|---|
| `0` | `No hay informes` |
| `1` | `Un informe` |
| `2` | `2 informes` |
| `15` | `15 informes` |

Utiliza `choice()` para los mensajes con alternativas separadas por `|`. `get("messages.reports")` devuelve la línea completa, incluidos los selectores y separadores; no selecciona automáticamente una forma.

### Selectores exactos, rangos y comodines

| Sintaxis | Coincidencia |
|---|---|
| `{0}`, `{1}`, `{5}` | Cantidad numéricamente igual al valor indicado. |
| `[1,5]` | Desde `1` hasta `5`, ambos incluidos. |
| `[6,*]` | Desde `6`, sin límite superior. |
| `[*,0]` | Hasta `0`, sin límite inferior. |
| `{*}` | Cualquier cantidad; útil como último caso. |

Los segmentos se separan con `|`. El selector debe comenzar al inicio del segmento, por ejemplo `{0} Ninguno|[1,*] :count`. Puedes dejar espacios después de `}` o `]`; no insertes espacios antes del selector, tampoco después de `|`.

Un servicio puede usar las reglas de existencias y el caso universal definidos en los recursos:

```python
from orionis.support.facades import Lang


class InventoryMessages:

    def stock(self, quantity: int, locale: str) -> str:
        return Lang.choice("messages.stock", quantity, locale=locale)

    def notifications(self, quantity: int, locale: str) -> str:
        return Lang.choice("messages.universal", quantity, locale=locale)
```

Con español, `stock(0, "es")` devuelve `Sin existencias`; `stock(5, "es")` devuelve `Pocas existencias: 5`; `stock(6, "es")` devuelve `Existencias: 6`. `notifications(0, "es")` devuelve `No hay mensajes` y `notifications(8, "es")` devuelve `8 mensajes`.

Orionis recorre **todos los selectores explícitos en el orden escrito** y elige el primero que coincide. No existe una prioridad adicional de `{n}` sobre `[a,b]`. Coloca los casos específicos antes de un rango amplio y deja `{*}` al final para no ocultar los siguientes segmentos.

### Regla posicional sin coincidencia explícita

Si ningún selector explícito coincide:

- Con un único segmento se utiliza ese texto para cualquier cantidad.
- Con varios segmentos, `count == 1` selecciona el primero.
- Cualquier otra cantidad selecciona el segundo.

Los marcadores de condición se retiran del segmento seleccionado. Un tercer segmento sin condición no se selecciona mediante esta regla; añade selectores explícitos cuando necesites más casos.

```python
from orionis.support.facades import Lang


class ItemMessages:

    def summary(self, count: int, locale: str) -> str:
        return Lang.choice("messages.items", count, locale=locale)
```

En español, `summary(1, "es")` devuelve `Un artículo`; `summary(0, "es")` y `summary(7, "es")` devuelven `0 artículos` y `7 artículos`. La misma regla posicional se aplica en todos los idiomas: el framework no incorpora selección plural automática ICU/CLDR por locale.

### Límites de la selección plural

El argumento está anotado como `int`. Orionis no lo convierte ni valida internamente: valida cantidades provenientes de payloads antes de usarlas. Un valor no numérico puede producir un `TypeError` al compararse con los límites de un rango.

Los límites numéricos de las condiciones se interpretan con `float()`. Las condiciones malformadas no coinciden y pueden terminar en la regla posicional; no producen por sí solas un error de configuración. Cubre todas las cantidades que tu aplicación admite, especialmente `0` y valores negativos si los aceptas.

El carácter `|` siempre separa segmentos al usar `choice()`; no existe un mecanismo de escape para incluirlo como texto literal en una de las alternativas. Los espacios al principio y al final del texto seleccionado se eliminan.

## Referencia de consulta rápida

| Método | Uso |
|---|---|
| `Lang.get(key, locale=None, **replace)` | Devuelve el mensaje resuelto y reemplazado como `str`. |
| `Lang.has(key, locale=None, *, fallback=True)` | Devuelve `bool` e incluye el fallback salvo que se desactive. |
| `Lang.choice(key, count, locale=None, **replace)` | Selecciona un segmento plural y sustituye `:count` y los demás placeholders. |
| `Lang.getLocale()` | Devuelve el locale activo compartido; no identifica por sí solo el idioma de la petición. |
| `Lang.availableLocales()` | Devuelve una tupla ordenada de idiomas con fuentes descubiertas; no garantiza que cada clave esté traducida. |

La configuración inicial y la organización de los archivos se explican en [Configuración y recursos](/es/localization/messages-and-locales). El uso del mismo servicio mediante `ITranslator` y los helpers `trans`, `__` y `choice` se explica en [Aplicación y vistas](/es/localization/application-and-views).
