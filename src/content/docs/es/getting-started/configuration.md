---
title: Configuración
---

## Archivos de Configuración

`Orionis Framework` gestiona la configuración de la aplicación mediante dataclasses, centralizando los parámetros en el directorio `config/`. Estos archivos permiten definir aspectos clave como la base de datos, correo electrónico, sesiones y otros comportamientos esenciales.

Cada archivo extiende una clase base con valores predeterminados, que puedes sobrescribir según los requisitos de tu proyecto.

A continuación se detallan los archivos de configuración principales, sus propiedades y opciones disponibles.

### `app.py`

El archivo `app.py` contiene la configuración principal de la aplicación `Orionis Framework`, definiendo parámetros esenciales como el entorno de ejecución, debugging, red, trabajadores, localización y cifrado. Esta configuración centralizada permite adaptar el comportamiento de la aplicación según las necesidades del proyecto y el entorno de despliegue.

#### ¿Cómo funciona la configuración de aplicación en Orionis Framework?

La configuración se define mediante una `dataclass` que extiende la clase base `App`, utilizando variables de entorno para valores específicos y proporcionando valores predeterminados seguros. Esto permite mantener configuraciones diferentes para desarrollo, pruebas y producción sin modificar el código.

#### Estructura de configuración

```python
# app.py
from dataclasses import dataclass
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.ciphers import Cipher
from orionis.foundation.config.app.enums.environments import Environments
from orionis.services.environment.env import Env
from orionis.services.system.workers import Workers

@dataclass
class BootstrapApp(App):
    # ... propiedades de configuración
```

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

- **`name`**
    Nombre identificativo de la aplicación.
    - Se carga desde la variable de entorno `APP_NAME` o usa `'Orionis Application'` por defecto.
    - Utilizado en títulos del navegador, logs y referencias internas del framework.
    - Ejemplo: `name = Env.get('APP_NAME', 'Mi Aplicación Web')`

- **`env`**
    Entorno de ejecución de la aplicación.
    - Se carga desde `APP_ENV` o usa `Environments.DEVELOPMENT` por defecto.
    - Opciones disponibles: `DEVELOPMENT`, `TESTING`, `PRODUCTION`.
    - Afecta el comportamiento de logging, manejo de errores y optimizaciones.

    Puedes usar el `ENUM` proporcionado por Orionis Framework:
    ```python
    from orionis.foundation.config.app.enums.environments import Environments

    # Opciones disponibles:
    Environments.DEVELOPMENT
    Environments.PRODUCTION
    Environments.TESTING
    ```

    O asignar el entorno como cadena de texto:
    ```python
    env = "development"  # O "production", "testing"
    ```

- **`debug`**
    Modo de depuración de la aplicación.
    - Se carga desde `APP_DEBUG` o usa `True` por defecto.
    - Cuando está activo (`True`): muestra errores detallados, habilita recarga automática y logs verbosos.
    - **Importante:** Debe estar desactivado (`False`) en producción por seguridad.

- **`host`**
    Dirección IP donde escucha la aplicación.
    - Se carga desde `APP_HOST` o usa `'127.0.0.1'` por defecto.
    - `'127.0.0.1'`: Solo acceso local (recomendado con proxy inverso como `Nginx` o `Apache`).
    - `'0.0.0.0'`: Permite acceso externo directo (usar con precaución en producción).

- **`port`**
    Puerto de red donde escucha la aplicación.
    - Se carga desde `APP_PORT` o usa `8000` por defecto.
    - Puertos inferiores a `1024` requieren permisos de administrador.
    - Sugerencias comunes: `80` para HTTP, `443` para HTTPS en producción.

- **`workers`**
    Número de procesos trabajadores para manejar solicitudes concurrentes.
    - Se carga desde `APP_WORKERS` o usa `Workers().calculate()` para cálculo automático.
    - Por defecto es `1`, pero puedes aumentarlo para mejorar el rendimiento en producción.

    Considera si tu aplicación es `stateful` (mantiene estado en memoria) o `stateless` (cada solicitud es independiente):

    - **Stateful**: Mantén `workers = 1` o implementa el sistema de `Cache` de Orionis Framework (por ejemplo, usando `Memcached` o `Redis` en un contenedor separado) para compartir estado entre procesos.
    - **Stateless**: Puedes aumentar el número de trabajadores según la capacidad del servidor. Una regla general es `2 × núcleos de CPU + 1`.

    Orionis Framework permite calcular automáticamente el número óptimo de trabajadores:
    ```python
    from orionis.services.system.workers import Workers

    workers = Workers()
    real_workers = workers.calculate()
    ```

    Ejemplo recomendado en `app.py`:
    ```python
    from orionis.services.system.workers import Workers

    @dataclass
    class BootstrapApp(App):
        workers = Env.get('APP_WORKERS', Workers().calculate())
    ```

    Para asignar memoria por trabajador:
    ```python
    workers = Env.get('APP_WORKERS', Workers(ram_per_worker=0.5).calculate())
    # O
    workers = Env.get('APP_WORKERS', Workers().setRamPerWorker(0.5).calculate())
    ```

    **Nota importante**: Usa la clase directamente en los archivos de configuración, ya que la `facade` solo está disponible tras el bootstrap de la aplicación.

- **`reload`**
    Recarga automática al detectar cambios en el código.
    - Se carga desde `APP_RELOAD` o usa `True` por defecto.
    - Útil en desarrollo, debe estar desactivado (`False`) en producción.
    - Solo funciona con `workers = 1`.

- **`timezone`**
    Zona horaria predeterminada de la aplicación.
    - Se carga desde `APP_TIMEZONE` o usa `'America/Bogota'` por defecto.
    - Puedes establecer cualquier zona válida, como `'UTC'`, `'America/New_York'`, `'Europe/Madrid'`, `'America/Bogota'`, etc.
    - Afecta el formateo de fechas y horas en toda la aplicación.

- **`locale`**
    Configuración regional predeterminada.
    - Se carga desde `APP_LOCALE` o usa `'en'` por defecto.
    - Puedes cambiarla a `'es'`, `'fr'`, `'de'`, etc.
    - Define idioma para mensajes, formatos de número y fecha.

- **`fallback_locale`**
    Configuración regional de respaldo.
    - Se carga desde `APP_FALLBACK_LOCALE` o usa `'en'` por defecto.
    - Se utiliza cuando el idioma principal no está disponible.
    - Garantiza que la aplicación siempre tenga un idioma funcional.

- **`cipher`**
    Algoritmo de cifrado para proteger datos sensibles.
    - Se carga desde `APP_CIPHER` o usa `Cipher.AES_256_CBC` por defecto.
    - Valor predeterminado: `AES-256-CBC`. Opciones disponibles: `AES-128-CBC`, `AES-256-CBC`, `AES-128-GCM`, `AES-256-GCM`.
    - `AES-256` ofrece mayor seguridad que `AES-128`.
    - `GCM` proporciona cifrado autenticado, `CBC` es más compatible.

    Orionis Framework proporciona un `ENUM` para los algoritmos de cifrado:
    ```python
    from orionis.foundation.config.app.enums.ciphers import Cipher

    # Opciones disponibles:
    Cipher.AES_128_CBC
    Cipher.AES_256_CBC
    Cipher.AES_128_GCM
    Cipher.AES_256_GCM
    ```

