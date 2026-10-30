---
title: "Archivos, idiomas y configuración"
description: "Organiza archivos JSON, configura idiomas y comprende la resolución de claves y el fallback de Orionis."
editUrl: true
lastUpdated: false
---

Orionis lee traducciones desde archivos JSON UTF-8 y reúne las líneas de cada idioma en un mapa de claves. Puedes combinar claves de texto literal con archivos agrupados por responsabilidad. El directorio predeterminado es `resources/lang/`, relativo a la raíz de la aplicación.

## Configurar los idiomas de la aplicación

Los ajustes pertenecen a `config/app.py`, no a la configuración de vistas. Estos son los tres campos de la clase `BootstrapApp` relacionados con traducciones; conserva los demás campos de tu archivo:

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.app import App


@dataclass(frozen=True, kw_only=True)
class BootstrapApp(App):
    locale: str = field(
        default_factory=lambda: Env.get("APP_LOCALE", "en"),
    )
    fallback_locale: str = field(
        default_factory=lambda: Env.get("APP_FALLBACK_LOCALE", "en"),
    )
    language_path: str = field(
        default_factory=lambda: Env.get("APP_LANGUAGE_PATH", "resources/lang/"),
    )
```

| Campo | Variable de entorno | Valor predeterminado | Función |
| --- | --- | --- | --- |
| `locale` | `APP_LOCALE` | `"en"` | Idioma activo inicial del traductor compartido. |
| `fallback_locale` | `APP_FALLBACK_LOCALE` | `"en"` | Segundo idioma consultado cuando falta una clave. |
| `language_path` | `APP_LANGUAGE_PATH` | `"resources/lang/"` | Directorio que contiene todos los idiomas. |

Por ejemplo, en `.env`:

```dotenv
APP_LOCALE=es
APP_FALLBACK_LOCALE=en
APP_LANGUAGE_PATH=resources/lang/
```

`language_path` admite una ruta absoluta o una ruta relativa a `app.basePath`. La configuración valida que estos campos sean cadenas no vacías; el traductor valida también la sintaxis del código de idioma durante su construcción. No es necesario que cada código tenga archivos: un idioma sin fuentes produce un mapa vacío y permite continuar con el fallback.

Si configuras la aplicación explícitamente desde `bootstrap/app.py`, incorpora los campos a su llamada existente a `withConfigApp(...)`, antes de `app.create()`:

```python
app.withConfigApp(
    locale="es",
    fallback_locale="en",
    language_path="resources/lang/",
)
```

Conserva en esa misma llamada las demás opciones que ya utilice tu aplicación. El manager construye el traductor con estos valores al arrancar; modificar la configuración después no reconstruye el traductor ya resuelto.

## Crear los archivos de traducción

Una organización posible es:

```text
resources/lang/
├── en.json
├── es.json
├── en/
│   ├── shop.json
│   └── validation.json
└── es/
    ├── shop.json
    └── validation.json
