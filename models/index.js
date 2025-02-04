import { Sequelize } from "sequelize";
import UserModel from "./user.js";
import ApplicationModel from "./application.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pg from 'pg'; // Importamos pg explícitamente

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables before anything else
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Environment variables after loading:");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "[REDACTED]" : "undefined");

let sequelize;

const commonConfig = {
  dialect: "postgres",
  dialectModule: pg, // Añadimos el módulo pg explícitamente
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: (msg) => console.log("Sequelize log:", msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

try {
  if (process.env.DATABASE_URL) {
    console.log("Initializing Sequelize with DATABASE_URL");
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      ...commonConfig,
    });
  } else {
    console.log("Attempting to use individual connection parameters.");

    if (
      !process.env.DB_NAME ||
      !process.env.DB_USER ||
      !process.env.DB_PASSWORD ||
      !process.env.DB_HOST ||
      !process.env.DB_PORT
    ) {
      throw new Error("Missing required database connection parameters.");
    }

    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      ...commonConfig,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
    });
  }

  // Test the connection
  await sequelize.authenticate();
  console.log('Database connection has been established successfully.');

} catch (error) {
  console.error('Unable to connect to the database:', error);
  throw error; // Re-throw the error to be handled by the global error handler
}

const User = UserModel(sequelize, Sequelize);
const Application = ApplicationModel(sequelize, Sequelize);

// Define relationships if needed
// User.hasMany(Application);
// Application.belongsTo(User);

export { sequelize, User, Application };