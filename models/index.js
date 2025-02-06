import { Sequelize } from "sequelize"
import UserModel from "./user.js"
import ApplicationModel from "./application.js"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("Starting to load environment variables...")
dotenv.config({ path: path.join(__dirname, "../.env") })
console.log("Environment variables loaded.")

console.log("Environment variables after loading:")
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[REDACTED]" : "undefined")
console.log("DB_HOST:", process.env.DB_HOST)
console.log("DB_PORT:", process.env.DB_PORT)
console.log("DB_NAME:", process.env.DB_NAME)
console.log("DB_USER:", process.env.DB_USER)
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "[REDACTED]" : "undefined")

let sequelize

try {
  console.log("Starting Sequelize initialization...")
  if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL found. Initializing Sequelize with DATABASE_URL")
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: (msg) => console.log("Sequelize log:", msg),
    })
    console.log("Sequelize initialized with DATABASE_URL")
  } else {
    console.log("DATABASE_URL not found. Attempting to use individual connection parameters.")

    if (
      !process.env.DB_NAME ||
      !process.env.DB_USER ||
      !process.env.DB_PASSWORD ||
      !process.env.DB_HOST ||
      !process.env.DB_PORT
    ) {
      console.error("Missing required database connection parameters.")
      throw new Error("Missing required database connection parameters.")
    }

    console.log("Initializing Sequelize with individual parameters...")
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
    })
    console.log("Sequelize initialized with individual parameters")
  }

  console.log("Sequelize initialization completed successfully")

  console.log("Testing database connection...")
  await sequelize.authenticate()
  console.log("Database connection has been established successfully.")
} catch (error) {
  console.error("Failed to initialize Sequelize:")
  console.error("Error name:", error.name)
  console.error("Error message:", error.message)
  console.error("Error stack:", error.stack)
  process.exit(1)
}

console.log("Initializing models...")
const User = UserModel(sequelize, Sequelize)
console.log("User model initialized")
const Application = ApplicationModel(sequelize, Sequelize)
console.log("Application model initialized")

console.log("All models initialized successfully")

export { sequelize, User, Application }

