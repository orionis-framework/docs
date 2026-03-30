---
title: 'Inspiración'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Inspire

La clase `Inspire` es un servicio ligero integrado en Orionis que proporciona citas inspiracionales aleatorias. Su propósito es ofrecer mensajes motivacionales que pueden utilizarse en interfaces de línea de comandos, pantallas de bienvenida, logs de inicio u otros puntos del framework donde se desee añadir un toque personal.

El servicio incluye una colección curada de más de 360 citas de figuras históricas, líderes tecnológicos, artistas y pensadores. También permite inyectar colecciones personalizadas, lo que lo convierte en un componente flexible y extensible.

## Importación

```python
from orionis.services.inspirational.inspire import Inspire
```

## Inicialización

La clase `Inspire` acepta un parámetro opcional `quotes` con una lista personalizada de citas. Si no se proporciona o se pasa una lista vacía, el servicio utiliza automáticamente la colección predeterminada `INSPIRATIONAL_QUOTES`.

```python
from orionis.services.inspirational.inspire import Inspire

# Usar la colección predeterminada (360+ citas)
inspire = Inspire()

# Usar citas personalizadas
custom_quotes = [
    {"quote": "El código limpio siempre parece escrito por alguien a quien le importa.", "author": "Robert C. Martin"},
    {"quote": "La simplicidad es la sofisticación definitiva.", "author": "Leonardo da Vinci"},
]
inspire = Inspire(quotes=custom_quotes)
```

### Validación de Citas Personalizadas

Cuando se proporciona una lista personalizada, cada elemento es validado estrictamente:

- Debe ser un diccionario (`dict`)
- Debe contener exactamente las claves `quote` y `author`

Si algún elemento no cumple estas condiciones, se lanzará una excepción:

```python
# TypeError: elemento no es un diccionario
Inspire(quotes=["no es un dict"])

# ValueError: faltan claves requeridas
Inspire(quotes=[{"quote": "Sin autor"}])

# ValueError: faltan claves requeridas
Inspire(quotes=[{"author": "Sin cita"}])
```

## Contrato

La clase `Inspire` implementa el contrato `IInspire`, que define la interfaz pública del servicio:

```python
from orionis.services.inspirational.contracts.inspire import IInspire
```

El contrato declara un único método abstracto `random()`, lo que garantiza que cualquier implementación alternativa del servicio mantenga un comportamiento consistente.

## Obtener una Cita Aleatoria

### random

Retorna una cita inspiracional aleatoria seleccionada de la colección disponible. La selección utiliza `secrets.randbelow()` para generar un índice criptográficamente seguro.

```python
inspire = Inspire()
result = inspire.random()
# {"quote": "Logic will get you from A to B. Imagination will take you everywhere.", "author": "Albert Einstein"}
```

El resultado siempre es un diccionario con dos claves:

| Clave | Tipo | Descripción |
|---|---|---|
| `quote` | `str` | Texto de la cita inspiracional |
| `author` | `str` | Nombre del autor de la cita |

### Mecanismo de Fallback

Si por alguna razón la lista interna de citas está vacía en el momento de la llamada, el servicio retorna automáticamente una cita de respaldo predeterminada en lugar de lanzar una excepción:

```python
{
    "quote": "Greatness is not measured by what you build, but by what you inspire others to create.",
    "author": "Raul M. Uñate"
}
```

Este mecanismo garantiza que `random()` siempre retorne un resultado válido, sin importar el estado interno del servicio.

## Colección Predeterminada

La colección predeterminada está definida en el módulo `quotes` y contiene más de 360 citas cuidadosamente seleccionadas:

```python
from orionis.services.inspirational.quotes import INSPIRATIONAL_QUOTES
```

Cada entrada de la colección sigue la misma estructura `{"quote": str, "author": str}` y contiene citas de personalidades como:

- **Ciencia y Tecnología**: Albert Einstein, Steve Wozniak, Galileo Galilei
- **Liderazgo**: Eleanor Roosevelt, Napoleon Bonaparte, Sun Tzu
- **Arte y Cultura**: Maya Angelou, David Bowie, Roald Dahl
- **Deporte**: Simone Biles, Lionel Messi, Diego Maradona
- **Filosofía**: Confucius, Euripides, Archimedes

La colección no contiene citas duplicadas y cada entrada está validada con las claves requeridas.

## Ejemplo Completo

```python
from orionis.services.inspirational.inspire import Inspire

# Instanciar con la colección por defecto
inspire = Inspire()

# Obtener una cita aleatoria
quote = inspire.random()
print(f'"{quote["quote"]}" — {quote["author"]}')

# Usar citas personalizadas para un proyecto específico
project_quotes = [
    {"quote": "Primero resuelve el problema. Después, escribe el código.", "author": "John Johnson"},
    {"quote": "La experiencia es simplemente el nombre que le damos a nuestros errores.", "author": "Oscar Wilde"},
    {"quote": "El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor es ahora.", "author": "Proverbio Chino"},
]

inspire = Inspire(quotes=project_quotes)
quote = inspire.random()
print(f'"{quote["quote"]}" — {quote["author"]}')
```