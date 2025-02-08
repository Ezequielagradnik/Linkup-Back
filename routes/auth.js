import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { Application, User } from "../models/index.js"

const router = express.Router()

// New admin register route
router.post("/register-admin", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if the email matches the admin email
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: "Unauthorized to register as admin" })
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email, isAdmin: true } })
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin user already exists" })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the admin user
    const adminUser = await User.create({
      email,
      password: hashedPassword,
      isAdmin: true,
    })

    res.status(201).json({ message: "Admin user created successfully" })
  } catch (error) {
    console.error("Admin registration error:", error)
    res.status(500).json({ error: "Error during admin registration" })
  }
})

// Updated login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("Login attempt for email:", email)

    // Check if it's an admin login
    const adminUser = await User.findOne({ where: { email, isAdmin: true } })
    if (adminUser) {
      const isPasswordValid = await bcrypt.compare(password, adminUser.password)
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      const token = jwt.sign({ userId: adminUser.id, email: adminUser.email, isAdmin: true }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      })

      console.log("Admin login successful")
      return res.json({ token })
    }

    // Regular user login (unchanged)
    const user = await Application.findOne({ where: { email } })
    if (!user) {
      console.log(`User not found for email: ${email}`)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log(`Invalid password for email: ${email}`)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (user.status !== "accepted") {
      return res.status(403).json({ message: "Your application is still pending or has been rejected" })
    }

    const token = jwt.sign({ userId: user.id, email: user.email, isAdmin: false }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    console.log("User login successful")
    return res.json({ token })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Error during login", details: error.message })
  }
})

export default router