```

Los archivos se crean directamente en el proyecto. No son módulos Python ni necesitan archivos de inicialización. El loader busca archivos con extensión `.json`; no interpreta YAML, archivos Python ni plantillas Jinja como fuentes de traducciones.

### Claves de texto literal

Utiliza `resources/lang/es.json` cuando prefieras traducir el propio texto fuente:

```json
{
  "Save changes": "Guardar cambios",
  "Welcome, :name": "Bienvenido, :name"
}
```

La clave se consulta completa, incluidos espacios, puntuación y mayúsculas. Por ejemplo, `Lang.get("Save changes", locale="es")` devuelve `Guardar cambios` y `Lang.get("Welcome, :name", locale="es", name="Ada")` devuelve `Bienvenido, Ada`.

### Archivos agrupados y objetos anidados

Utiliza `resources/lang/es/shop.json` para agrupar mensajes relacionados:

```json
{
  "welcome": "Bienvenido, :name",
  "account": {
    "title": "Tu cuenta",
    "updated": "Los datos se guardaron correctamente"
  },
  "cart": {
    "items": "{0} Tu carrito está vacío|{1} Tienes un artículo|[2,*] Tienes :count artículos"
  }
}
```

El nombre del archivo se convierte en el prefijo del grupo. Sus objetos se aplanan recursivamente:

| Clave resultante | Línea almacenada |
| --- | --- |
| `shop.welcome` | `Bienvenido, :name` |
| `shop.account.title` | `Tu cuenta` |
| `shop.account.updated` | `Los datos se guardaron correctamente` |
| `shop.cart.items` | La cadena completa con sus segmentos separados por `\|`. |

Los grupos se buscan únicamente como `resources/lang/<idioma>/*.json`. Los objetos dentro del JSON sí admiten anidamiento; los subdirectorios adicionales no se recorren. Para organizar un dominio, crea un archivo de grupo y utiliza objetos anidados dentro de él.

El archivo equivalente `resources/lang/en/shop.json` puede contener:

```json
{
  "welcome": "Welcome, :name",
  "account": {
    "title": "Your account",
    "updated": "Your details were saved successfully"
  },
  "cart": {
    "items": "{0} Your cart is empty|{1} You have one item|[2,*] You have :count items"
  },
  "help": "Contact support"
}
```

Consulta [traducir contenido](/es/localization/translating-content) para interpolación, comprobación de claves y selección de plurales.

### Precedencia cuando coinciden claves

Para cada idioma, el loader realiza este recorrido:

1. Lee los archivos agrupados en orden de nombre de archivo y aplana sus objetos.
2. Lee `<idioma>.json` y combina sus entradas al final.
3. Conserva el último valor escrito cuando dos entradas generan la misma clave.

Por ejemplo, `es/shop.json` puede definir `shop.account.title`, mientras `es.json` contiene:

```json
{
  "shop.account.title": "Mi cuenta"
}
```

En ese caso, `Lang.get("shop.account.title", locale="es")` devuelve `Mi cuenta`. El archivo raíz también aplana objetos anidados desde su propia clave, sin añadir un nombre de grupo. Evita definir una misma clave de varias maneras salvo que busques expresamente esta sustitución.

## Tipos y errores del JSON

La raíz de cada archivo debe ser un objeto JSON. Los objetos anidados se convierten en claves con puntos y las hojas deben ser textos de traducción. El loader acepta otras hojas, pero las convierte con `str()` de Python: un booleano `true` termina como `"True"`, `null` como `"None"` y una lista como su representación de Python. No se conservan como valores JSON tipados ni como listas de traducciones. Utiliza cadenas para obtener un resultado estable y explícito.

Un archivo inexistente o un directorio de idioma ausente no impide resolver otros idiomas. Si un archivo descubierto desaparece antes de leerlo, se lanza `TranslationFileNotFoundException`. JSON inválido, codificación incompatible o una raíz que no sea un objeto producen `TranslationSyntaxException`. Los errores de lectura del sistema de archivos pueden propagarse; el fallback se aplica a **claves ausentes**, no a errores al cargar una fuente dañada.

Los objetos vacíos no generan líneas. Las claves que ya contienen puntos se combinan con la misma notación que los objetos anidados, de modo que pueden colisionar con ellos. Mantén una convención uniforme dentro de cada grupo.

## Elegir y descubrir códigos de idioma

Utiliza códigos como `en`, `es`, `es-CO`, `pt_BR` o `zh-Hant`. El traductor admite grupos alfanuméricos separados por `-` o `_`; rechaza códigos vacíos, espacios habituales, barras y segmentos como `../es`. No verifica un registro de idiomas ni transforma el código a una forma canónica.

`es-CO`, `es_CO` y `es-co` son claves de idioma diferentes para el traductor. Crea archivos y consulta códigos con la misma escritura. En sistemas de archivos que no distinguen mayúsculas, el acceso al disco puede resultar menos estricto, pero el framework no normaliza los nombres.

`Lang.availableLocales()` devuelve una tupla ordenada con los nombres descubiertos en archivos raíz `.json` y directorios que contienen al menos un archivo `.json` directamente. El descubrimiento no analiza el contenido ni garantiza que sus nombres pasen la validación del traductor. Tampoco es una lista de idiomas instalados en Python ni una lista de mapas ya cargados en caché.

## Cómo se aplica el fallback

Con `locale="es-CO"` y `fallback_locale="en"`, una consulta busca la clave en `es-CO` y después en `en`. **No busca automáticamente en `es`**. Orionis utiliza el único fallback configurado, sin jerarquía regional ni lista adicional de idiomas.

Con los ejemplos anteriores y `APP_FALLBACK_LOCALE=en`, `Lang.get("shop.help", locale="es")` devuelve `Contact support`, porque la clave existe únicamente en inglés. Si tampoco existe en inglés, se consulta el handler de claves ausentes, si lo registraste; en caso contrario, se devuelve la propia clave. `Lang.has(..., fallback=False)` permite comprobar si la traducción está presente específicamente en el idioma solicitado.

Seleccionar `locale=` en una consulta no cambia el idioma activo compartido. Utiliza este argumento para peticiones de usuarios distintos, como se explica en [aplicación y vistas](/es/localization/application-and-views).

<a id="locale-cache-limits"></a>

## Límites de caché de idiomas y archivos ausentes

En **1.1.0**, `TranslationRepository(loader, *, max_locales=256, negative_ttl=30)` conserva hasta **256 mapas de idiomas por repositorio**, contando mapas poblados y vacíos. Las lecturas actualizan su uso reciente; al alcanzar la capacidad se expulsa el menos utilizado recientemente. Los resultados vacíos se vuelven a consultar después de **30 segundos** de forma predeterminada, evitando retener indefinidamente un idioma ausente que luego se añade.

`max_locales` debe ser un entero positivo sin booleanos. `negative_ttl` debe ser finito y no negativo; cero vuelve a consultar los resultados vacíos en la siguiente lectura. Son opciones del constructor del repositorio, no nuevas variables `APP_*`. Reemplaza su binding en un provider para utilizar otro límite.

Los mapas poblados no vigilan el filesystem y permanecen en caché hasta su expulsión o invalidación explícita. Siguen disponibles `forget()`, `flush()` y las APIs de recarga del traductor. La carga continúa siendo síncrona; precarga los idiomas necesarios durante el arranque si quieres evitar I/O de archivos en la primera petición. Los mapas cacheados se comparten dentro del repositorio, por lo que los consumidores no deben mutarlos.
