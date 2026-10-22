---
title: "Probar Database y ORM"
description: "Módulos ejecutables con TestCase nativo, SQLite aislado y pruebas completas de persistencia."
editUrl: true
lastUpdated: false
---

Las pruebas de persistencia deben demostrar resultados contra una base aislada, además de comprobar el código en memoria. Esta guía utiliza el TestCase nativo, SQLite temporal y conexiones nombradas. Todos los modelos declaran connection="documentation_tests" al definirse; no se cambia la conexión predeterminada ni se ejecutan migraciones de la aplicación de uso real.

## Crear y ejecutar los tests

```shell
orionis make:test database/database_reference
python -B reactor make:test database/database_reference

orionis test --start-dir tests/database --file-pattern test_database_reference.py --no-panel
python -B reactor test --start-dir tests/database --file-pattern test_database_reference.py --no-panel
```

Los comandos de cada par son alternativas. make:test exige name y añade test_ al nombre de archivo si falta; el ejemplo crea tests/database/test_database_reference.py. El stub hereda de orionis.test.TestCase y contiene una prueba omitida para sustituir por afirmaciones reales. Los directorios se crean y los archivos existentes no se sobrescriben. No se necesitan inicializadores adicionales para descubrir subdirectorios.

TestCase hereda de unittest.IsolatedAsyncioTestCase: admite assertEqual, assertRaises, assertIsNone, etc. Los métodos test pueden recibir servicios tipados mediante Application.invoke. **Los hooks setUp/asyncSetUp/tearDown/asyncTearDown no reciben inyección**; resuelve servicios explícitamente desde Application dentro del hook. Se esperan operaciones async, sin asyncio.run dentro de una prueba o controlador.

<a id="database-test-fixture"></a>

## Módulo completo de Database y ORM

Sustituye el archivo generado por este módulo. Cada test crea un archivo SQLite nuevo, activa claves externas, construye tablas y registra la limpieza antes de utilizarlas. addAsyncCleanup cierra solo documentation_tests antes de eliminar el directorio temporal; también se ejecuta si la preparación falla después de registrar la limpieza.

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any
from orionis.database import QueryException
from orionis.database.contracts.connection_manager import IConnectionManager
from orionis.orm import DateTime, Integer, MassAssignmentException, Model, String
from orionis.orm.factories import Factory, Sequence
from orionis.support.facades import Application, DB, Schema
from orionis.test import TestCase


CONNECTION = "documentation_tests"


class ReferenceTeam(Model):
    table = "reference_teams"
    connection = CONNECTION
    timestamps = False
    fillable = ("name",)
    id = Integer().primary().autoIncrement()
    name = String(120)

    def profile(self):
        return self.hasOne(ReferenceProfile, foreign_key="team_id")

    def players(self):
        return self.hasMany(ReferencePlayer, foreign_key="team_id")

    def tags(self):
        return self.belongsToMany(
            ReferenceTag,
            table="reference_tag_team",
            foreign_pivot_key="team_id",
            related_pivot_key="tag_id",
        )


class ReferenceProfile(Model):
    table = "reference_profiles"
    connection = CONNECTION
    timestamps = False
    fillable = ("team_id", "motto")
    id = Integer().primary().autoIncrement()
    team_id = Integer().foreign("reference_teams.id").unique()
    motto = String(120)


class ReferencePlayer(Model):
    table = "reference_players"
    connection = CONNECTION
    timestamps = False
    fillable = ("team_id", "name")
    id = Integer().primary().autoIncrement()
    team_id = Integer().foreign("reference_teams.id").nullable()
    name = String(120)

    def team(self):
        return self.belongsTo(ReferenceTeam, foreign_key="team_id")


class ReferenceTag(Model):
    table = "reference_tags"
    connection = CONNECTION
    timestamps = False
    fillable = ("name",)
    id = Integer().primary().autoIncrement()
    name = String(80)


