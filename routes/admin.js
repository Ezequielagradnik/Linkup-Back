import express from "express"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/auth.js"
import { Application } from "../models/index.js"

const router = express.Router()

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  const adminEmail = process.env.ADMIN_EMAIL || "linkup.startups@gmail.com"
  const adminPassword = process.env.ADMIN_PASSWORD || "cotur2025"

  if (email !== adminEmail || password !== adminPassword) {
    console.log(`Failed login attempt for email: ${email}`)
    return res.status(400).json({ message: "Invalid credentials" })
  }

  const token = jwt.sign({ email: adminEmail, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1h" })

  console.log(`Admin login successful for email: ${email}`)
  res.json({ token })
})

// Get all applications
router.get("/applications", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    console.log(`Unauthorized access attempt to applications list. User: ${req.user ? req.user.email : "Unknown"}`)
    return res.status(403).json({ message: "Access denied" })
  }

  try {
    const applications = await Application.findAll({
      order: [["createdAt", "DESC"]],
    })
    console.log(`Successfully fetched ${applications.length} applications`)
    res.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    res.status(500).json({ message: "Error fetching applications", error: error.message })
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

