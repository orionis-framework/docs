---
title: Ciclo de vida de la petición
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introducción

Comprender el ciclo de vida de una petición es uno de los aspectos más importantes
para dominar cualquier framework. Cuando conoces el recorrido que sigue una
solicitud desde que entra al sistema hasta que produce una respuesta, puedes
identificar con precisión los puntos de extensión disponibles, anticipar el
comportamiento de la aplicación ante distintos escenarios y depurar problemas
con mayor eficacia.

Orionis Framework define dos ciclos de vida bien diferenciados según el tipo de
solicitud que recibe la aplicación:

- **Ciclo CLI**: desencadenado cuando se ejecuta un comando desde la terminal
  a través del entrypoint `reactor`.
- **Ciclo HTTP**: desencadenado cuando llega una solicitud HTTP al servidor
  de la aplicación.

Ambos ciclos comparten las etapas de arranque y configuración inicial, pero
divergen en la forma en que se resuelve y ejecuta la solicitud. Las secciones
siguientes describen cada etapa con detalle, explicando su responsabilidad dentro
del framework y las implicaciones que tiene para el desarrollador.

---

## Ciclo de vida de una petición CLI

### Visión general del flujo

<div class="flow-diagram">
  <div class="flow-node">
    <span class="flow-node-badge">1</span>
    <div class="flow-node-info">
      <span class="flow-node-label">bootstrap/app.py</span>
      <span class="flow-node-sub">Configuración explícita de la aplicación</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">2</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Bootstrap</span>
      <span class="flow-node-sub">Carga de configuración, servicios y handler global</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">3</span>
    <div class="flow-node-info">
      <span class="flow-node-label">reactor — entrypoint CLI</span>
      <span class="flow-node-sub">Captura sys.argv y delega al kernel de consola</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">4</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Container — IoC</span>
      <span class="flow-node-sub">Resolución de dependencias y gestión del ciclo de vida</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">5</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Console Kernel</span>
      <span class="flow-node-sub">Parseo de argumentos y despacho del comando</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">6</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Command Handler</span>
      <span class="flow-node-sub">Validación, inyección y gestión del contexto</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">7</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Command Execution</span>
      <span class="flow-node-sub">Invocación del método handle con lógica de negocio</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">8</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Response / Exit Code</span>
      <span class="flow-node-sub">Código de salida 0 (éxito) o distinto de 0 (error)</span>
    </div>
  </div>
</div>

### Etapas del ciclo CLI

#### 1. bootstrap/app.py

Todo comienza en el archivo `bootstrap/app.py`, que es el punto de configuración
explícita de la aplicación. Aquí el desarrollador declara los comportamientos
generales del sistema: proveedores de servicios que deben cargarse, bindings
personalizados en el contenedor, configuración del entorno y cualquier otro
parámetro que la aplicación necesite conocer antes de inicializarse.

Este archivo no ejecuta lógica de negocio; su único propósito es construir y
entregar una instancia de la aplicación correctamente configurada al bootstrap.

#### 2. Bootstrap

El bootstrap es la etapa más crítica de todo el ciclo de vida. Durante este
proceso, el framework carga e interpreta toda la configuración definida en la
carpeta `config`, aplica los valores explícitos recibidos desde `bootstrap/app.py`
y prepara los subsistemas internos del framework para operar.

Entre las tareas que realiza el bootstrap se incluyen:

- Registro y arranque de todos los proveedores de servicios (`ServiceProviders`).
- Configuración del handler global de excepciones.
- Preparación del contenedor de inversión de control (IoC).
- Carga de variables de entorno y parámetros de configuración.

Es fundamental entender que el handler global de excepciones se configura
**dentro** del bootstrap. Si el bootstrap falla antes de completarse, ese handler
no habrá sido registrado y cualquier error producido en esta etapa propagará como
una excepción no controlada. Por esta razón, errores de configuración o de
incompatibilidad de dependencias durante el arranque deben resolverse directamente
en los archivos de configuración o en los proveedores de servicios afectados, y
no depender del manejo global para su captura.

#### 3. Reactor — Entrypoint CLI

`reactor` es el archivo situado en la raíz del proyecto que actúa como punto de
entrada centralizado para todas las solicitudes de consola. Su responsabilidad es
capturar los argumentos del sistema (`sys.argv`), instanciar la aplicación
previamente configurada y delegarlos al kernel de consola para su procesamiento.

Este archivo no contiene lógica de negocio ni lógica de enrutamiento; es
intencionadamente delgado para mantener la separación de responsabilidades entre
el entrypoint y el resto del sistema.

#### 4. Container — IoC