class ReferenceDocument(Model):
    table = "reference_documents"
    connection = CONNECTION
    timestamps = False
    soft_deletes = True
    fillable = ("title", "status", "tenant_id")
    id = Integer().primary().autoIncrement()
    title = String(120).unique()
    status = String(30)
    tenant_id = Integer()
    deleted_at = DateTime().nullable()

    @staticmethod
    def scopePublished(query):
        query.where("status", "published")

    @classmethod
    def scopeForTenant(cls, query, tenant_id: int):
        query.where("tenant_id", tenant_id)


class ReferenceDocumentFactory(Factory[ReferenceDocument]):
    model = ReferenceDocument

    def definition(self) -> dict[str, Any]:
        return {"title": self.fake.word(), "status": "draft", "tenant_id": 1}


class TestDatabaseReference(TestCase):
    async def asyncSetUp(self) -> None:
        self._temporary = TemporaryDirectory()
        self.addCleanup(self._temporary.cleanup)
        self._manager = await Application.make(IConnectionManager)
        await self._manager.disconnect(CONNECTION)
        self._manager.addConnection(
            CONNECTION,
            {
                "driver": "sqlite",
                "database": str(Path(self._temporary.name) / "reference.sqlite"),
                "prefix": "",
                "foreign_key_constraints": "ON",
            },
        )
        self.addAsyncCleanup(self._manager.disconnect, CONNECTION)
        self._connection = self._manager.connection(CONNECTION)
        schema = await Schema.connection(CONNECTION)
        for model in (
            ReferenceTeam, ReferenceProfile, ReferencePlayer,
            ReferenceTag, ReferenceDocument,
        ):
            await schema.createFromModel(model)
        async with schema.create("reference_tag_team") as table:
            table.integer("team_id").foreign("reference_teams.id")
            table.integer("tag_id").foreign("reference_tags.id")
            table.primaryKey("team_id", "tag_id")
        ReferenceDocument.flushEvents()
        ReferenceDocument.removeGlobalScope("tenant")

    async def asyncTearDown(self) -> None:
        ReferenceDocument.flushEvents()
        ReferenceDocument.removeGlobalScope("tenant")

    async def testDependencyInjection(self, manager: IConnectionManager) -> None:
        self.assertIs(manager, self._manager)
        self.assertTrue(manager.hasConnection(CONNECTION))

    async def testRawQueries(self) -> None:
        result = await DB.table("reference_teams", connection=CONNECTION).insert(
            {"name": "Platform"},
        )
        self.assertEqual(result.row_count, 1)
        row = await DB.table("reference_teams", connection=CONNECTION).where(
            "id", result.last_insert_id,
        ).first()
        self.assertEqual(row["name"], "Platform")

    async def testModelCrudAndState(self) -> None:
        team = ReferenceTeam({"name": "Original"})
        self.assertTrue(team.isDirty("name"))
        self.assertTrue(await team.save())
        self.assertIsNotNone(team.id)
        self.assertTrue(team.isClean())
        team.name = "Updated"
        self.assertTrue(await team.save())
        self.assertTrue(team.wasChanged("name"))
        self.assertEqual((await ReferenceTeam.find(team.id)).name, "Updated")
        self.assertTrue(await team.delete())
        self.assertIsNone(await ReferenceTeam.find(team.id))

    async def testFilteringAndPagination(self) -> None:
        await ReferenceTeam.create({"name": "Alpha"})
        await ReferenceTeam.create({"name": "Beta"})
        page = await ReferenceTeam.where("name", "like", "%a%").orderBy(
            "id",
        ).paginate(page=1, per_page=1)
        self.assertEqual(page.total, 2)
        self.assertEqual(len(page.items), 1)
        self.assertTrue(page.hasNext)

    async def testTransactionRollback(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "abort"):
            async with self._connection.transaction():
                await ReferenceTeam.create({"name": "Temporary"})
                raise RuntimeError("abort")
        self.assertEqual(await ReferenceTeam.count(), 0)

    async def testExplicitRollback(self) -> None:
        await self._connection.begin()
        try:
            await ReferenceTeam.create({"name": "Temporary"})
        finally:
            await self._connection.rollback()
        self.assertEqual(await ReferenceTeam.count(), 0)

    async def testNestedSavepoint(self) -> None:
        async with self._connection.transaction():
            await ReferenceTeam.create({"name": "Outer"})
            with self.assertRaises(ValueError):
                async with self._connection.transaction():
                    await ReferenceTeam.create({"name": "Inner"})
                    raise ValueError("rollback savepoint")
        teams = await ReferenceTeam.orderBy("id").get()
        self.assertEqual(len(teams), 1)
        self.assertEqual(teams[0].name, "Outer")

    async def testRelationshipsAndEagerLoading(self) -> None:
        team = await ReferenceTeam.create({"name": "Platform"})
        await team.profile().create({"motto": "Build together"})
        player = await team.players().create({"name": "Ada"})
        tag = await ReferenceTag.create({"name": "Featured"})
        self.assertEqual(await team.tags().attach(tag), 1)
        self.assertEqual((await player.team()).id, team.id)
        loaded = await ReferenceTeam.withRelations("profile", "players", "tags").findOrFail(team.id)
        self.assertEqual(loaded.getRelation("profile").motto, "Build together")
        self.assertEqual(len(loaded.getRelation("players")), 1)
        self.assertEqual(loaded.getRelation("tags")[0].id, tag.id)
        self.assertEqual(await team.tags().detach(tag), 1)

    async def testSoftDeletes(self) -> None:
        document = await ReferenceDocument.create(
            {"title": "Draft", "status": "draft", "tenant_id": 1},
        )
        self.assertTrue(await document.delete())
        self.assertTrue(document.trashed())
        self.assertIsNone(await ReferenceDocument.find(document.id))
        self.assertEqual(await ReferenceDocument.onlyTrashed().count(), 1)
        self.assertIsNotNone(await ReferenceDocument.withTrashed().find(document.id))
        self.assertTrue(await document.restore())
        self.assertTrue(await document.forceDelete())
        self.assertIsNone(await ReferenceDocument.withTrashed().find(document.id))

    async def testLocalAndGlobalScopes(self) -> None:
        await ReferenceDocument.create({"title": "A", "status": "published", "tenant_id": 1})
        await ReferenceDocument.create({"title": "B", "status": "draft", "tenant_id": 2})
        self.assertEqual(await ReferenceDocument.forTenant(1).published().count(), 1)
        ReferenceDocument.addGlobalScope("tenant", lambda query: query.where("tenant_id", 1))
        self.assertEqual(await ReferenceDocument.count(), 1)
        self.assertEqual(await ReferenceDocument.withoutGlobalScope("tenant").count(), 2)

    async def testEventsAndCancellation(self) -> None:
        events = []
        for event in ("saving", "creating", "created", "saved"):
            ReferenceDocument.registerEvent(event, lambda model, event=event: events.append(event))
        document = await ReferenceDocument.create(
            {"title": "Events", "status": "draft", "tenant_id": 1},
        )
        self.assertEqual(events, ["saving", "creating", "created", "saved"])
        ReferenceDocument.registerEvent("saving", lambda model: False)
        document.title = "Blocked"
        self.assertFalse(await document.save())
        self.assertEqual((await ReferenceDocument.find(document.id)).title, "Events")

    async def testEventExceptionInsideTransaction(self) -> None:
        def reject_created(model) -> None:
            raise RuntimeError("listener failed")

        ReferenceDocument.registerEvent("created", reject_created)
        with self.assertRaisesRegex(RuntimeError, "listener failed"):
            async with self._connection.transaction():
                await ReferenceDocument.create(
                    {"title": "Rolled back", "status": "draft", "tenant_id": 1},
                )
        self.assertEqual(await ReferenceDocument.count(), 0)

    async def testFactories(self) -> None:
        factory = ReferenceDocumentFactory(seed=17)
        transient = factory.make(title="Transient")
        self.assertIsNone(transient.id)
        self.assertEqual(await ReferenceDocument.count(), 0)
        records = await factory.count(3).state({"status": "published"}).sequence(
            Sequence(lambda index: {"title": f"Generated {index}"}),
        ).create()
        self.assertEqual(len(records), 3)
        self.assertEqual(await ReferenceDocument.published().count(), 3)

    async def testDatabaseAndAssignmentErrors(self) -> None:
        with self.assertRaises(MassAssignmentException):
            ReferenceDocument({"not_a_column": "value"})
        values = {"title": "Unique", "status": "draft", "tenant_id": 1}
        await ReferenceDocument.create(values)
        with self.assertRaises(QueryException):
            await ReferenceDocument.create(values)