- **`key`**
    Clave de cifrado utilizada por el algoritmo especificado.
    - Se carga desde `APP_KEY` (sin valor predeterminado por seguridad).
    - **Crítico:** Debe ser una clave segura, única y secreta por aplicación.
    - Almacénala siempre en variables de entorno, nunca en código fuente.
    - Cambia esta clave si se compromete la seguridad.

#### Recomendaciones de configuración

- **Desarrollo:** Usa `debug=True`, `reload=True`, `workers=1` para facilitar el desarrollo.
- **Producción:** Configura `debug=False`, `reload=False`, optimiza `workers` según hardware.
- **Seguridad:** Mantén `key` en variables de entorno y usa HTTPS en producción.
- **Variables de entorno:** Utiliza archivos `.env` para configuraciones específicas del entorno.

#### Consideraciones adicionales

- Los cambios en `app.py` requieren reinicio de la aplicación para aplicarse.
- El framework valida automáticamente los tipos y valores de configuración.
- Usa `Workers().calculate()` para aprovechar el cálculo automático de trabajadores óptimos.
- La configuración se carga una vez al inicializar la aplicación y permanece inmutable durante la ejecución.

### `auth.py`

Este archivo de configuracion aun se encuentra en desarrollo y estará disponible en futuras versiones de `Orionis Framework`.

### `cache.py`

Este archivo de configuracion aun se encuentra en desarrollo y estará disponible en futuras versiones de `Orionis Framework`.

### `cors.py`

El archivo `cors.py` permite configurar el comportamiento de CORS (Cross-Origin Resource Sharing) en tu aplicación Orionis Framework, controlando cómo y desde dónde pueden acceder los clientes a tu API. CORS es esencial para la seguridad y funcionalidad de aplicaciones web modernas, ya que define qué orígenes externos pueden interactuar con tu backend y bajo qué condiciones.

#### ¿Cómo funciona CORS en Orionis Framework?

Cuando un navegador realiza una solicitud a tu API desde un origen diferente (dominio, protocolo o puerto), el servidor responde con cabeceras CORS que indican si la solicitud está permitida. `Orionis Framework` utiliza la configuración definida en `cors.py` para generar estas cabeceras automáticamente en cada respuesta.

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

- **`allow_origins`**
    Lista de orígenes permitidos para acceder a la API.
    - Usa `["*"]` para permitir cualquier origen (no recomendado en producción por motivos de seguridad).
    - Puedes especificar dominios concretos, por ejemplo: `["https://miapp.com", "https://admin.miapp.com"]`.
    - Si la solicitud proviene de un origen no incluido, será rechazada por el navegador.

- **`allow_origin_regex`**
    Expresión regular para permitir orígenes que coincidan con un patrón.
    - Útil para permitir subdominios dinámicos, por ejemplo: `r"^https://.*\.miapp\.com$"`.
    - Si se define, tiene prioridad sobre `allow_origins`.

- **`allow_methods`**
    Lista de métodos HTTP permitidos en solicitudes CORS.
    - Usa `["*"]` para permitir todos los métodos (`GET`, `POST`, `PUT`, `DELETE`, etc.).
    - Puedes restringir a métodos específicos: `["GET", "POST"]`.

- **`allow_headers`**
    Lista de cabeceras HTTP que el cliente puede enviar en solicitudes CORS.
    - Usa `["*"]` para permitir todas las cabeceras.
    - Para mayor seguridad, limita a las necesarias: `["Authorization", "Content-Type"]`.

- **`expose_headers`**
    Lista de cabeceras que el navegador puede acceder en la respuesta.
    - Por defecto, el navegador solo expone cabeceras estándar.
    - Ejemplo: `["X-Custom-Header", "Authorization"]`.

- **`allow_credentials`**
    Permite el uso de credenciales (cookies, cabeceras de autorización, etc.) en solicitudes CORS.
    - Si está en `True`, el navegador enviará y recibirá credenciales.
    - Importante: No se puede usar `["*"]` en `allow_origins` si `allow_credentials` es `True` (por restricciones del estándar CORS).

- **`max_age`**
    Tiempo máximo (en segundos) que el navegador puede cachear la respuesta de la solicitud preflight (`OPTIONS`).
    - Reduce la cantidad de solicitudes preflight y mejora el rendimiento.
    - Ejemplo: `max_age = 600` (10 minutos).

#### Recomendaciones de seguridad

- **Producción:** Limita los orígenes y métodos permitidos, y activa credenciales solo si es necesario.
- **Desarrollo:** Puedes usar valores más permisivos (`["*"]`) para facilitar pruebas, pero nunca los uses en producción.
- **Cabeceras personalizadas:** Expón solo las cabeceras necesarias para tu frontend.

#### Consideraciones adicionales

- Si usas credenciales (`allow_credentials = True`), debes especificar orígenes concretos en `allow_origins`.
- Los cambios en `cors.py` se aplican automáticamente al reiniciar la aplicación.
- `Orionis Framework` valida y aplica estas reglas en cada solicitud, asegurando cumplimiento con el estándar CORS.
- Es necesario que se use `field` para asignar listas en las propiedades de configuración, esto debido a limitaciones de las `dataclasses` en Python.

Ejemplo:
```python
# cors.py
from dataclasses import dataclass, field

#...
@dataclass
class BootstrapCors(Cors):

    # ...
    allow_origins: List[str] = field(
        default_factory = lambda: ["myapp.com", "admin.myapp.com"]
    )
```

Esta configuración te permite adaptar el acceso a tu API según las necesidades de tu proyecto, manteniendo un equilibrio entre funcionalidad y seguridad.

### `database.py`

Este archivo de configuracion aun se encuentra en desarrollo y estará disponible en futuras versiones de `Orionis Framework`.

### `filesystems.py`

El archivo `filesystems.py` define la configuración del sistema de archivos de `Orionis Framework`, permitiendo gestionar diferentes tipos de almacenamiento como discos locales, almacenamiento público y servicios en la nube como AWS S3. Esta configuración centralizada facilita el manejo de archivos tanto para uso interno de la aplicación como para archivos públicos accesibles por los usuarios.

#### ¿Cómo funciona el sistema de archivos en Orionis Framework?

El sistema de archivos utiliza el patrón de múltiples discos, donde cada disco representa una ubicación de almacenamiento diferente con sus propias configuraciones. Puedes cambiar dinámicamente entre discos según las necesidades de tu aplicación, permitiendo flexibilidad en el almacenamiento de diferentes tipos de archivos.

#### Estructura de configuración

```python
# filesystems.py
from dataclasses import dataclass
from orionis.foundation.config.filesystems.entitites.aws import S3
from orionis.foundation.config.filesystems.entitites.disks import Disks
from orionis.foundation.config.filesystems.entitites.filesystems import Filesystems
from orionis.foundation.config.filesystems.entitites.local import Local
from orionis.foundation.config.filesystems.entitites.public import Public

@dataclass
class BootstrapFilesystems(Filesystems):
    # ... propiedades de configuración
```

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

- **`default`**
    Nombre del disco de sistema de archivos predeterminado a utilizar.
    - Valor por defecto: El valor de la variable de entorno `"FILESYSTEM_DISK"` o de lo contrario `"local"`.
    - Especifica qué disco se utilizará cuando no se indique uno específicamente.
    - Opciones comunes: `"local"`, `"public"`, `"aws"`.

