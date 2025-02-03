import express from "express"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/auth.js"
import { Application } from "../models/index.js"

const router = express.Router()

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  const adminEmail = "linkup.startups@gmail.com"
  const adminPassword = "cotur2025"

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(400).json({ message: "Invalid credentials" })
  }

  const token = jwt.sign({ email: adminEmail, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "1h" })

  res.json({ token })
})

// Get all applications
router.get("/applications", authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied" })
  }

  try {
    const applications = await Application.findAll({
      order: [["createdAt", "DESC"]],
    })
    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: "Error fetching applications", error: error.message })
  }
})

// Update application status
router.put("/applications/:id", authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied" })
  }

  const { id } = req.params
  const { status } = req.body

  try {
    const application = await Application.findByPk(id)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    application.status = status
    await application.save()

    res.json(application)
  } catch (error) {
    res.status(500).json({ message: "Error updating application", error: error.message })
  }
})

export default router