```

```text
TestCase(method_name: str = "runTest")
TestCase.setMethodPattern(pattern: str) -> None
```

El loader construye cada TestCase con el nombre del método que ejecutará. setMethodPattern es classmethod y cambia el patrón contextual usado al envolver métodos de nuevos casos; TestingEngine.setMethodPattern lo configura además de filtrar descubrimiento. El default de métodos es test*. Mantén los hooks con sus nombres nativos: no se envuelven para DI.

## Qué comprueba cada caso

| Prueba | Comportamiento real |
|---|---|
| DependencyInjection | El método test recibe el mismo `IConnectionManager`; el hook lo resuelve explícitamente. |
| RawQueries | InsertResult.row_count/last_insert_id y diccionario de una consulta `DB`. |
| ModelCrudAndState | Inserción, recuperación, dirty/clean, cambios y eliminación física. |
| FilteringAndPagination | Filtros y metadatos del paginador, sin asumir que page.items sea una lista de diccionarios. |
| TransactionRollback / ExplicitRollback | Reversión mediante contexto y control explícito de la misma conexión. |
| NestedSavepoint | Un fallo interno revierte solo el savepoint y permite confirmar el nivel exterior en SQLite. |
| RelationshipsAndEagerLoading | Las cuatro relaciones, creación por relación, pivot attach/detach y caché de carga anticipada. |
| SoftDeletes | Exclusión por defecto, withTrashed/onlyTrashed, restauración y borrado definitivo. |
| LocalAndGlobalScopes | Composición local y exclusión de un scope global en una consulta. |
| EventsAndCancellation | Orden saving→creating→created→saved y veto explícito False. |
| EventExceptionInsideTransaction | Un error de listener se propaga y la transacción exterior revierte la escritura. |
| Factories | make sin persistir, seed reproducible, state, Sequence y create de un conjunto. |
| DatabaseAndAssignmentErrors | MassAssignmentException y una violación real de UNIQUE como `QueryException`. |

La fixture usa un nombre de conexión fijo porque el runner actual ejecuta los tests secuencialmente. Para un runner paralelo necesitarías nombres/modelos y bases independientes por trabajador; no compartas una transacción activa entre tareas. addConnection reemplaza la configuración, pero no sustituye una conexión cacheada hasta desconectarla: por eso el hook llama disconnect antes de registrar otra base. No cambies `Model.connection` después de crear la clase para intentar reescribir sus metadatos.

Las condiciones globales y listeners viven en metadatos de clase: límpialos para que no afecten otros tests. Un evento no es automáticamente after-commit y una mutación de memoria o un servicio externo no se deshace con rollback. SQLite confirma la API y el flujo de esta fixture, pero no prueba semántica de DDL, tipos estrictos, locking, zonas horarias o límites de otros motores. Añade pruebas contra el motor objetivo cuando dependas de ellos; Redshift no admite savepoints ni reclamaciones de seeder.

<a id="migration-test-fixtures"></a>

## Probar migraciones y seeders reales

Esta segunda prueba usa archivos de fixture concretos, conservando el descubrimiento e importación del runner. Crea estos tres archivos; sus rutas permanecen dentro de tests y no sustituyen database/migrations de tu aplicación.

### tests/database/fixtures/migrations/m010_entries.py

```python
from orionis.database import Migration
from orionis.support.facades import Schema