- **`disks`**
    Configuración de los diferentes discos de sistema de archivos disponibles para la aplicación.
    - Valor por defecto: Una instancia de `Disks` con valores predeterminados.
    - Contiene la configuración para cada tipo de almacenamiento disponible.

#### Configuración de discos disponibles

##### **`local`** - Disco local privado
Configuración para el almacenamiento local privado de la aplicación.
- **`path`**: Ruta donde se almacenan los archivos privados.
- Valor por defecto: `"storage/app/private"`.
- Ideal para: Archivos de configuración, logs internos, datos temporales que no deben ser públicos.

##### **`public`** - Disco público
Configuración para el almacenamiento público accesible vía web.
- **`path`**: Ruta donde se almacenan los archivos públicos.
  - Valor por defecto: `"storage/app/public"`.
- **`url`**: URL base para acceder a los archivos públicos.
  - Valor por defecto: `"/static"`.
- Ideal para: Imágenes de usuarios, assets públicos, archivos descargables.

##### **`aws`** - Amazon S3
Configuración para almacenamiento en la nube usando Amazon S3.
- **`key`**: Clave de acceso AWS (AWS Access Key ID).
  - Valor por defecto: `""` (debe configurarse).
  - Obtener desde la consola de AWS IAM.

- **`secret`**: Clave secreta AWS (AWS Secret Access Key).
  - Valor por defecto: `""` (debe configurarse).
  - Mantener segura y nunca exponer en código fuente.

- **`region`**: Región de AWS donde se encuentra el bucket.
  - Valor por defecto: `"us-east-1"`.
  - Ejemplos: `"us-west-2"`, `"eu-west-1"`, `"ap-southeast-1"`.

- **`bucket`**: Nombre del bucket de S3.
  - Valor por defecto: `""` (debe configurarse).
  - Debe existir previamente en tu cuenta de AWS.

- **`url`**: URL personalizada para acceder al bucket (opcional).
  - Valor por defecto: `None` (usa la URL estándar de S3).
  - Útil para CloudFront o dominios personalizados.

- **`endpoint`**: Endpoint personalizado de S3 (opcional).
  - Valor por defecto: `None` (usa el endpoint estándar).
  - Útil para servicios compatibles con S3 como MinIO.

- **`use_path_style_endpoint`**: Usar estilo de ruta en lugar de subdominio virtual.
  - Valor por defecto: `False`.
  - Cambiar a `True` para servicios compatibles con S3 que lo requieran.

- **`throw`**: Lanzar excepciones en errores de operación.
  - Valor por defecto: `False`.
  - Cambiar a `True` para manejo estricto de errores.

#### Recomendaciones de configuración

- **Desarrollo:** Usa principalmente discos `local` y `public` para simplicidad y rapidez.
- **Producción:** Considera usar `aws` para escalabilidad y redundancia en aplicaciones grandes.
- **Seguridad:** Mantén las credenciales de AWS en variables de entorno, nunca en código fuente.
- **Rendimiento:** Usa `public` para archivos estáticos frecuentemente accedidos.

#### Consideraciones adicionales

- Los cambios en `filesystems.py` requieren reinicio de la aplicación para aplicarse.
- Asegúrate de que las rutas de almacenamiento local tengan permisos de escritura apropiados.
- Para AWS S3, verifica que las credenciales tengan los permisos necesarios en el bucket.
- El framework valida automáticamente las configuraciones y proporciona mensajes de error descriptivos si algo está mal configurado.

### `logging.py`

El archivo `logging.py` define la configuración del sistema de logging de `Orionis Framework`, permitiendo gestionar diferentes canales de registro con estrategias de rotación, retención y niveles de log personalizados. Esta configuración centralizada facilita el monitoreo, debugging y auditoría de la aplicación mediante un sistema flexible de logs estructurados.

#### ¿Cómo funciona el sistema de logging en Orionis Framework?

El sistema de logging utiliza múltiples canales, donde cada canal representa una estrategia diferente de almacenamiento y rotación de logs. Puedes configurar diferentes niveles de logging, rutas de archivos, políticas de retención y estrategias de rotación según las necesidades de monitoreo de tu aplicación.

#### Estructura de configuración

```python
# logging.py
from dataclasses import dataclass
from datetime import time
from orionis.foundation.config.logging.entities.channels import Channels
from orionis.foundation.config.logging.entities.chunked import Chunked
from orionis.foundation.config.logging.entities.daily import Daily
from orionis.foundation.config.logging.entities.hourly import Hourly
from orionis.foundation.config.logging.entities.logging import Logging
from orionis.foundation.config.logging.entities.monthly import Monthly
from orionis.foundation.config.logging.entities.stack import Stack
from orionis.foundation.config.logging.entities.weekly import Weekly
from orionis.foundation.config.logging.enums.levels import Level

@dataclass
class BootstrapLogging(Logging):
    # ... propiedades de configuración
```

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

- **`default`**
    Nombre del canal de logging predeterminado a utilizar.
    - Valor por defecto: El valor de la variable de entorno `"LOG_CHANNEL"` o de lo contrario `"stack"`.
    - Especifica qué canal se utilizará cuando no se indique uno específicamente.
    - Opciones disponibles: `"stack"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"chunked"`.

- **`channels`**
    Configuración de los diferentes canales de logging disponibles para la aplicación.
    - Valor por defecto: Una instancia de `Channels` con configuraciones predeterminadas.
    - Contiene la configuración para cada estrategia de logging disponible.

#### Configuración de canales de logging disponibles

##### **`stack`** - Logging acumulativo
Configuración para logging básico sin rotación automática.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/stack.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- Ideal para: Desarrollo, logs simples, debugging básico.

##### **`hourly`** - Rotación por horas
Configuración para logging con rotación cada hora.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/hourly.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- **`retention_hours`**: Horas de retención de archivos.
  - Valor por defecto: `24` (mantiene logs de las últimas 24 horas).
- Ideal para: Aplicaciones con alta actividad, monitoreo granular de eventos.

##### **`daily`** - Rotación diaria
Configuración para logging con rotación cada día.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/daily.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- **`retention_days`**: Días de retención de archivos.
  - Valor por defecto: `7` (mantiene logs de la última semana).
- **`at`**: Hora específica para la rotación.
  - Valor por defecto: `time(0, 0)` (medianoche).
- Ideal para: Aplicaciones en producción, auditoría diaria, análisis de tendencias.

##### **`weekly`** - Rotación semanal
Configuración para logging con rotación cada semana.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/weekly.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- **`retention_weeks`**: Semanas de retención de archivos.
  - Valor por defecto: `4` (mantiene logs del último mes).
- Ideal para: Análisis de tendencias semanales, reportes periódicos, aplicaciones con menor actividad.

##### **`monthly`** - Rotación mensual
Configuración para logging con rotación cada mes.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/monthly.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- **`retention_months`**: Meses de retención de archivos.
  - Valor por defecto: `4` (mantiene logs de los últimos 4 meses).
- Ideal para: Archivos históricos, cumplimiento regulatorio, análisis a largo plazo.

##### **`chunked`** - Rotación por tamaño
Configuración para logging con rotación basada en el tamaño del archivo.
- **`path`**: Ruta del archivo de log.
  - Valor por defecto: `'storage/logs/chunked.log'`.
