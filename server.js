import express from "express"
import cors from "cors"
import { sequelize } from "./models/index.js"
import authRoutes from "./routes/auth.js"
import applicationRoutes from "./routes/apply.js"
import adminRoutes from "./routes/admin.js"
import dashboardRoutes from "./routes/dashboard.js"
import userProgressRoutes from "./routes/userProgress.js"
import moduleRoutes from "./routes/moduleRoutes.js"
import setupRoutes from "./routes/setup.js"
import adminModulesRoutes from "./routes/admin-modules.js"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { Module } from "./models/index.js"

dotenv.config()

const app = express()

console.log("Starting server initialization")

const allowedOrigins = ["https://linkup-eta.vercel.app", "http://localhost:3000","https://linkupstartups.com", process.env.CORS_ORIGIN].filter(
  Boolean,
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  }),
)
console.log("CORS configured with allowed origins:", allowedOrigins)

app.use(express.json())
console.log("JSON body parser middleware configured")

app.use(cookieParser())
console.log("Cookie parser middleware configured")

app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`)
  console.log("Headers:", JSON.stringify(req.headers, null, 2))
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2))
  }
  next()
})
console.log("Debug middleware configured")

app.get("/", (req, res) => {
  console.log("Health check route accessed")
  res.json({
    status: "ok",
    message: "LinkUp API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

console.log("Mounting routes...")
app.use("/api", authRoutes)
app.use("/api/apply", applicationRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/progress", userProgressRoutes)
app.use("/api", moduleRoutes)
app.use("/api", setupRoutes)
app.use("/api", adminModulesRoutes)
console.log("Routes mounted successfully")

// New test route for fetching module data
if (process.env.NODE_ENV === "development") {
  app.get("/api/test-fetch-module", async (req, res) => {
    try {
      const module = await Module.findOne({
        where: { order: 1 },
        include: [{ model: Subtopic, as: "subtopics" }],
      })
      res.json(module)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })
}

app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl} not found`)
  res.status(404).json({
    error: `Route not found`,
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      "POST /api/apply",
      "GET /api/admin/applications",
      "POST /api/login",
      "GET /api/users/profile",
      "PUT /api/admin/applications/:id",
      "GET /api/dashboard",
      "POST /api/dashboard/update-progress",
      "GET /api/progress/:userId",
      "GET /api/progress/:userId/:moduleId",
      "PUT /api/progress/:userId/:moduleId",
      "POST /api/modules",
      "GET /api/modules",
      "GET /api/modules/:id",
      "PUT /api/modules/:id",
      "DELETE /api/modules/:id",
      "GET /api/setup/modules",
      "POST /api/admin/modules/seed",
      "GET /api/admin/modules",
      "GET /api/test-fetch-module",
    ],
  })
})

app.use((err, req, res, next) => {
  console.error("Global error handler caught an error:")
  console.error("Error name:", err.name)
  console.error("Error message:", err.message)
  console.error("Stack trace:", err.stack)

  res.status(err.status || 500).json({
    error: err.message,
    type: err.name,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    console.log("Attempting database connection...")
    await sequelize.authenticate()
    console.log("Database connected successfully")

    console.log("Synchronizing database models...")
    await sequelize.sync()
    console.log("Database synchronized successfully")

    const server = app.listen(PORT, () => {
      const actualPort = server.address().port
      console.log(`Server running on port ${actualPort}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
      console.log("Available routes:")
      console.log("- POST /api/apply")
      console.log("- GET /api/admin/applications")
      console.log("- POST /api/login")
      console.log("- POST /api/admin/login")
      console.log("- GET /api/users/profile")
      console.log("- PUT /api/admin/applications/:id")
      console.log("- GET /api/dashboard")
      console.log("- POST /api/dashboard/update-progress")
      console.log("- GET /api/progress/:userId")
      console.log("- GET /api/progress/:userId/:moduleId")
      console.log("- PUT /api/progress/:userId/:moduleId")
      console.log("- POST /api/modules")
      console.log("- GET /api/modules")
      console.log("- GET /api/modules/:id")
      console.log("- PUT /api/modules/:id")
      console.log("- DELETE /api/modules/:id")
      console.log("- GET /api/setup/modules")
      console.log("- POST /api/admin/modules/seed")
      console.log("- GET /api/admin/modules")
      console.log("- GET /api/test-fetch-module")
    })

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`)
        server.listen(PORT + 1)
      } else {
        console.error("Server error:", error)
      }
    })
  } catch (error) {
    console.error("Server initialization failed:")
    console.error(error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== "production") {
  console.log("Starting server in development mode...")
  startServer()
} else {
  console.log("Server initialized for production mode")
  startServer()
}

export default app