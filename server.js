import express from "express"
import cors from "cors"
import { sequelize } from "./models/index.js"
import authRoutes from "./routes/auth.js"
import applicationRoutes from "./routes/apply.js"
import adminRoutes from "./routes/admin.js"

const app = express()

console.log("Starting server initialization")

// Improved CORS handling to include multiple origins
const allowedOrigins = ["https://linkup-eta.vercel.app", "http://localhost:3000", process.env.CORS_ORIGIN].filter(
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

// Improved debug middleware
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

// Health check route
app.get("/", (req, res) => {
  console.log("Health check route accessed")
  res.json({
    status: "ok",
    message: "LinkUp API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// Mounting routes with better error handling
console.log("Mounting routes...")
app.use("/api/login", authRoutes)
app.use("/api/apply", applicationRoutes)
app.use("/api/admin", adminRoutes)
console.log("Routes mounted successfully")

// Improved 404 handler
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
    ],
  })
})

// Improved error handler
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

    // Improved port handling for local development
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port
      console.log(`Server running on port ${actualPort}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
      console.log("Available routes:")
      console.log("- POST /api/apply")
      console.log("- GET /api/admin/applications")
      console.log("- POST /api/login")
      console.log("- GET /api/users/profile")
      console.log("- PUT /api/admin/applications/:id")
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

// Conditional server start
if (process.env.NODE_ENV !== "production") {
  console.log("Starting server in development mode...")
  startServer()
} else {
  console.log("Server initialized for production mode")
  // In production, we might want to start the server as well
  startServer()
}

export default app

