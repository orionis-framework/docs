---
title: "Testing Database and ORM"
description: "Executable modules using native TestCase, isolated SQLite, and complete persistence checks."
editUrl: true
lastUpdated: false
---

Persistence tests should demonstrate results against an isolated database as well as in-memory behavior. This guide uses native TestCase, temporary SQLite, and named connections. Every model declares connection="documentation_tests" when defined; the default connection is never changed and real application migrations are not run.

## Creating and running tests

```shell
orionis make:test database/database_reference
python -B reactor make:test database/database_reference

orionis test --start-dir tests/database --file-pattern test_database_reference.py --no-panel
python -B reactor test --start-dir tests/database --file-pattern test_database_reference.py --no-panel
```

Each pair provides alternatives. make:test requires name and prepends test_ to the filename when absent; the example creates tests/database/test_database_reference.py. The stub extends orionis.test.TestCase and contains a skipped placeholder to replace with real assertions. Directories are created and existing files are never overwritten. Extra initializers are not required for subdirectory discovery.

TestCase inherits unittest.IsolatedAsyncioTestCase and supports assertEqual, assertRaises, assertIsNone, and related assertions. Test methods can receive typed services through Application.invoke. **setUp/asyncSetUp/tearDown/asyncTearDown hooks receive no injection**; explicitly resolve services through Application inside hooks. Await asynchronous operations without asyncio.run inside tests or controllers.

<a id="database-test-fixture"></a>

## Complete Database and ORM module

Replace the generated file with this module. Each test creates a fresh SQLite file, enables foreign keys, builds tables, and registers cleanup before use. addAsyncCleanup closes only documentation_tests before deleting its temporary directory; registered cleanup also runs when preparation fails later.

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

The loader constructs each TestCase with the method name to execute. setMethodPattern is a classmethod changing the contextual pattern used to wrap methods on newly constructed cases; TestingEngine.setMethodPattern configures it as well as discovery filtering. The default method pattern is test*. Preserve native hook names: hooks are not wrapped for injection.

## What each test checks

| Test | Actual behavior |
|---|---|
| DependencyInjection | Test method injection receives the same `IConnectionManager`; hooks resolve it explicitly. |
| RawQueries | InsertResult.row_count/last_insert_id and a dictionary from a `DB` query. |
| ModelCrudAndState | Insertion, retrieval, dirty/clean state, changes, and physical deletion. |
| FilteringAndPagination | Filters and paginator metadata without assuming page.items contains dictionaries. |
| TransactionRollback / ExplicitRollback | Context and explicit rollback on the same connection. |
| NestedSavepoint | An inner failure rolls back only its savepoint and permits the SQLite outer transaction to commit. |
| RelationshipsAndEagerLoading | All four relations, related creation, pivot attach/detach, and eager loading cache. |
| SoftDeletes | Default exclusion, withTrashed/onlyTrashed, restoration, and permanent deletion. |
| LocalAndGlobalScopes | Local composition and per-query global scope exclusion. |
| EventsAndCancellation | saving→creating→created→saved order and an explicit False veto. |
| EventExceptionInsideTransaction | A listener failure propagates and the outer transaction rolls back the write. |
| Factories | Nonpersistent make, a reproducible seed, state, Sequence, and collection creation. |
| DatabaseAndAssignmentErrors | MassAssignmentException and a real UNIQUE violation as `QueryException`. |

The fixture uses one connection name because the current runner executes tests sequentially. A parallel runner would need independent model/connection names and databases per worker; do not share an active transaction between tasks. addConnection replaces configuration but leaves a cached connection intact until disconnected, which is why setup disconnects before registering another database. Do not change `Model.connection` after class creation to try to rewrite metadata.

Global scopes and listeners live in class metadata: clean them to avoid leaking into other tests. Events are not automatically after-commit, and memory mutations or external services are not undone by rollback. SQLite verifies this fixture API and flow but does not test other engines DDL semantics, strict types, locking, timezone handling, or limits. Add target backend tests when relying on them; Redshift supports neither savepoints nor seeder claims.

<a id="migration-test-fixtures"></a>

## Testing real migrations and seeders

This second test uses concrete fixture files, preserving runner discovery and imports. Create these three files; their paths remain under tests and do not replace application database/migrations.

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

FixtureApplication is a test adapter defined by the example: it provides runner basePath/path/build without changing global application paths. Classes are constructed through the real container. migrate/seed explicitly select the temporary connection; their `Schema` and `DB` calls use migration context. Assertions demonstrate identity and ordering, once-only seeding, batch 1, complete rollback allowing reseeding, and fresh rebuilding history.

```shell
orionis test --start-dir tests/database --file-pattern test_migration_reference.py --no-panel
python -B reactor test --start-dir tests/database --file-pattern test_migration_reference.py --no-panel
```

## Test selection and configuration

--start-dir/-s selects a directory, --file-pattern filters files, and --method-pattern filters methods. --verbosity/-v accepts 0/1/2; --fail-fast/-f receives 0/1 rather than acting as a valueless flag. --no-panel disables panels. Missing values use config/testing.py; its variables are TESTING_START_DIR, TESTING_FILE_PATTERN, TESTING_METHOD_PATTERN, TESTING_VERBOSITY, TESTING_FAIL_FAST, and TESTING_CACHE_RESULTS. The command returns 1 when any result is failed/errored and 0 otherwise. Empty selection can finish without failures: verify the expected tests were discovered.

```shell
orionis test --start-dir tests/database --file-pattern "test_*reference.py" --method-pattern "test*" --verbosity 1 --fail-fast 1 --no-panel
python -B reactor test --start-dir tests/database --file-pattern "test_*reference.py" --method-pattern "test*" --verbosity 1 --fail-fast 1 --no-panel
```

TestingEngine.discover returns a fresh suite; run is asynchronous and returns list[TestResult]. Do not call it as a replacement for Reactor from inside a test. Its service and CLI are covered in [testing](/en/testing/writing-and-running-tests). Complement these tests with [transactions](/en/database/transactions), [relationships](/en/orm/relationships), [scopes](/en/orm/scopes), [events](/en/orm/events), [factories](/en/orm/factories), and [migrations](/en/database/migrations).

<a id="database-testing-engine"></a>

## Integrating a custom command

The standard CLI is sufficient. A custom test selection can inject ITestingEngine into a command and reuse the same engine without nesting an event loop. Setters return Self and modify the instance; discover returns unittest.TestSuite without running tests, while run creates another fresh suite before execution and returns list[TestResult].

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

The engine constructor reads config/testing.py defaults; these setters do not perform all CLI type/value validation. In particular, the CLI validates verbosity as 0/1/2. TestResult includes status, name, class_name, method, module, file_path, execution_time, and failure details. Test assertions remain the source of results; a command finishing without an exception is insufficient.
