---
title: "Creating and starting an application"
description: "Install your Orionis project, start its development server, and open the application in your browser."
editUrl: true
lastUpdated: false
---

## 1. Install the project

Follow [Installation and your first project](/en/getting-started/installation) and complete the installation before continuing.

## 2. Start the development server

From the project root, choose **one** of the following alternatives:

**Option 1: Direct Orionis command**

```bash
orionis serve
```

**Option 2: uv and Reactor**

```bash
uv run python -B reactor serve
```

## 3. Open the application

Open the URL shown in the console. The default address is [http://localhost:8000](http://localhost:8000); if the server reports a different address, use that one.

:::note[Migrations and seeders]
Migrations prepare the database schema; seeders insert initial data. Run migrations when the application's features require database tables, and seeders when you need their initial data. Review [Migrations and initial data](/en/getting-started/installation#migrations-and-initial-data) before running them.
:::
