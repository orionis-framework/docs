---
title: "Eventos, scopes y ciclo del modelo"
description: "Eventos, scopes y ciclo del modelo en Orionis Framework."
editUrl: true
lastUpdated: false
---

Los comportamientos de entidad tienen guías independientes para poder consultarlos con precisión:

- [Scopes locales y globales](/es/database/orm/scopes): filtros reutilizables, argumentos, registro y exclusiones por consulta.
- [Eventos y observers](/es/database/orm/events): once eventos, orden, veto, callbacks async y relación con transacciones.
- [Eliminación lógica](/es/database/orm/soft-deletes): columna de borrado, visibilidad, restauración y purga.
- [Persistencia y estado](/es/database/orm/model-api): cambios pendientes, original, booleanos de escritura y diferencia entre entidad y builder.

Un scope limita una consulta, un evento envuelve una operación de instancia y soft deletes cambia la escritura/visibilidad de borrados. Combinar estos mecanismos no reemplaza autorización ni restricciones SQL. Para verificar cada interacción utiliza [las guías de pruebas](/es/database/orm/factories-and-testing).
