# REPLEX

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Getting started](#getting-started)
  - [Dev env setup](#dev-env-setup)
  - [Getting started with DB on dolthub](#getting-started-with-db-on-dolthub)
- [Project's initial database state explained](#projects-initial-database-state-explained)
  - [Schema](#schema)
  - [Fixtures](#fixtures)
- [Project development conventions](#project-development-conventions)
- [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting started

### Dev env setup

Dev environment:
- _[recommended]_ Node Version Manager (NVM):
    - [Windows](https://github.com/coreybutler/nvm-windows/releases)
    - [Linux/MacOS](https://github.com/nvm-sh/nvm)
- Install [NodeJS + npm](https://nodejs.org/en/download/package-manager) (e.g. v20.17) using NVM

> NVM is recommended to manage multiple versions of NodeJS on work machine,
> which may be required by multiple locally hosted projects.

Dolt-managed DBMS:
- Install [dolt](https://docs.dolthub.com/introduction/installation)
- Install [MySQL server](https://dev.mysql.com/downloads/mysql/) (e.g. MySQL CS v8.4.3),
  you will only use mysql CLI from this installation as dolt comes bundled with MySQL-compatible server.
- Install MySQL workbench, e.g. [TablePlus](https://tableplus.com/download)

### Getting started with DB on dolthub

`npm run dolt:get-db` - to clone the `data-delivery-roadmap` DB repo
from [DoltHub](https://www.dolthub.com/repositories/rudenko/data-delivery-roadmap)

`npm run dolt:start` - to launch Dolt-managed MySQL server.

Options to explore the database:
- `npm run dolt:mysql-cli` to launch mysql CLI client connected to Dolt managed MySQL server.
- Use TablePlus, an GUI SQL workbench app. Import `replex` connection settings from `./db/db_connection.data-delivery-roadmap.tableplusconnection` (password: `dolt.dev`).
- Use [`dolt schema`](https://docs.dolthub.com/cli-reference/cli#dolt-schema-export) and
  [`dolt sql`](https://docs.dolthub.com/cli-reference/cli#dolt-sql) commands.

See also: https://docs.dolthub.com/introduction/getting-started/database

## Project's initial database state explained

### Schema

The initial state of the database is created by feeding `./db/create-tables.sql` to `dolt sql`
command: `(cd data-delivery roadmap && dolt sql < ../db/create-tables.sql)`.

The SQL file is generated by `./db/db_schema.generate.js` that transforms a schema defined
in `./db/db_schema.data.js` into SQL queries.

The JSON object representing DB schema:

```
{
  "database": <databasename>,
  "types": <meta types definitions>,
  "tables": {
    <tablename1>: {
      <fieldname1>: <field definition>,
      <fieldname1>: <field definition>,
    },
    <tablename2>: {
      ...
    }
  }
}
```

By convention, here tables representing `m:n` relations are named following the pattern `entity1__entity2`.

`<field definition>` is a string or array of strings that represent valid SQL field definition parts,
expanded into valid SQL definitions (if first string starts with `*`) from the meta type definitions
as specified in `types` properties.

Meta types, such as `PK` (primary key) and `FK` (foreign key) are additionally treated in
special ways (see `./db/db_schema.utils.js`). Foreign key definition is always an array,
e.g. `["*FK", "foreign_table_name", "foreign_fieldname"]` (if `foreign_fieldname` is not defined
then field name being described is assumed as such). Primary and foreign key definitions only assume
single field reference.

If meta type reference consists of `*` only then meta type name is implied from the field name.
For example, `full_name: "*"` is equivalent to `full_name: "*full_name"` where `full_name` is both field name
and meta type name defined under `types` schema object.

Types `ENUM` and `SET` can be defined as a valid definition string or as an array,
e.g. `["ENUM", ["option1", "option2", ...]]`. In `./db/db_schema.data.js` you will actually see
that options for `ENUM` and `SET` are defined as constants of their own. This might be helpful
if you also want to export those definitions to build UI.

Indexes definitions (except single field PK) are not supported.

### Fixtures

`./db/fixtures.sql` is a sample data to let you start experimenting with the Dolt features
(e.g. version controlling, diffs etc) skipping the data input phase. Feed it to `dolt`
by running `(cd data-delivery roadmap && dolt sql < ../db/fixtures.sql)`.

`./db/fixtures.sql` is created from `./db/fixtures.data.js` by `./db/fixtures.generate.js`.

## Project development conventions

Dolt is a version control system for MySQL RDBMS. It is inspired by git. You may create branches
on your DB, commit, push, pull changes. Read more at [Git For Data](https://docs.dolthub.com/introduction/getting-started/git-for-data).

However, Dolt branches and Git branches are independent concepts.

This project implies that we want them synchronized for consistency. It also uses business
context of the project for this purpose.

> We considered un-synced branches and storing current Dolt branch name in a dedicated file,
> so that git and dolt branch operations could be decoupled. However, managing the file's content
> when merging, deleting a branch would be a headache.

We use [git hooks](https://githooks.com/) to conduct relevant dolt operations upon certain git
commands invocation.

| git command | git hook                                    | actions |
|-------------|---------------------------------------------|---------|
| status      | n/a                                         | ... |
| checkout    | post-checkout                               | ... |
| fetch       | n/a                                         | ... |
| remote      | n/a                                         | ... |
| pull        | n/a                                         | ... |
| merge       | post-merge                                  | ... |
| add         | n/a                                         | ... |
| commit      | pre-commit<br/>post-commit<br/>post-rewrite | ... |
| rebase      | pre-rebase<br/>post-rewrite                 | ... |
| push        | pre-push                                    | ... |


We also use `./create-branch.sh` to create branches when we want to manipulate data
in versioned workflow. In this project's business context we add or change data
in the context of programs and we also want to support experimentation for
business computations by multiple users and multiple experiments per user.

### Use cases

| Use case                 | Branching strategy                      | Command to use
|--------------------------|-----------------------------------------|-----------------------------------------------------
|  Create new data program | `data-program_codename-username-create` | `create-branch.sh program_codename username create`
Change program scope
Merge updated program
Change data for multiple programs (within 1 theme)
Change data for multiple programs (within multiple themes)
Update teams, data bundle types, benchmarks, devices etc
Work on data visualization scripts (for existing data)



## References

- [Data Versioning](https://lakefs.io/blog/data-versioning/)
- [The Definitive Guide to Database Version Control](https://www3.dbmaestro.com/the-definitive-guide-to-database-version-control)