class CreateReferenceEntries(Migration):
    async def up(self) -> None:
        async with Schema.create("reference_entries") as table:
            table.id()
            table.string("label", 80)

    async def down(self) -> None:
        await Schema.drop("reference_entries")
```

### tests/database/fixtures/seeders/s010_entries.py

```python
from orionis.database import Seeder
from orionis.support.facades import DB


class ReferenceEntriesSeeder(Seeder):
    async def run(self) -> None:
        await DB.table("reference_entries").insert({"label": "seeded"})
```

### tests/database/test_migration_reference.py

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis.database import Migrator, SeederRunner
from orionis.database.contracts.connection_manager import IConnectionManager
from orionis.foundation.contracts.application import IApplication
from orionis.support.facades import Application
from orionis.test import TestCase


CONNECTION = "documentation_tests"


class FixtureApplication:
    def __init__(self, app: IApplication) -> None:
        self._app = app
        self.basePath = app.basePath

    def path(self, key: str) -> Path:
        paths = {
            "database_migrations": self.basePath / "tests/database/fixtures/migrations",
            "database_seeders": self.basePath / "tests/database/fixtures/seeders",
        }
        return paths[key]

    async def build(self, target):
        return await self._app.build(target)


class TestMigrationReference(TestCase):
    async def asyncSetUp(self) -> None:
        self._temporary = TemporaryDirectory()
        self.addCleanup(self._temporary.cleanup)
        self._manager = await Application.make(IConnectionManager)
        await self._manager.disconnect(CONNECTION)
        self._manager.addConnection(
            CONNECTION,
            {"driver": "sqlite", "database": str(Path(self._temporary.name) / "migrations.sqlite")},
        )
        self.addAsyncCleanup(self._manager.disconnect, CONNECTION)

    async def testMigrationAndSeederHistory(self, app: IApplication) -> None:
        fixture_app = FixtureApplication(app)
        migrator = Migrator(fixture_app, self._manager)
        seeders = SeederRunner(fixture_app, self._manager)
        connection = self._manager.connection(CONNECTION)
        self.assertEqual(await migrator.migrate(connection=CONNECTION), ["m010_entries"])
        self.assertEqual(await seeders.seed(connection=CONNECTION), ["s010_entries"])
        self.assertEqual(await seeders.seed(connection=CONNECTION), [])
        rows = await connection.select("SELECT label FROM reference_entries")
        self.assertEqual(rows, [{"label": "seeded"}])
        state = await migrator.status(connection=CONNECTION)
        self.assertTrue(state[0]["ran"])
        self.assertEqual(state[0]["batch"], 1)
        self.assertEqual(await migrator.rollback(connection=CONNECTION), ["m010_entries"])
        self.assertEqual(await migrator.migrate(connection=CONNECTION), ["m010_entries"])
        self.assertEqual(await seeders.seed(connection=CONNECTION), ["s010_entries"])
        self.assertEqual(await migrator.fresh(connection=CONNECTION), ["m010_entries"])
        self.assertEqual(await seeders.seed(connection=CONNECTION), ["s010_entries"])

    async def testInvalidRollbackArgument(self, app: IApplication) -> None:
        migrator = Migrator(FixtureApplication(app), self._manager)
        with self.assertRaises(ValueError):
            await migrator.rollback(0, connection=CONNECTION)
```

