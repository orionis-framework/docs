---
title: Installation
editLink: true
outline: deep
---

# Installation

## Requirements

To install and use Flaskavel, make sure you have the following prerequisites:

- `git`
- `python >= 3.12`
- `pip` (usually installed alongside Python)

## Global Installation of Flaskavel

To install Flaskavel globally on your machine or server, run the following command:

```sh
pip install flaskavel
```

If you already have it installed and want to update to the latest version, use:

```sh
pip install --upgrade flaskavel
```

## Creating a New Project

To create a new Flaskavel project, open a terminal in the directory where you want to generate the project and run:

```sh
flaskavel new example-app
```

This will produce an output similar to the following:

```
┌─┐┬  ┌─┐┌─┐┬┌─┌─┐┬  ┬┌─┐┬
├┤ │  ├─┤└─┐├┴┐├─┤└┐┌┘├┤ │
└  ┴─┘┴ ┴└─┘┴ ┴┴ ┴ └┘ └─┘┴─┘
Python isn't just powerful; it’s thrilling.
-------------------------------------------
Flaskavel Team © 2024 - 202X
Version: X.X.X
Docs: https://flaskavel.com/

Thank you for using Flaskavel.
 INFO  2024-01-06 06:00:03 [Init Project] - Cloning the repository into 'example-app'... (Getting Latest Version)
 INFO  2024-01-06 06:00:03 [Init Project] - Repository successfully cloned into 'example-app'.
 INFO  2024-01-06 06:00:03 [Init Project] - Entering directory 'example-app'.
 INFO  2024-01-06 06:00:03 [Init Project] - Creating virtual environment...
 INFO  2024-01-06 06:00:06 [Init Project] - Virtual environment successfully created.
 INFO  2024-01-06 06:00:06 [Init Project] - Installing dependencies from 'requirements.txt'...
 INFO  2024-01-06 06:00:11 [Init Project] - Dependencies successfully installed.
 INFO  2024-01-06 06:00:12 [Init Project] - Project 'example-app' successfully created at 'D:\workspace\flaskavel\example-app'.
Welcome aboard, the journey starts now. Let your imagination soar!
```

In just a few seconds, your project will be ready for you to start experiencing Flaskavel development.

## Start the Project

Now, simply navigate to the project directory and start the server.

```sh
cd ./example-app
python -B reactor serve
```

✨🚀 Unleash Your Creativity! 🚀✨