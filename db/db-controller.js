import knex from "knex";

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
  constructor(connectionConfig = null, poolConfig = DbController.defaults.poolConfig, client = DbController.defaults.client) {
    this.#config = {
      connection: connectionConfig,
      pool: poolConfig,
      client,
    };
  }

  get config() { return this.#config; }
  get dbConnection() { return this.#dbConnection; }

  // chainable db management methods

  async connect(connectionConfig, poolConfig = DbController.defaults.poolConfig, client = DbController.defaults.client) {
    this.#config = {
      connection: connectionConfig,
      pool: poolConfig,
      client,
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
    this.#config.database = dbName;
    this.#dbConnection = knex(this.#config);
    return this;
  }

  async createSchema(schema) { // former setupDatabase
    await db.schema.createTable("employees", (table) => {
      table.integer("id").primary();
      table.string("last_name");
      table.string("first_name");
    });
    await db.schema.createTable("teams", (table) => {
      table.integer("id").primary();
      table.string("name");
    });
    await db.schema.createTable("employees_teams", (table) => {
      table.integer("employee_id").references("id").inTable("employees");
      table.integer("team_id").references("id").inTable("teams");
      table.primary(["employee_id", "team_id"]);
    });
  }

  // non-chainable db management methods

  async getTables() {
    const res = await this.#dbConnection.raw("SHOW TABLES");
    return res[0]
      .map(table => table[`Tables_in_${this.#config.database}`]);
  }

  // chainable vcs methods
  async createBranch(branch) {
    const res = await this.getBranch(branch);
    if (res.length > 0) {
      throw new Error(`Branch exists: ${branch}`);
    } else {
      await this.#dbConnection.raw(`CALL DOLT_BRANCH(?)`, [branch]);
      console.log("Created branch:", branch);
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

  async resetDatabase() {
    const logs = await this.#dbConnection
      .select("commit_hash")
      .from("dolt_log")
      .limit(1)
      .orderBy("date", "asc");
    await this.doltResetHard(logs[0].commit_hash);
    await this.deleteBranchesExcept(db, "main");
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
}