- **`level`**: Nivel mínimo de logging.
  - Valor por defecto: `Level.INFO`.
- **`mb_size`**: Tamaño máximo del archivo en MB.
  - Valor por defecto: `10` MB.
- **`files`**: Número máximo de archivos a mantener.
  - Valor por defecto: `5` archivos.
- Ideal para: Control de espacio en disco, aplicaciones con volumen de logs variable.

#### Niveles de logging disponibles

Los niveles de logging siguen el estándar de logging de Python:

- **`Level.DEBUG`**: Información detallada para debugging.
- **`Level.INFO`**: Información general de funcionamiento.
- **`Level.WARNING`**: Advertencias que no impiden el funcionamiento.
- **`Level.ERROR`**: Errores que afectan funcionalidades específicas.
- **`Level.CRITICAL`**: Errores críticos que pueden detener la aplicación.

#### Recomendaciones de configuración

- **Desarrollo:** Usa `stack` o `daily` con nivel `DEBUG` para máxima información.
- **Producción:** Combina `daily` para logs generales y `chunked` para control de espacio.
- **Monitoreo intensivo:** Usa `hourly` para aplicaciones críticas con alta actividad.
- **Archivos históricos:** Configura `monthly` para cumplimiento y auditorías a largo plazo.

#### Consideraciones adicionales

- Los archivos de log se rotan automáticamente según la estrategia configurada.
- Asegúrate de que las rutas de logging tengan permisos de escritura apropiados.
- Los logs antiguos se eliminan automáticamente según las políticas de retención.
- El framework maneja automáticamente la creación de directorios si no existen.
- Puedes usar múltiples canales simultáneamente para diferentes tipos de eventos.

### `mail.py`

El archivo `mail.py` define la configuración del sistema de correo electrónico de `Orionis Framework`, permitiendo gestionar diferentes transportes de email como SMTP para envío real y archivos locales para desarrollo y testing. Esta configuración centralizada facilita el envío de correos electrónicos desde la aplicación con soporte para múltiples proveedores y estrategias de entrega.

#### ¿Cómo funciona el sistema de correo en Orionis Framework?

El sistema de correo utiliza múltiples mailers (transportes), donde cada mailer representa una estrategia diferente de entrega de correos electrónicos. Puedes alternar entre diferentes transportes según el entorno (desarrollo, testing, producción) sin cambiar el código de la aplicación, solo modificando la configuración.

#### Estructura de configuración

```python
# mail.py
from dataclasses import dataclass
from orionis.foundation.config.mail.entities.file import File
from orionis.foundation.config.mail.entities.mail import Mail
from orionis.foundation.config.mail.entities.mailers import Mailers
from orionis.foundation.config.mail.entities.smtp import Smtp
from orionis.services.environment.env import Env

@dataclass
class BootstrapMail(Mail):
    # ... propiedades de configuración
```

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

- **`default`**
    Nombre del mailer (transporte) predeterminado a utilizar para el envío de correos.
    - Se carga desde la variable de entorno `MAIL_MAILER` o usa `'smtp'` por defecto.
    - Especifica qué transporte se utilizará cuando no se indique uno específicamente.
    - Opciones disponibles: `"smtp"`, `"file"`, etc.

- **`mailers`**
    Configuración de los diferentes transportes de correo disponibles para la aplicación.
    - Valor por defecto: Una instancia de `Mailers` con configuraciones predeterminadas.
    - Contiene la configuración para cada estrategia de envío de correo disponible.

#### Configuración de transportes de correo disponibles

##### **`smtp`** - Servidor SMTP
Configuración para envío de correos electrónicos a través de servidor SMTP.
- **`url`**: URL completa de conexión SMTP (opcional, alternativa a configuración individual).
  - Se carga desde `MAIL_URL` o usa `''` por defecto.
  - Formato: `smtp://usuario:contraseña@servidor:puerto`
  - Si se define, tiene prioridad sobre las configuraciones individuales.

- **`host`**: Servidor SMTP para envío de correos.
  - Se carga desde `MAIL_HOST` o usa `''` por defecto.
  - Ejemplos: `smtp.gmail.com`, `smtp.mailgun.org`, `localhost`.

- **`port`**: Puerto del servidor SMTP.
  - Se carga desde `MAIL_PORT` o usa `587` por defecto.
  - Puertos comunes: `25` (sin cifrado), `587` (STARTTLS), `465` (SSL/TLS).

- **`encryption`**: Tipo de cifrado para la conexión SMTP.
  - Se carga desde `MAIL_ENCRYPTION` o usa `'TLS'` por defecto.
  - Opciones: `'TLS'` (STARTTLS), `'SSL'` (SSL/TLS), `None` (sin cifrado).

- **`username`**: Usuario para autenticación SMTP.
  - Se carga desde `MAIL_USERNAME` o usa `''` por defecto.
  - Generalmente es la dirección de email o un nombre de usuario específico.

- **`password`**: Contraseña para autenticación SMTP.
  - Se carga desde `MAIL_PASSWORD` o usa `''` por defecto.
  - **Importante:** Mantener siempre en variables de entorno por seguridad.

- **`timeout`**: Tiempo de espera para conexiones SMTP en segundos.
  - Valor por defecto: `None` (usa el timeout predeterminado del sistema).
  - Útil para ajustar comportamiento en redes lentas o servidores remotos.

##### **`file`** - Almacenamiento en archivos
Configuración para guardar correos como archivos en lugar de enviarlos.
- **`path`**: Directorio donde se almacenan los correos como archivos.
  - Valor por defecto: `"storage/mail"`.
  - Los correos se guardan en formato `.eml` para inspección posterior.
- Ideal para: Desarrollo, testing, debugging de correos sin envío real.

#### Configuración de proveedores SMTP populares

##### Gmail
```python
smtp = Smtp(
    host = "smtp.gmail.com",
    port = 587,
    encryption = "TLS",
    username = "tu_email@gmail.com",
    password = "tu_contraseña_de_aplicación"
)
```

##### Outlook/Hotmail
```python
smtp = Smtp(
    host = "smtp-mail.outlook.com",
    port = 587,
    encryption = "TLS",
    username = "tu_email@outlook.com",
    password = "tu_contraseña"
)
```

##### SendGrid
```python
smtp = Smtp(
    host = "smtp.sendgrid.net",
    port = 587,
    encryption = "TLS",
    username = "apikey",
    password = "tu_api_key_de_sendgrid"
)
```

##### Mailgun
```python
smtp = Smtp(
    host = "smtp.mailgun.org",
    port = 587,
    encryption = "TLS",
    username = "postmaster@tu_dominio.mailgun.org",
    password = "tu_contraseña_de_mailgun"
)
```

#### Recomendaciones de configuración

- **Desarrollo:** Usa el transporte `file` para evitar envíos accidentales y poder inspeccionar correos.
- **Testing:** Combina `file` para tests automatizados y `smtp` para pruebas manuales ocasionales.
- **Producción:** Configura `smtp` con un proveedor confiable y credenciales seguras.
- **Seguridad:** Utiliza contraseñas de aplicación en lugar de contraseñas principales cuando sea posible.