El contenedor de inversión de control (IoC) es el núcleo de la arquitectura de
Orionis Framework. Una vez que el bootstrap ha finalizado su proceso, el
contenedor queda completamente inicializado y disponible para resolver cualquier
dependencia registrada en la aplicación.

Sus responsabilidades en este punto del ciclo incluyen:

- **Resolución de dependencias**: instancia automáticamente las clases requeridas
  por el comando a ejecutar, inyectando sus dependencias de forma recursiva.
- **Gestión del ciclo de vida de instancias**: determina si una dependencia debe
  resolverse como un *singleton* (una única instancia compartida durante toda la
  vida de la aplicación), *transient* (una nueva instancia por cada
  solicitud de resolución) o *scoped* (una nueva instancia por cada ciclo de vida de solicitud).
- **Desacoplamiento estructural**: permite que los comandos, servicios y
  repositorios declaren sus dependencias por tipo sin conocer los detalles de
  construcción de cada una.

Consulta la documentación del [Contenedor de Servicios](/es/architecture/service-container)
para conocer la API completa de registro y resolución de dependencias.

#### 5. Console Kernel

El kernel de consola recibe los argumentos procesados por `reactor` y orquesta
la ejecución de la solicitud. Sus responsabilidades son:

- Parsear e interpretar los argumentos y opciones recibidos por línea de comandos.
- Localizar el comando que corresponde a la firma (`signature`) proporcionada.
- Resolver la instancia del comando a través del contenedor IoC.
- Transferir el control al handler del comando para su ejecución.

#### 6. Command Handler

El handler de comandos es la capa intermedia entre el kernel y la lógica concreta
del comando. Recibe la instancia del comando ya resuelta por el contenedor y se
encarga de:

- Validar que los argumentos requeridos estén presentes y sean coherentes.
- Inyectar dependencias adicionales declaradas en el método `handle` de ser un comando `boilerplate` o en el metodo definido para rutas de comandos.
- Gestionar el contexto de ejecución del comando.
- Capturar y delegar al handler global cualquier excepción no controlada que
  surja durante la ejecución.

#### 7. Command Execution

En esta etapa se invoca el método `handle` del comando correspondiente si es `boilerplate` de lo contrario el metodo de clase definido en las rutas de comando, metodo que
contiene la lógica de negocio específica de la operación solicitada. Aquí el
comando puede:

- Leer los argumentos y opciones proporcionados por el usuario.
- Interactuar con servicios, repositorios y otras dependencias inyectadas.
- Emitir salida en consola usando la API de `BaseCommand` (`success`, `info`,
  `warning`, `error`, `table`, `progressBar`, etc.).
- Solicitar entrada interactiva al usuario (`ask`, `confirm`, `choice`, etc.).
- Finalizar el proceso de forma explícita con `exitSuccess` o `exitError`.

#### 8. Response — Exit Code

Al finalizar la ejecución del método `handle`, el framework determina el código
de salida del proceso:

- Si el `metodo` termina sin excepciones no controladas, el proceso finaliza con
  código `0` (éxito).
- Si el `metodo` lanza una excepción no controlada, el proceso finaliza con un
  código distinto de `0` (error).
- Si se llama explícitamente a `exitSuccess(...)`, el proceso finaliza con
  código `0`.
- Si se llama explícitamente a `exitError(...)`, el proceso finaliza con
  código `1`.

Este código de salida es relevante para integraciones con sistemas de CI/CD,
scripts de automatización o cualquier proceso externo que evalúe el resultado
de la ejecución del comando.

---

## Ciclo de vida de una petición HTTP

### Visión general del flujo

<div class="flow-diagram">
  <div class="flow-node">
    <span class="flow-node-badge">1</span>
    <div class="flow-node-info">
      <span class="flow-node-label">bootstrap/app.py</span>
      <span class="flow-node-sub">Configuración explícita de la aplicación</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">2</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Bootstrap</span>
      <span class="flow-node-sub">Carga de configuración, servicios y handler global</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">3</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Server — ASGI / RSGI</span>
      <span class="flow-node-sub">Entrypoint de red compatible con Granian, Uvicorn y Hypercorn</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">4</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Container — IoC</span>
      <span class="flow-node-sub">Resolución de dependencias de controladores y middleware</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">5</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Kernel</span>
      <span class="flow-node-sub">Orquestación del pipeline y middleware globales</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">6</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Middleware Pipeline</span>
      <span class="flow-node-sub">Cadena de procesamiento de entrada y salida</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">7</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Router</span>
      <span class="flow-node-sub">Resolución de ruta y método HTTP entrante</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">8</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Controller / Handler</span>
      <span class="flow-node-sub">Ejecución de la lógica de negocio de la solicitud</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">9</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Response</span>
      <span class="flow-node-sub">Serialización y envío de la respuesta al cliente</span>
    </div>
  </div>
