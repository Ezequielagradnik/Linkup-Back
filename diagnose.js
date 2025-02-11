import { execSync } from "child_process"
import fs from "fs"

// Check if pg is installed
try {
  execSync("npm list pg", { stdio: "pipe" })
  console.log("pg is installed in the project")
} catch (error) {
  console.error("pg is not installed in the project")
}

// Check package.json for pg
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
if (packageJson.dependencies.pg || packageJson.devDependencies.pg) {
  console.log("pg is listed in package.json")
} else {
  console.log("pg is not listed in package.json")
}

// Check if there's a conflict with other PostgreSQL clients
const conflictingPackages = ["pg-native", "pg-hstore"]
conflictingPackages.forEach((pkg) => {
  try {
    require.resolve(pkg)
    console.log(`${pkg} is installed and might be causing conflicts`)
  } catch (e) {
    console.log(`${pkg} is not installed`)
  }
})

// Check Node.js version
console.log("Node.js version:", process.version)

// Check if the error is reproducible
import { Sequelize } from "sequelize"

try {
  const sequelize = new Sequelize("postgres://user:pass@example.com:5432/dbname")
  console.log("Sequelize initialized successfully")
} catch (error) {
  console.error("Error initializing Sequelize:", error.message)
}