#### Variables de entorno recomendadas

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=TLS
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_contraseña_de_aplicación
```

#### Consideraciones adicionales

- Los cambios en `mail.py` requieren reinicio de la aplicación para aplicarse.
- Asegúrate de que el directorio de archivos (`file` transport) tenga permisos de escritura.
- Muchos proveedores requieren autenticación de dos factores y contraseñas de aplicación específicas.
- Para Gmail, habilita la verificación en 2 pasos y genera una contraseña de aplicación específica.
- El framework maneja automáticamente la creación de directorios para el transporte `file`.
- Considera usar servicios transaccionales como SendGrid o Mailgun para aplicaciones en producción.
- Los correos almacenados como archivos incluyen todas las cabeceras y contenido para debugging completo.

### `paths.py`

El archivo `paths.py` define la configuración de rutas del proyecto para `Orionis Framework`, estableciendo las ubicaciones de todos los directorios importantes de la aplicación. Esta configuración centralizada permite que el framework y la aplicación localicen automáticamente archivos y directorios sin depender de rutas hardcodeadas, facilitando la organización y el mantenimiento del proyecto.

#### ¿Cómo funciona el sistema de rutas en Orionis Framework?

El sistema de rutas utiliza objetos `Path` de Python para definir ubicaciones absolutas de directorios clave. Todas las rutas se resuelven desde el directorio raíz del proyecto, garantizando consistencia sin importar desde dónde se ejecute la aplicación. El framework utiliza estas rutas para localizar automáticamente controladores, modelos, vistas y otros componentes.

#### Estructura de configuración

```python
# paths.py
from pathlib import Path
from orionis.foundation.config.roots.paths import Paths

class BootstrapPaths(Paths):
    # ... propiedades de rutas
```

#### Propiedades principales de configuración

A continuación se detallan todas las rutas disponibles, su propósito y ubicaciones predeterminadas:

#### Rutas principales del proyecto

- **`root`**
    Directorio raíz del proyecto.
    - Valor por defecto: `Path.cwd().resolve()` (directorio de trabajo actual).
    - Base para todas las demás rutas del proyecto.
    - Contiene archivos como `main.py`, `requirements.txt`, `.env`.

- **`app`**
    Directorio principal de la aplicación.
    - Valor por defecto: `{root}/app`.
    - Contiene toda la lógica de la aplicación organizada en subdirectorios.
    - Es el corazón del código fuente de tu proyecto.

- **`config`**
    Directorio de archivos de configuración.
    - Valor por defecto: `{root}/config`.
    - Contiene todos los archivos `.py` de configuración (app.py, cors.py, mail.py, etc.).
    - Centraliza toda la configuración de la aplicación.

- **`bootstrap`**
    Directorio de archivos de inicialización.
    - Valor por defecto: `{root}/bootstrap`.
    - Contiene archivos que configuran el arranque de la aplicación.
    - Incluye configuraciones de proveedores y servicios iniciales.

#### Rutas de la lógica de aplicación

- **`console`**
    Directorio de comandos de consola y tareas programadas.
    - Valor por defecto: `{root}/app/console`.
    - Contiene subdirectorios para comandos personalizados y `scheduler.py`.
    - Organiza toda la funcionalidad de línea de comandos.

- **`exceptions`**
    Directorio de manejadores de excepciones personalizadas.
    - Valor por defecto: `{root}/app/exceptions`.
    - Contiene clases para manejo específico de errores y excepciones.
    - Permite personalizar respuestas de error según el tipo de excepción.

- **`http`**
    Directorio de componentes relacionados con HTTP.
    - Valor por defecto: `{root}/app/http`.
    - Contiene controladores, middleware, requests de validación.
    - Organiza toda la lógica web de la aplicación.

- **`models`**
    Directorio de modelos ORM.
    - Valor por defecto: `{root}/app/models`.
    - Contiene las clases que representan tablas de base de datos.
    - Define relaciones, validaciones y lógica de datos.

- **`providers`**
    Directorio de proveedores de servicios.
    - Valor por defecto: `{root}/app/providers`.
    - Contiene clases que registran servicios en el contenedor.
    - Configura la inyección de dependencias y bindings.

- **`notifications`**
    Directorio de clases de notificaciones.
    - Valor por defecto: `{root}/app/notifications`.
    - Contiene lógica para envío de emails, SMS, push notifications.
    - Organiza diferentes canales y tipos de notificaciones.

- **`services`**
    Directorio de servicios de lógica de negocio.
    - Valor por defecto: `{root}/app/services`.
    - Contiene clases con lógica de negocio reutilizable.
    - Separa la lógica compleja de controladores y modelos.

- **`jobs`**
    Directorio de trabajos en cola.
    - Valor por defecto: `{root}/app/jobs`.
    - Contiene clases para tareas asíncronas y procesamiento en background.
    - Organiza trabajos que se ejecutan fuera del ciclo de request-response.

#### Rutas de recursos y almacenamiento

- **`database`**
    Directorio de archivo de base de datos SQLite.
    - Valor por defecto: `{root}/database/database`.
    - Ubicación para el archivo SQLite cuando se usa este driver.
    - También puede contener migraciones y seeds.

- **`resources`**
    Directorio de recursos de la aplicación.
    - Valor por defecto: `{root}/resources`.
    - Contiene vistas, archivos de idioma, assets sin procesar.
    - Organiza contenido que no es código Python.

- **`routes`**
    Directorio de definición de rutas.
    - Valor por defecto: `{root}/routes`.
    - Contiene archivos que definen las rutas de Consola, Web y API.
    - Organiza el enrutamiento de la aplicación.

- **`storage`**
    Directorio de almacenamiento de archivos.
    - Valor por defecto: `{root}/storage`.
    - Contiene logs, cache, archivos subidos, sesiones.
    - Debe tener permisos de escritura para la aplicación.

- **`tests`**
    Directorio de archivos de pruebas.
    - Valor por defecto: `{root}/tests`.
    - Contiene todos los tests unitarios, de integración y funcionales.
    - Organiza las pruebas automatizadas del proyecto.

#### Estructura típica del proyecto

```
mi_proyecto/                    # root
├── app/                        # app
│   ├── console/                # console
│   ├── exceptions/             # exceptions
│   ├── http/                   # http
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── requests/
│   ├── jobs/                   # jobs
│   ├── models/                 # models
│   ├── notifications/          # notifications
│   ├── providers/              # providers
│   └── services/               # services
├── bootstrap/                  # bootstrap
├── config/                     # config
├── database/                   # database
├── resources/                  # resources
├── routes/                     # routes
├── storage/                    # storage
├── tests/                      # tests
└── main.py
```

#### Recomendaciones de configuración

- **Desarrollo:** Las rutas predeterminadas son adecuadas para la mayoría de proyectos.
- **Personalización:** Solo modifica las rutas si tienes requisitos específicos de organización.
- **Consistency:** Mantén la estructura estándar para facilitar el mantenimiento y colaboración.
- **Permisos:** Asegúrate de que el directorio `storage` tenga permisos de escritura.

#### Consideraciones adicionales

- Las rutas se resuelven automáticamente como rutas absolutas para evitar problemas de ubicación.
- El framework utiliza estas rutas para autoloading de clases y componentes.
- Cambiar las rutas requiere reinicio de la aplicación y puede requerir ajustes adicionales.
- Todas las rutas están disponibles globalmente una vez cargada la configuración.
- El sistema de rutas es compatible con diferentes sistemas operativos (Windows, Linux, macOS).
- Si modificas las rutas, asegúrate de actualizar también cualquier script de deployment o CI/CD.

### `queue.py`

Este archivo de configuracion aun se encuentra en desarrollo y estará disponible en futuras versiones de `Orionis Framework`.

### `session.py`

Este archivo de configuracion aun se encuentra en desarrollo y estará disponible en futuras versiones de `Orionis Framework`.

### `testing.py`

El archivo `testing.py` define la configuración del sistema de testing de `Orionis Framework`, permitiendo personalizar el comportamiento de las pruebas automatizadas, incluyendo verbosidad, ejecución paralela, persistencia de resultados y generación de reportes web. Esta configuración centralizada facilita la gestión de pruebas tanto para desarrollo como para integración continua.

#### ¿Cómo funciona el sistema de testing en Orionis Framework?

El sistema de testing proporciona una configuración flexible que permite ejecutar pruebas de diferentes maneras según las necesidades del proyecto. Puedes ajustar desde el nivel de detalle en la salida hasta el modo de ejecución (secuencial o paralelo), así como habilitar funcionalidades avanzadas como persistencia de resultados y reportes web interactivos.

#### Estructura de configuración

```python
# testing.py
from dataclasses import dataclass
from orionis.foundation.config.testing.entities.testing import Testing
from orionis.foundation.config.testing.enums import ExecutionMode, PersistentDrivers, VerbosityMode