FixtureApplication es un adaptador de prueba definido en el ejemplo: proporciona al runner basePath/path/build, sin cambiar los paths globales de la aplicación. Las clases se construyen mediante el contenedor real. migrate/seed reciben explícitamente la conexión temporal; sus llamadas `Schema` y `DB` usan el contexto de migración. Las comprobaciones demuestran orden e identidad, seed una sola vez, lote 1, rollback completo que permite volver a sembrar y fresh con historial nuevo.

```shell
orionis test --start-dir tests/database --file-pattern test_migration_reference.py --no-panel
python -B reactor test --start-dir tests/database --file-pattern test_migration_reference.py --no-panel
```

## Selección de pruebas y configuración

--start-dir/-s selecciona el directorio, --file-pattern el patrón de archivos y --method-pattern el patrón de métodos. --verbosity/-v admite 0/1/2; --fail-fast/-f recibe 0/1, no es un flag sin valor. --no-panel desactiva paneles. Los valores omitidos usan config/testing.py; sus variables son TESTING_START_DIR, TESTING_FILE_PATTERN, TESTING_METHOD_PATTERN, TESTING_VERBOSITY, TESTING_FAIL_FAST y TESTING_CACHE_RESULTS. El comando devuelve 1 si algún resultado es failed/errored y 0 en otro caso. Una selección vacía puede terminar sin fallos: confirma que se descubrieron los tests esperados.

