---
title: 'Inspirational'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Inspire

The `Inspire` class is a lightweight service built into Orionis that provides random inspirational quotes. Its purpose is to deliver motivational messages that can be used in command-line interfaces, welcome screens, startup logs, or other points in the framework where a personal touch is desired.

The service includes a curated collection of over 360 quotes from historical figures, technology leaders, artists, and thinkers. It also allows injecting custom collections, making it a flexible and extensible component.

## Import

```python
from orionis.services.inspirational.inspire import Inspire
```

## Initialization

The `Inspire` class accepts an optional `quotes` parameter with a custom list of quotes. If not provided or if an empty list is passed, the service automatically uses the default `INSPIRATIONAL_QUOTES` collection.

```python
from orionis.services.inspirational.inspire import Inspire

# Use the default collection (360+ quotes)
inspire = Inspire()

# Use custom quotes
custom_quotes = [
    {"quote": "Clean code always looks like it was written by someone who cares.", "author": "Robert C. Martin"},
    {"quote": "Simplicity is the ultimate sophistication.", "author": "Leonardo da Vinci"},
]
inspire = Inspire(quotes=custom_quotes)
```

### Custom Quotes Validation

When a custom list is provided, each element is strictly validated:

- Must be a dictionary (`dict`)
- Must contain exactly the keys `quote` and `author`

If any element does not meet these conditions, an exception will be raised:

```python
# TypeError: element is not a dictionary
Inspire(quotes=["not a dict"])

# ValueError: missing required keys
Inspire(quotes=[{"quote": "No author"}])

# ValueError: missing required keys
Inspire(quotes=[{"author": "No quote"}])
```

## Contract

The `Inspire` class implements the `IInspire` contract, which defines the public interface of the service:

```python
from orionis.services.inspirational.contracts.inspire import IInspire
```

The contract declares a single abstract method `random()`, ensuring that any alternative implementation of the service maintains consistent behavior.

## Getting a Random Quote

### random

Returns a random inspirational quote selected from the available collection. The selection uses `secrets.randbelow()` to generate a cryptographically secure index.

```python
inspire = Inspire()
result = inspire.random()
# {"quote": "Logic will get you from A to B. Imagination will take you everywhere.", "author": "Albert Einstein"}
```

The result is always a dictionary with two keys:

| Key | Type | Description |
|---|---|---|
| `quote` | `str` | Text of the inspirational quote |
| `author` | `str` | Name of the quote's author |

### Fallback Mechanism

If for any reason the internal quote list is empty at the time of the call, the service automatically returns a default fallback quote instead of raising an exception:

```python
{
    "quote": "Greatness is not measured by what you build, but by what you inspire others to create.",
    "author": "Raul M. Uñate"
}
```

This mechanism ensures that `random()` always returns a valid result, regardless of the service's internal state.

## Default Collection

The default collection is defined in the `quotes` module and contains over 360 carefully selected quotes:

```python
from orionis.services.inspirational.quotes import INSPIRATIONAL_QUOTES
```

Each entry in the collection follows the same `{"quote": str, "author": str}` structure and includes quotes from personalities such as:

- **Science & Technology**: Albert Einstein, Steve Wozniak, Galileo Galilei
- **Leadership**: Eleanor Roosevelt, Napoleon Bonaparte, Sun Tzu
- **Art & Culture**: Maya Angelou, David Bowie, Roald Dahl
- **Sports**: Simone Biles, Lionel Messi, Diego Maradona
- **Philosophy**: Confucius, Euripides, Archimedes

The collection contains no duplicate quotes and every entry is validated with the required keys.

## Complete Example

```python
from orionis.services.inspirational.inspire import Inspire

# Instantiate with the default collection
inspire = Inspire()

# Get a random quote
quote = inspire.random()
print(f'"{quote["quote"]}" — {quote["author"]}')

# Use custom quotes for a specific project
project_quotes = [
    {"quote": "First, solve the problem. Then, write the code.", "author": "John Johnson"},
    {"quote": "Experience is simply the name we give our mistakes.", "author": "Oscar Wilde"},
    {"quote": "The best time to plant a tree was 20 years ago. The second best time is now.", "author": "Chinese Proverb"},
]

inspire = Inspire(quotes=project_quotes)
quote = inspire.random()
print(f'"{quote["quote"]}" — {quote["author"]}')
```