@dataclass
class BootstrapTesting(Testing):
    # ... propiedades de configuración
```

#### Propiedades principales de configuración

A continuación se detallan todas las opciones disponibles, su propósito y ejemplos de uso:

#### Configuración de salida y verbosidad

- **`verbosity`**
    Nivel de verbosidad para la salida de las pruebas.
    - Valor por defecto: `VerbosityMode.DETAILED`.
    - Opciones disponibles:
      - `VerbosityMode.SILENT` (0): Sin salida, solo resultados finales.
      - `VerbosityMode.MINIMAL` (1): Salida mínima con puntos por test.
      - `VerbosityMode.DETAILED` (2): Salida detallada con nombres y resultados.
    - También puedes usar valores numéricos: `0`, `1`, `2`.

#### Configuración de ejecución

- **`execution_mode`**
    Modo de ejecución de las pruebas.
    - Valor por defecto: `ExecutionMode.SEQUENTIAL`.
    - Opciones disponibles:
      - `ExecutionMode.SEQUENTIAL`: Ejecución secuencial (una prueba a la vez).
      - `ExecutionMode.PARALLEL`: Ejecución paralela (múltiples pruebas simultáneas).
    - También puedes usar cadenas: `"sequential"`, `"parallel"`.

- **`max_workers`**
    Número máximo de trabajadores para ejecución paralela.
    - Valor por defecto: `1`.
    - Solo aplica cuando `execution_mode` es `PARALLEL`.
    - Recomendación: No exceder el número de núcleos de CPU disponibles.
    - Ejemplo para aprovechar todos los núcleos: `max_workers = Workers().calculate()`.

- **`fail_fast`**
    Detener ejecución tras el primer fallo.
    - Valor por defecto: `False`.
    - Si está en `True`: Se detiene al encontrar el primer test que falle.
    - Si está en `False`: Ejecuta todas las pruebas independientemente de los fallos.
    - Útil para desarrollo rápido cuando quieres corregir errores uno a uno.

- **`throw_exception`**
    Lanzar excepción si una prueba falla.
    - Valor por defecto: `True`.
    - Si está en `True`: Lanza excepción cuando hay fallos (útil para CI/CD).
    - Si está en `False`: Completa la ejecución y reporta fallos sin lanzar excepción.

#### Configuración de descubrimiento de pruebas

- **`folder_path`**
    Patrón de búsqueda de subcarpetas para las pruebas.
    - Valor por defecto: `'*'` (todas las subcarpetas de la carpeta principal `test/`).
    - Puede ser una cadena simple o una lista de patrones.
    - Ejemplos:
      - `'example'`: Solo busca en el subdirectorio `'example'`.
      - `['example', 'integration']`: Busca en múltiples subdirectorio.

- **`pattern`**
    Patrón de nombres de archivos de prueba.
    - Valor por defecto: `'test_*.py'`.
    - Define qué archivos se consideran pruebas.
    - Ejemplos comunes:
      - `'test_*.py'`: Archivos que empiezan con "test_".
      - `'*_test.py'`: Archivos que terminan con "_test".
      - `'test*.py'`: Cualquier archivo que empiece con "test".

- **`test_name_pattern`**
    Patrón para filtrar nombres específicos de pruebas.
    - Valor por defecto: `None` (ejecuta todas las pruebas).
    - Permite ejecutar solo pruebas que coincidan con un patrón.
    - Ejemplos:
      - `'test*'`: Solo metodos de prueba que inician con `'test*'` ejemplo: `testUserCreation`.
      - `'*Integration*'`: Solo metodos que contienen `'Integration'` en su nombre. Ejemplo: `testIntegrationFlow`.

#### Configuración de persistencia y reportes

- **`persistent`**
    Mantener resultados de pruebas persistentes.
    - Valor por defecto: `False`.
    - Si está en `True`: Guarda resultados para análisis posterior.
    - Útil para tracking de progreso y análisis de tendencias.

- **`persistent_driver`**
    Driver para almacenar resultados persistentes.
    - Valor por defecto: `PersistentDrivers.JSON`.
    - Opciones disponibles:
      - `PersistentDrivers.JSON`: Almacena en archivos JSON.
      - `PersistentDrivers.SQLITE`: Almacena en base de datos SQLite (Diferente de la base de datos principal).
    - También puedes usar cadenas: `"json"`, `"sqlite"`.

- **`web_report`**
    Generar reporte web interactivo.
    - Valor por defecto: `False`.
    - Si está en `True`: Genera un reporte HTML con gráficos y estadísticas.

#### Configuraciones recomendadas por entorno

##### Desarrollo local
```python
verbosity = VerbosityMode.DETAILED
execution_mode = ExecutionMode.SEQUENTIAL
fail_fast = True
persistent = False
web_report = True
```

##### Integración continua (CI/CD)
```python
verbosity = VerbosityMode.MINIMAL
execution_mode = ExecutionMode.PARALLEL
max_workers = Workers().calculate()
fail_fast = False
throw_exception = True
persistent = True
web_report = False
```

#### Recomendaciones de configuración

- **Desarrollo:** Usa `DETAILED` verbosity y `SEQUENTIAL` execution para debugging fácil.
- **CI/CD:** Habilita `throw_exception` para integración continua.
- **Debugging:** Activa `fail_fast` para corregir errores rápidamente durante desarrollo.

#### Consideraciones adicionales

- La ejecución paralela puede no ser adecuada para pruebas que comparten estado o recursos.
- Los reportes web se generan en el directorio `storage/testing/reports`.
- Los resultados persistentes se almacenan en `storage/testing/results`.
- El framework crea automáticamente los directorios necesarios para almacenamiento.
- La configuración se aplica a todas las herramientas de testing del framework.
- Los reportes web incluyen métricas de tiempo de ejecución y cobertura de código cuando está disponible.

## Bootstraping

El proceso de bootstraping en `Orionis Framework` se encarga de la carga automática y inicialización de todas las configuraciones durante el arranque de la aplicación. Este sistema garantiza que todos los parámetros de configuración estén disponibles y validados antes de que cualquier componente de la aplicación comience a funcionar.

### ¿Cómo funciona el bootstraping de configuraciones?

Durante el proceso de arranque, el framework:

1. **Carga automática**: Lee todos los archivos de configuración definidos en el directorio `config/`.
2. **Validación**: Verifica que las configuraciones cumplan con los tipos y valores esperados.
3. **Inicialización**: Registra las configuraciones en el contenedor de servicios para acceso global.
4. **Fallback**: Utiliza valores predeterminados seguros cuando no se proporciona configuración específica.

### Archivo de bootstraping principal

El bootstraping se realiza en el archivo `bootstrap/app.py`, que actúa como punto central de inicialización de la aplicación:

```python
# bootstrap/app.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication

