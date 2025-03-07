import {DbController} from "./db-controller.js";
import {readFileSync} from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const poolConfig = { min: 0, max: 7 };

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // To use Hosted:
  ssl: process.env.DB_SSL_PATH
    ? { ca: readFileSync(__dirname + process.env.DB_SSL_PATH) } // Can download certificate from Hosted Dolt
    : false,
};

const dbm = new DbController(config, poolConfig, "mysql2");
