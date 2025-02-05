import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { Application } from "../models/index.js"

const router = express.Router()

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find the application by email
    const application = await Application.findOne({ where: { email } })

    if (!application) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check if the application is accepted
    if (application.status !== "accepted") {
      return res.status(403).json({ message: "Your application is still pending or has been rejected" })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, application.password)

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: application.id, email: application.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    )

    res.json({ token })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router