# Importaciones de configuraciones personalizadas
from config.app import BootstrapApp
from config.auth import BootstrapAuth
from config.cache import BootstrapCache
from config.cors import BootstrapCors
from config.database import BootstrapDatabase
from config.filesystems import BootstrapFilesystems
from config.logging import BootstrapLogging
from config.mail import BootstrapMail
from config.paths import BootstrapPaths
from config.queue import BootstrapQueue
from config.session import BootstrapSession
from config.testing import BootstrapTesting

# Inicializa una instancia de la aplicación
app: IApplication = Application()

# Registra todas las configuraciones personalizadas
app.withConfigurators(
    app=BootstrapApp,
    auth=BootstrapAuth,
    cache=BootstrapCache,
    cors=BootstrapCors,
    database=BootstrapDatabase,
    filesystems=BootstrapFilesystems,
    logging=BootstrapLogging,
    mail=BootstrapMail,
    paths=BootstrapPaths,
    queue=BootstrapQueue,
    session=BootstrapSession,
    testing=BootstrapTesting
)

# Inicia la aplicación con todas las configuraciones cargadas
app.create()
```

### Configuraciones predeterminadas y fallback

Uno de los principios fundamentales de `Orionis Framework` es proporcionar una experiencia "funciona desde el primer momento". Por esta razón:

- **Valores seguros**: Cada configuración incluye valores predeterminados seguros para desarrollo.
- **Fallback automático**: Si un archivo de configuración no existe, se utilizan los valores predeterminados.
- **Configuración mínima**: Es posible ejecutar una aplicación sin crear archivos de configuración personalizados.
- **Validación automática**: El framework valida tipos y rangos de valores automáticamente.

### Beneficios del sistema de bootstraping

#### Consistencia y predictibilidad
- Todas las aplicaciones siguen el mismo patrón de inicialización.
- Los desarrolladores siempre saben dónde encontrar y modificar configuraciones.
- El comportamiento es predecible independientemente del entorno de ejecución.

#### Flexibilidad sin complejidad
- Puedes sobrescribir solo las configuraciones que necesites modificar.
- Las configuraciones no utilizadas no afectan el rendimiento de la aplicación.
- Fácil migración entre entornos mediante variables de entorno.

#### Detección temprana de errores
- Los errores de configuración se detectan durante el arranque, no en tiempo de ejecución.
- Mensajes de error claros indican exactamente qué configuración tiene problemas.
- Validación de tipos previene errores silenciosos difíciles de debuggear.

### Modificación del proceso de bootstraping

**En la mayoría de casos no necesitas modificar el archivo `bootstrap/app.py`**. Sin embargo, puedes personalizarlo en situaciones específicas:

#### Casos de uso para modificación:
- Aplicaciones que no siguen la estructura estándar del framework.
- Necesidad de configuraciones adicionales no contempladas por defecto.
- Integración con sistemas de configuración externos.
- Aplicaciones que requieren inicialización especial de servicios.

#### Ejemplo de bootstraping personalizado:
```python
# bootstrap/app.py personalizado
from orionis.foundation.application.application import Application
from mi_configuracion_personalizada import MiConfigApp

app: IApplication = Application()

# Solo registra las configuraciones que necesitas
app.withConfigurators(
    app=MiConfigApp,
    # Omite configuraciones no necesarias para tu aplicación
)

# Inicializa la aplicación
app.create()
```

## Alternativas de configuración

### Desarrollo con esqueleto estándar (Recomendado)

La forma recomendada de trabajar con `Orionis Framework` es utilizando la estructura estándar de directorios y archivos. Esta aproximación ofrece:

#### Ventajas:
- **Convención sobre configuración**: Menos decisiones que tomar, más tiempo para desarrollar.
- **Documentación completa**: Todo está documentado y ejemplificado.
- **Compatibilidad**: Funciona perfectamente con todas las herramientas del framework.
- **Mantenibilidad**: Fácil para otros desarrolladores entender y mantener.

#### Estructura estándar:
```
mi_proyecto/
├── app/                    # Lógica de aplicación
├── bootstrap/              # Inicialización
├── config/                 # Configuraciones personalizadas
├── database/               # Base de datos y migraciones
├── resources/              # Recursos (vistas, idiomas)
├── routes/                 # Definición de rutas
├── storage/                # Almacenamiento (logs, cache)
├── tests/                  # Pruebas automatizadas
```

### Desarrollo fuera del esqueleto estándar

Para casos especiales donde la estructura estándar no se ajusta a tus necesidades, puedes crear una implementación completamente personalizada:

#### Cuándo considerar esta opción:
- Migración de aplicaciones existentes con estructura diferente.
- Integración con sistemas empresariales con estándares específicos.
- Aplicaciones embebidas con restricciones de estructura de archivos.
- Proyectos que requieren múltiples aplicaciones en un solo repositorio.

#### Implementación personalizada:

```python
# mi_configuracion/app_config.py
from dataclasses import dataclass
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.environments import Environments

@dataclass
class MiConfiguracionPersonalizada(App):
    name: str = 'Mi Aplicación Empresarial'
    env: str = Environments.PRODUCTION
    debug: bool = False
    host: str = '0.0.0.0'  # Acceso desde cualquier IP
    port: int = 8080       # Puerto empresarial estándar
    # Otras configuraciones personalizadas...

    # Configuraciones específicas de mi empresa
    empresa_codigo: str = 'ACME001'
    integracion_activa: bool = True
```

```python
# main.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication
from mi_configuracion.app_config import MiConfiguracionPersonalizada

# Inicializa una instancia de la aplicación
app: IApplication = Application()

# Solo registra las configuraciones que necesitas
app.withConfigurators(
    app=MiConfiguracionPersonalizada,
    # Omitir o añadir otras configuraciones según sea necesario
)

# Inicializa la aplicación
app.create()
```

`Orionis Framework` es lo suficientemente flexible para que el desarrollador pueda definir cualquier estructura personalizada, siempre y cuando se asegure de registrar las configuraciones necesarias durante el bootstraping.

Asi que si no se desean crear clases de configuración personalizadas, se puede optar por registrar las configuraciones a través de metodos propios de la instancia de la aplicación.

Ejemplo:

```python
# main.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication
from mi_configuracion.app_config import MiConfiguracionPersonalizada

# Inicializa una instancia de la aplicación
app: IApplication = Application()

# Usar metodos para configurar la aplicación directamente.
app.setConfigApp()(
    name='Mi Aplicación',
    env='production',
    debug=False
)

