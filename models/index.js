import { Sequelize } from "sequelize"
import UserModel from "./user.js"
import ApplicationModel from "./application.js"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, "../.env") })

console.log("Environment variables after loading:")
console.log("DATABASE_URL:", process.env.DATABASE_URL)
console.log("DB_HOST:", process.env.DB_HOST)
console.log("DB_PORT:", process.env.DB_PORT)
console.log("DB_NAME:", process.env.DB_NAME)
console.log("DB_USER:", process.env.DB_USER)
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "[REDACTED]" : "undefined")

let sequelize

if (process.env.DATABASE_URL) {
  console.log("Initializing Sequelize with DATABASE_URL")
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
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
  })
} else {
  console.error(
    "DATABASE_URL is not defined in the environment variables. Attempting to use individual connection parameters.",
  )

  if (
    !process.env.DB_NAME ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_HOST ||
    !process.env.DB_PORT
  ) {
    console.error("Missing required database connection parameters.")
    process.exit(1)
  }

  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
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
  })
}

const User = UserModel(sequelize, Sequelize)
const Application = ApplicationModel(sequelize, Sequelize)

export { sequelize, User, Application }

