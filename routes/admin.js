import express from "express"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/auth.js"
import { Application } from "../models/index.js"

const router = express.Router()

// Admin login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("Admin login attempt:", email)
    console.log("Expected admin email:", process.env.ADMIN_EMAIL)
    console.log("Expected admin password:", process.env.ADMIN_PASSWORD ? "[REDACTED]" : "undefined")

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error("Admin credentials are not set in environment variables")
      return res.status(500).json({ message: "Server configuration error" })
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set in environment variables")
        return res.status(500).json({ message: "Server configuration error" })
      }

      const token = jwt.sign(
        {
          userId: "admin",
          email: email,
          isAdmin: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      )

      console.log("Admin login successful")
      return res.json({ token })
    }

    console.log("Invalid admin credentials")
    return res.status(401).json({ message: "Invalid admin credentials" })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({ message: "Error during admin login", error: error.message })
  }
})

// Get all applications
router.get("/applications", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching applications. User:", req.user)

    if (!req.user || !req.user.isAdmin) {
      console.log(`Unauthorized access attempt to fetch applications. User: ${req.user ? req.user.email : "Unknown"}`)
      return res.status(403).json({ message: "Access denied" })
    }

    console.log("Attempting to fetch applications from database")
    const applications = await Application.findAll()
    console.log(`Successfully fetched ${applications.length} applications`)
    res.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    res.status(500).json({ message: "Error fetching applications", error: error.message, stack: error.stack })
  }
})

// Update application status
router.put("/applications/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    console.log(`Unauthorized access attempt to update application. User: ${req.user ? req.user.email : "Unknown"}`)
    return res.status(403).json({ message: "Access denied" })
  }

  const { id } = req.params
  const { status } = req.body

  if (!["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" })
  }

  try {
    const application = await Application.findByPk(id)
    if (!application) {
      console.log(`Attempt to update non-existent application with id: ${id}`)
      return res.status(404).json({ message: "Application not found" })
    }

    application.status = status
    await application.save()

    console.log(`Successfully updated application ${id} status to ${status}`)
    res.json(application)
  } catch (error) {
    console.error(`Error updating application ${id}:`, error)
    res.status(500).json({ message: "Error updating application", error: error.message })
  }
})

export default router