# Otros metodos para configurar individualmente cada aspecto de la aplicación.
# app.setConfigAuth(...)
# app.setConfigCache(...)
# app.setConfigCors(...)
# app.setConfigDatabase(...)
# app.setConfigFilesystems(...)
# app.setConfigLogging(...)
# app.setConfigMail(...)
# app.setConfigQueue(...)
# app.setConfigSession(...)
# app.setConfigTesting(...)
# app.setConfigPaths(...)
# app.setConfig(...)

# Inicializa la aplicación
app.create()
```

<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Nota importante
</p>
<div class="starlight-aside__content">
<p>Estos métodos reciben como parámetros los mismos atributos definidos en las clases de configuración correspondientes; puedes usar solo los necesarios y los que no se definan tomarán el valor por defecto. Para más detalles sobre los atributos disponibles, consulta la sección <a href="#archivos-de-configuración">Archivos de Configuración</a>.</p>
</div>
</aside>

### Recomendaciones según el tipo de proyecto

#### Para aplicaciones nuevas:
- ✅ **Usa el esqueleto estándar** - Es la opción más rápida y mantenible.
- ✅ **Sigue las convenciones** - Facilita la colaboración y el mantenimiento.
- ✅ **Personaliza solo lo necesario** - Sobrescribe configuraciones específicas sin cambiar la estructura.

#### Para migraciones de aplicaciones existentes:
- ⚖️ **Evalúa la complejidad** - Compara el costo de adaptar vs. mantener estructura actual.
- 🔄 **Migración gradual** - Considera adoptar partes del esqueleto estándar progresivamente.
- 📚 **Documenta las desviaciones** - Si usas estructura personalizada, documéntala claramente.

#### Para aplicaciones empresariales:
- 🏢 **Considera estándares corporativos** - Algunas empresas tienen estándares de estructura obligatorios.
- 🔒 **Seguridad y compliance** - Verifica que la estructura cumple con requisitos de seguridad.
- 🔧 **Herramientas de CI/CD** - Asegúrate de que la estructura sea compatible con pipelines existentes.

### Consideraciones importantes

- **Mantenimiento**: Las estructuras personalizadas requieren más documentación y mantenimiento.
- **Actualizaciones**: El esqueleto estándar recibe mejoras automáticas con cada versión del framework.
- **Comunidad**: Es más fácil obtener ayuda con la estructura estándar.
- **Herramientas**: Comandos CLI y generadores están optimizados para la estructura estándar.

En resumen, aunque `Orionis Framework` ofrece la flexibilidad de trabajar con estructuras completamente personalizadas, la recomendación general es utilizar el esqueleto estándar y personalizarlo mediante las configuraciones específicas según las necesidades de cada proyecto.

## Acceder a las configuraciones desde la aplicación

Una vez que la aplicación ha sido inicializada mediante el proceso de bootstraping, todas las configuraciones definidas en los archivos de configuración están disponibles globalmente a través del contenedor de servicios. `Orionis Framework` proporciona múltiples formas de acceder a estas configuraciones de manera eficiente y segura.

### Método de acceso a configuraciones

La forma de acceder a configuraciones es mediante la fachada `Application`, que proporciona una interfaz limpia y expresiva:

```python
from orionis.support.facades.application import Application

# Acceder a configuraciones básicas
nombre_app = Application.config('app.name')
entorno = Application.config('app.env')
debug_activo = Application.config('app.debug')

# Acceder a configuraciones anidadas
host_smtp = Application.config('mail.mailers.smtp.host')
puerto_smtp = Application.config('mail.mailers.smtp.port')
```

### Metodo de cambio de configuraciones en tiempo de ejecución

La fachada `Application` también permite modificar configuraciones en tiempo de ejecución si es necesario, simplemente se debe suministrar la clave de configuración y el nuevo valor:

```python
from orionis.support.facades.application import Application

# Cambiar configuración en tiempo de ejecución
Application.config('app.debug', True)
```

De esta manera, es posible ajustar el comportamiento de la aplicación dinámicamente según las necesidades del entorno o condiciones específicas.

### Restaurar configuraciones a valores predeterminados

Si es necesario, también se pueden restaurar configuraciones a sus valores predeterminados definidos en los archivos de configuración originales:

```python
from orionis.support.facades.application import Application

# Restaurar configuración a valor predeterminado
Application.resetConfig()
```

Una forma simple pero extremadamente útil de mantener la flexibilidad en la gestión de configuraciones durante el ciclo de vida de la aplicación.

<aside aria-label="Importante" class="starlight-aside starlight-aside--caution">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v-2h2v2h-2zm0-4V8h2v4h-2z"/>
</svg>
Nota importante
</p>
<div class="starlight-aside__content">
<p>Cambiar configuraciones en tiempo de ejecución puede afectar el comportamiento de la aplicación. Se recomienda hacerlo con precaución y preferiblemente solo durante fases de desarrollo o testing. Además, si se trabaja con múltiples hilos o procesos, es fundamental asegurar la consistencia de las configuraciones compartidas.</p>
</div>
</aside>

### Patrones de uso comunes

Ejemplos prácticos de cómo utilizar las configuraciones en diferentes partes de la aplicación:

#### Configuración en controladores
```python
# app/http/controllers/home_controller.py
from orionis.support.facades.application import Application
from orionis.http.controller import Controller

class HomeController(Controller):

    def index(self):
        # Obtener configuraciones para la vista
        app_name = Application.config('app.name')
        env = Application.config('app.env')
        debug = Application.config('app.debug')

        return self.view('home', {
            'app_name': app_name,
            'environment': env,
            'debug_mode': debug
        })
```

#### Configuración en servicios

```python
# app/services/email_service.py
from orionis.support.facades.application import Application

class EmailService:

    def __init__(self):
        # Configurar el servicio basado en configuraciones
        self.mailer = Application.config('mail.default', 'smtp')
        self.from_address = Application.config('mail.from.address')
        self.from_name = Application.config('mail.from.name')

    def send_email(self, to, subject, content):
        # Lógica de envío usando configuraciones
        if self.mailer == 'file':
            # Modo desarrollo - guardar en archivo
            file_path = Application.config('mail.mailers.file.path')
            # ... lógica para guardar archivo
        else:
            # Modo producción - enviar por SMTP
            smtp_config = Application.config('mail.mailers.smtp')
            # ... lógica para envío SMTP
```

### Consideraciones de rendimiento

- **Las configuraciones se cargan una sola vez durante el bootstraping**, por lo que el acceso posterior es muy rápido.
- **Usa `Application.config()` libremente** - no hay penalización significativa de rendimiento.
<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Recomendación clave
</p>
<div class="starlight-aside__content">
<p><strong>No accedas directamente al archivo <code>.env</code> en tu código.</strong> Siempre utiliza la fachada de configuración del framework (<code>Application.config()</code>) para obtener valores de entorno y configuración. Acceder al <code>.env</code> de forma directa puede causar inconsistencias si las variables cambian después del arranque de la aplicación, además de añadir complejidad y posibles errores. La fachada garantiza que los valores sean consistentes y centralizados durante toda la ejecución.</p>
</div>
</aside>

El sistema de configuraciones de `Orionis Framework` está diseñado para ser tanto potente como fácil de usar, proporcionando acceso flexible a todas las configuraciones mientras mantiene la seguridad de tipos y valores por defecto sensatos.