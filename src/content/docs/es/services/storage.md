---
title: "Storage"
description: "Usa Storage para guardar reportes, persistir cargas validadas, leer archivos y administrar contenido local o en la nube con una API async común. Un disco es una configuración…"
editUrl: true
lastUpdated: false
---

Usa `Storage` para guardar reportes, persistir cargas validadas, leer archivos y administrar contenido local o en la nube con una API async común. Un disco es una configuración de almacenamiento con nombre; la ruta de un archivo es relativa a la raíz de ese disco.

## Guardar un archivo privado de la aplicación

El disco `local` funciona sin SDK ni credenciales de servicios cloud. En el `.env` de tu aplicación, antes de iniciarla:

```dotenv
FILESYSTEM_DISK=local
LOCAL_PATH=storage/app/private
```

El proceso debe poder escribir en ese directorio. `config/filesystems.py` contiene las definiciones de discos. Después del arranque, invoca la fachada desde un controlador, comando o servicio async:

```python
from uuid import UUID
from orionis.support.facades import Storage


async def save_report(report_id: UUID, content: bytes) -> str:
    file = await Storage.disk("local").put(
        f"reports/{report_id}.txt", content, visibility="private",
    )
    return file.path()
```

El resultado es una ruta lógica dentro de `reports`, no una URL HTTP. Guarda esa ruta junto a los metadatos del reporte. Para leerlo después, recupera el registro autorizado y usa `await Storage.disk("local").file(saved_path).read()`; recibirás `bytes`.

`put()` reemplaza el contenido si la ruta ya existe. El disco privado predeterminado no se sirve públicamente. Devolver una ruta no autoriza la descarga ni publica el directorio: esa política pertenece a tu aplicación.

## Elegir el siguiente paso

1. [Archivos y directorios](/es/services/storage/files-and-directories): guardar, leer, consultar metadatos, copiar, mover, listar y eliminar.
2. [Contenido por bloques y cargas HTTP](/es/services/storage/streaming-and-uploads): validar archivos subidos y procesar archivos grandes con límites explícitos de memoria.
3. [Discos y drivers](/es/services/storage/disks-and-drivers): discos locales/públicos, dependencias opcionales S3/Azure/GCS, credenciales, URL y extensiones.

Los ejemplos con `MemoryStorageDriver` o directorios temporales son demostraciones independientes. En la aplicación utiliza normalmente la fachada `Storage` configurada y deja que la aplicación administre sus recursos.
