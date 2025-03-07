import {knex} from "knex";

export class DbController {
  #config = null;
  #dbConnection = null;
  static defaults = {
    connectionConfig: {
      host: "localhost",
      port: "3306",
      user: "root",
      password: "",
      database: "",
      ssl: false,
    },
    poolConfig: {min: 0, max: 7},
    client: "mysql2",
  };
  constructor(connectionConfig, poolConfig, client) {
    this.#config = {
      connection: connectionConfig,
      pool: poolConfig ?? DbController.defaults.poolConfig,
      client: client ?? DbController.defaults.client,
    };
  }

  get config() { return this.#config; }
  get dbConnection() { return this.#dbConnection; }

  /**
   * Runs a session wrapped in try/catch/finally. Connects, executes callback that implements operations, destroys connection
   * @param dbName {String}
   * @param sessionOperations {@callback} is provided with instance of DbController the runSession was called upon
   * @param args {Array} args to provide the callback with
   * @returns {Promise<void>}
   */
  async runSession(dbName, sessionOperations, args = []) {
    try {
      await this.connect();
      await this.useDb(dbName);
      sessionOperations(this, ...args);
    } catch (e) {
      console.error(e);
      // throw Error(e); // throw error further down the chain
    } finally {
      this.#dbConnection.destroy();
    }
  }

  // chainable db management methods

  async connect(connectionConfig, poolConfig, client) {
    this.#config = {
      connection: connectionConfig ?? this.#config.connection,
      pool: poolConfig ?? this.#config.pool ?? DbController.defaults.poolConfig,
      client: client ?? this.#config.client ?? DbController.defaults.client,
    };
    if (this.#dbConnection) this.#dbConnection.destroy();
    this.#dbConnection = knex(this.#config);
    return this;
  }

  async useDb(dbName) {
    if (this.#dbConnection) {
      await this.#dbConnection.raw(`CREATE DATABASE IF NOT EXISTS ??`, [dbName]);
      await this.#dbConnection.destroy();
    }
    this.#config.connection.database = dbName;
    await this.connect();
    return this;
  }

  /**
   * Creates multiple tables
   * @param dbSchema {Array[Object]} each entry is {tableName: String, tableSchema: Array} // see createTable method for tableSchema specs
   * @returns {Promise<DbController>}
   */
  async createSchema(dbSchema) { // former setupDatabase
    await dbSchema.forEach(({tableName, tableSchema}) => this.createTable(tableName, tableSchema));
    return this;
  }

  /**
   * Creates a single table schema. It will bring the schema description to canonical form (lots of nested arrays).
   * See examples below to see variations of the same definition, starting with a fully qualified canonical table schema representation
   * down to the most simplified acceptable.
   * @param tableName {String}
   * @param tableSchema {Array[]} [ [ [ descriptor, [arguments] ], ... ], ... ]
   * @returns {DbController}
   * @example await createTable("table", [ [["integer", ["id"]], ["primary", []]], [ ["string", ["name", 100]]] ])
   * @example await createTable("table", [ [["integer", "id"]], ["primary"], [ ["string", ["name", 100]]] ])
   * @example await createTable("table", [ [["integer", "id"]], "primary", [ ["string", ["name", 100]]] ])
   * @example await createTable("employees_teams", [
   *     [["integer", "employee_id"], ["references", "id"], ["inTable", "employees"]],
   *     [["integer", "team_id"], ["references", "id"], ["inTable", "teams"]],
   *     [["primary", [["employee_id", "team_id"]]]], // notice how compound key identifiers are a nested arrays since knex.primary() requires single Array argument
   *   ]);
   */
  async createTable(tableName, tableSchema) {
    await this.#dbConnection.schema.createTable(tableName, table => {
      tableSchema.forEach(specificationSet => {
        specificationSet.reduce((chainableSchemaBuilder, specificationAtom) => {
          if (!Array.isArray(specificationAtom)) specificationAtom = [specificationAtom, []];
          let [descriptor, args] = specificationAtom;
          if (!Array.isArray(args)) args = [args];
          return chainableSchemaBuilder[descriptor](...args);
        }, table);
      });
    });
    return this;
  }

  async modifySchema() {
    try {
      await this.#dbConnection.transaction(async (trx) => {
        /*
        await trx.schema.alterTable("employees", (table) => {
          table.date("start_date");
        });

        await trx("employees").where("id", 0).update("start_date", "2018-08-06");
        await trx("employees").where("id", 1).update("start_date", "2018-08-06");
        await trx("employees").where("id", 2).update("start_date", "2018-08-06");
        await trx("employees").where("id", 3).update("start_date", "2021-04-19");
         */
      });
    } catch (err) {
      // Rolls back transaction
      console.error(err);
    }
  }

  async dropTable(tableName) {
    await this.#dbConnection.schema.dropTable(tableName);
    return this;
  }

  async modifyData(data) {
    try {
      await this.#dbConnection.transaction(async (trx) => {
        /* await trx("employees")
          .where("first_name", "Tim")
          .update("first_name", "Timothy");

        await trx("employees").insert({
          id: 4,
          last_name: "Bantle",
          first_name: "Taylor",
        });

        await trx("employees_teams").insert({
          employee_id: 4,
          team_id: 0,
        });

        await trx("employees_teams")
          .where("employee_id", 0)
          .where("employee_id", 1)
          .del();

         */
      });
    } catch (err) {
      // Rolls back transaction
      console.error(err);
    }
  }

  // NON-chainable DB management methods

  async getTables() {
    const res = await this.#dbConnection.raw("SHOW TABLES");
    return res[0]
      .map(table => table[`Tables_in_${this.#config.database}`]);
  }

  /**
   * Inserts multiple records into multiple tables
   * @param data {Array[]} [{tableName, idColumns, rows[]}, ...]
   * @returns {Promise<Awaited<*>[]>}
   */
  async insert(data) {
    /*
      await db("employees").insert([
        { id: 0, last_name: "Sehn", first_name: "Tim" },
        { id: 1, last_name: "Hendriks", first_name: "Brian" },
        { id: 2, last_name: "Son", first_name: "Aaron" },
        { id: 3, last_name: "Fitzgerald", first_name: "Brian" },
      ]);

      await db("teams").insert([
        { id: 0, name: "Engineering" },
        { id: 1, name: "Sales" },
      ]);

      await db("employees_teams").insert([
        { employee_id: 0, team_id: 0 },
        { employee_id: 1, team_id: 0 },
        { employee_id: 2, team_id: 0 },
        { employee_id: 0, team_id: 1 },
        { employee_id: 3, team_id: 1 },
      ]);
    */
    const insertIntoTable = async (entry) => await this.insertInto(entry.tableName, entry.rows, entry.idColumns);
    const unresolvedInsertIntoPromises = data.map(insertIntoTable);
    return await Promise.all(unresolvedInsertIntoPromises);
  }

  /**
   * Inserts multiple records into a table
   * @param tableName {String}
   * @param rows {Array[]} [ { field1: value1, field2: value2 }, ...]
   * @param idColumns {String|Array} - only makes sense for ID AUTO_INCREMENT
   * @returns records with id field updated from insert outcome
   */
  async insertInto(tableName, rows, idColumns = undefined) {
    idColumns = idColumns ? (Array.isArray(idColumns) ? idColumns : [idColumns]) : idColumns;
    if (idColumns !== undefined) {
      rows = await Promise.all(
        rows
          .map(row => this.insertIntoSingleRow(tableName, row, idColumns))
      );
      return {tableName, rows, idColumns};
    } else {
      const res = await this.#dbConnection
        .insert(rows)
        .into(tableName);
      return {tableName, rows, idColumns, response: res};
    }
  }

  async insertIntoSingleRow(tableName, row, idColumns) {
    idColumns = idColumns ? (Array.isArray(idColumns) ? idColumns : [idColumns]) : idColumns;
    const res = await this.#dbConnection
      .insert(row, idColumns)
      .into(tableName);
    if (idColumns !== undefined) {
      row[idColumns] = res;
    }
    return row;
  }

  async queryData(request) {
    /*
      console.log("=== SummaryTable");
      // Get all employees columns because we change the schema
      const colInfo = await db("employees").columnInfo();
      // console.log("colInfo", JSON.stringify(colInfo));
      const employeeCols = Object.keys(colInfo)
        .filter((col) => col !== "id")
        .map((col) => `employees.${col}`);
      // console.log("employeeCols", JSON.stringify(employeeCols));

      // Dolt supports up to 12 table joins. Here we do a 3 table join.
      const res = await db
        .select("teams.name", ...employeeCols)
        .from("employees")
        .join("employees_teams", "employees.id", "employees_teams.employee_id")
        .join("teams", "teams.id", "employees_teams.team_id")
        .orderBy("teams.name", "asc");

      console.log("Summary:");
      res.forEach((row) => {
        let startDate = "";
        if ("start_date" in row) {
          if (row.start_date === null) {
            startDate = "None";
          } else {
            const d = new Date(row.start_date);
            startDate = d.toDateString();
          }
        }
        console.log(
          `  ${row.name}: ${row.first_name} ${row.last_name} ${startDate}`
        );
      });
     */
  }

  // chainable vcs methods
  async createBranch(branch) {
    const res = await this.getBranch(branch);
    if (res.length > 0) {
      throw new DoltError(`branch exists: ${branch}`);
    } else {
      await this.#dbConnection.raw(`CALL DOLT_BRANCH(?)`, [branch]);
      await this.doltLogStatus("created branch: ", branch);
    }
    return this;
  }

  async checkoutBranch(branch) {
    await this.#dbConnection.raw(`CALL DOLT_CHECKOUT(?)`, [branch]);
    return this;
  }

  async deleteBranchesExcept(retainedBranch = "main") { // former deleteNonMainBranches
    const branches = await this.getBranches();
    await Promise.all(
      branches
        .filter(branch => branch.name !== retainedBranch)
        .map(branch => this.#dbConnection.raw(`CALL DOLT_BRANCH('-D', ?)`, [branch.name]))
    );
    return this;
  }

  async resetDatabaseRepo(mainBranch = "main") {
    const logs = await this.#dbConnection
      .select("commit_hash")
      .from("dolt_log")
      .limit(1)
      .orderBy("date", "asc");
    await this.resetHard(logs[0].commit_hash);
    await this.deleteBranchesExcept(mainBranch);
  }

  async commit(author = "DbController", msg = "") {
    const res = await this.#dbConnection.raw(`CALL DOLT_COMMIT('--author', ?, '-Am', ?)`, [
      author,
      msg,
    ]);
    await this.doltLogStatus(`Created commit: ${res[0][0].hash}`);
    return this;
  }

  async resetHard(commitId) {
    if (commitId) {
      await this.#dbConnection.raw(`CALL DOLT_RESET('--hard', ?)`, [commitId]);
      await this.doltLogStatus(`Resetting to commit: ${commitId}`);
    } else {
      await this.#dbConnection.raw(`CALL DOLT_RESET('--hard')`);
      await this.doltLogStatus(`Resetting to HEAD`);
    }
    return this;
  }

  async merge(branch) {
    const res = await this.#dbConnection.raw(`CALL DOLT_MERGE(?)`, [branch]);
    await this.doltLogStatus(
      [
        `Merge complete for ${branch}`,
        `  Commit: ${res[0][0].hash}`,
        `  Fast forward: ${res[0][0].fast_forward}`,
        `  Conflicts: ${res[0][0].conflicts}`,
      ].join("\n")
    );
    return this;
  }

  // non-chainable vcs methods
  async getBranches() {
    return this.#dbConnection.select("name").from("dolt_branches");
  }

  async getBranch(branch) {
    return this.#dbConnection.select("name").from("dolt_branches").where("name", branch);
  }

  async getActiveBranch() {
    const branch = await this.#dbConnection.raw(`SELECT ACTIVE_BRANCH()`);
    return branch[0][0]["ACTIVE_BRANCH()"];
  }

  async getCommitLog() {
    return await this.#dbConnection
      .select("commit_hash", "committer", "message")
      .from("dolt_log")
      .orderBy("date", "desc");
  }

  async getStatus() {
    const res = await this.#dbConnection.select("*").from("dolt_status");
    const status = ["Status:"];
    if (res.length === 0) {
      status.push("  No tables modified");
    } else {
      res.forEach((row) => {
        status.push(`  ${row.table_name}: ${row.status}`);
      });
    }
    await this.doltLogStatus(status.join("\n"));
    return status;
  }

  async getDiff(tableName) {
    return await this.#dbConnection
      .select("*")
      .from(`dolt_diff_${tableName}`)
      .where("to_commit", "WORKING");
  }

  // chainable Dolt logging

  async doltLogStatus(statusMsg) {
    await this.doltLog("log", statusMsg);
    return this;
  }

  async doltLogError(errorMsg) {
    await this.doltLog("error", errorMsg);
    return this;
  }

  async doltLog(type, message) {
    console[type](`dolt[${type}]: ${message}`);
    return this;
  }
}

class DoltError extends Error {
  constructor(message) {
    super(message);
    this.name = "DoltError";
    console.error(`dolt[error]: ${message}`)
  }
}