```shell
orionis test --start-dir tests/database --file-pattern "test_*reference.py" --method-pattern "test*" --verbosity 1 --fail-fast 1 --no-panel
python -B reactor test --start-dir tests/database --file-pattern "test_*reference.py" --method-pattern "test*" --verbosity 1 --fail-fast 1 --no-panel
```

TestingEngine.discover devuelve una suite nueva; run es async y devuelve list[TestResult]. No uses ese método para sustituir Reactor dentro de un test. Su servicio y CLI se explican en [testing](/es/testing/writing-and-running-tests). Complementa estas pruebas con [transacciones](/es/database/transactions), [relaciones](/es/database/orm/relationships), [scopes](/es/database/orm/scopes), [eventos](/es/database/orm/events), [factories](/es/database/orm/factories-and-testing) y [migraciones](/es/database/migrations-and-seeders).

<a id="database-testing-engine"></a>

## Integración en un comando propio

El CLI estándar es suficiente. Si necesitas una selección de pruebas propia, inyecta ITestingEngine en un comando y reutiliza el mismo motor, sin ejecutar un event loop anidado. Los setters devuelven Self y modifican la instancia; discover devuelve unittest.TestSuite sin ejecutar pruebas, y run crea otra suite nueva antes de ejecutar y devolver list[TestResult].

```text
TestingEngine(app: IApplication)
setVerbosity(verbosity: int) -> Self
setFailFast(*, fail_fast: bool) -> Self
setStartDir(start_dir: str) -> Self
setFilePattern(file_pattern: str) -> Self
setMethodPattern(method_pattern: str) -> Self
withoutPanel() -> Self
discover() -> unittest.TestSuite
async run() -> list[TestResult]
```

```python
from orionis.console.base.command import BaseCommand
from orionis.test.contracts.engine import ITestingEngine
from orionis.test.enums.status import TestStatus


class TestDatabase(BaseCommand):
    signature = "database:test-reference"
    description = "Run the isolated database reference tests."

    async def handle(self, engine: ITestingEngine) -> int:
        engine.setStartDir("tests/database").setFilePattern("test_*reference.py")
        engine.setMethodPattern("test*").setVerbosity(1).setFailFast(fail_fast=True)
        engine.withoutPanel()
        results = await engine.run()
        failed = {TestStatus.FAILED, TestStatus.ERRORED}
        return 1 if any(result.status in failed for result in results) else 0
```

El constructor del motor toma defaults de config/testing.py; los setters mostrados no realizan toda la validación de tipos/valores del comando CLI. En particular el CLI valida verbosity en 0/1/2. TestResult incluye status, name, class_name, method, module, file_path, execution_time y detalles de error. Las afirmaciones de los tests siguen siendo la fuente del resultado; no basta con que el comando termine sin lanzar una excepción.