</div>

### Etapas del ciclo HTTP

#### 1. bootstrap/app.py y Bootstrap

Las primeras dos etapas del ciclo HTTP son idénticas a las del ciclo CLI. La
aplicación se configura a través de `bootstrap/app.py` y el bootstrap inicializa
todos los subsistemas del framework, incluyendo el contenedor IoC, el handler
global de excepciones y los proveedores de servicios.

Esta simetría garantiza que sin importar el tipo de solicitud que reciba la
aplicación, el estado del sistema al momento de procesarla sea siempre
consistente y predecible.

#### 2. HTTP Server — Entrypoint ASGI / RSGI

El servidor HTTP actúa como el punto de entrada de las solicitudes de red.
Orionis Framework es compatible con los protocolos **ASGI** y **RSGI**, lo que
permite integrarlo con servidores de alto rendimiento como Granian, Uvicorn o
Hypercorn.

El entrypoint HTTP recibe la solicitud cruda del servidor, construye el objeto
de petición interno del framework y lo entrega al kernel HTTP para su
procesamiento.

#### 3. Container — IoC

Al igual que en el ciclo CLI, el contenedor IoC está completamente disponible
durante el ciclo HTTP y se encarga de resolver todas las dependencias de
controladores, middleware y servicios que participan en el procesamiento de la
solicitud.

#### 4. HTTP Kernel

El kernel HTTP es el orquestador central del ciclo de vida de una petición de
red. Recibe el objeto de solicitud y coordina su paso a través del pipeline de
middleware antes de entregarlo al router.

El kernel también gestiona la configuración de middleware globales que deben
aplicarse a todas las solicitudes, como la gestión de sesiones, autenticación
o cabeceras de seguridad.

#### 5. Middleware Pipeline

El pipeline de middleware es una cadena de capas de procesamiento que la
solicitud atraviesa antes de llegar al controlador y, en sentido inverso, antes
de que la respuesta sea enviada al cliente. Cada middleware puede:

- Inspeccionar o modificar la solicitud entrante.
- Interrumpir el flujo y devolver una respuesta directamente (por ejemplo, en
  caso de autenticación fallida).
- Inspeccionar o modificar la respuesta saliente.
- Ejecutar lógica transversal como logging, rate limiting o CORS.

Los middleware se ejecutan en el orden en que están registrados.

#### 6. Router

El router es responsable de analizar la URL y el método HTTP de la solicitud
entrante y determinar qué controlador o handler debe procesarla. Evalúa las
rutas registradas en la aplicación y selecciona la primera que coincida con el
patrón de la solicitud.

Si ninguna ruta coincide, el router delega al handler global el envío de una
respuesta `404 Not Found`. Si la ruta existe pero el método HTTP no está
permitido, se devuelve una respuesta `405 Method Not Allowed`.

#### 7. Controller / Handler

Una vez que el router ha identificado la ruta correspondiente, el controlador o
handler asociado es resuelto a través del contenedor IoC. Esto garantiza que
todas las dependencias declaradas en el constructor o en el método del
controlador sean inyectadas automáticamente.

Aquí se ejecuta la lógica de negocio de la solicitud: consultas a base de datos,
llamadas a servicios, transformaciones de datos y cualquier otra operación
necesaria para producir la respuesta.

#### 8. HTTP Response

El controlador devuelve un objeto de respuesta que el framework serializa y
entrega al servidor HTTP para ser enviado al cliente. La respuesta incluye el
código de estado, las cabeceras HTTP y el cuerpo del mensaje.

Antes de ser enviada, la respuesta vuelve a recorrer el pipeline de middleware
en sentido inverso, permitiendo que cada capa aplique transformaciones finales
sobre la salida.

---

## Puntos clave para el desarrollador

Entender el ciclo de vida completo permite aprovechar con precisión los puntos
de extensión que ofrece el framework:

- **Proveedores de servicios**: el lugar correcto para registrar bindings,
  escuchar eventos del sistema o inicializar subsistemas propios de la
  aplicación. Se ejecutan durante el bootstrap, antes de cualquier solicitud.
- **Middleware**: la capa adecuada para lógica transversal que debe aplicarse
  a múltiples rutas o a todas las solicitudes HTTP sin modificar los
  controladores individuales.
- **Contenedor IoC**: el mecanismo preferido para gestionar dependencias entre
  clases; evita el acoplamiento directo y facilita las pruebas unitarias.
- **Command Handler / Controller**: el lugar donde debe residir la lógica de
  negocio específica de cada operación, delegando responsabilidades a servicios
  y repositorios especializados.

