import { Sequelize } from "sequelize"
import pg from "pg"
import UserModel from "./user.js"
import ApplicationModel from "./application.js"
import ModuleModel from "./module.js"
import UserProgressModel from "./userProgress.js"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("All required modules imported successfully")

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
      dialectModule: pg,
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
      dialectModule: pg,
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
  console.error("Exiting process due to Sequelize initialization failure")
  process.exit(1)
}

console.log("Initializing models...")
console.log("Initializing User model...")
const User = UserModel(sequelize, Sequelize)
console.log("User model initialized successfully")

console.log("Initializing Application model...")
const Application = ApplicationModel(sequelize, Sequelize)
console.log("Application model initialized successfully")

console.log("Initializing Module model...")
const Module = ModuleModel(sequelize, Sequelize)
console.log("Module model initialized successfully")

console.log("Initializing UserProgress model...")
const UserProgress = UserProgressModel(sequelize, Sequelize)
console.log("UserProgress model initialized successfully")

console.log("All models initialized successfully")

// Define associations
User.hasOne(Application, { foreignKey: "userId" })
Application.belongsTo(User, { foreignKey: "userId" })

User.hasMany(UserProgress, { foreignKey: "userId" })
UserProgress.belongsTo(User, { foreignKey: "userId" })

Module.hasMany(UserProgress, { foreignKey: "moduleId" })
UserProgress.belongsTo(Module, { foreignKey: "moduleId" })

console.log("Model associations defined")

// Sync all models with the database
sequelize
  .sync({ alter: true })
  .then(() => console.log("All models were synchronized successfully."))
  .catch((error) => console.error("An error occurred while synchronizing the models:", error))

console.log("Exporting initialized models and Sequelize instance")

export { sequelize, User, Application, Module, UserProgress }

