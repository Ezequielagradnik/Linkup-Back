import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { Application, User } from "../models/index.js"

const router = express.Router()
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("Login attempt for email:", email)

    // First, try to find the user in the Users table (for admin users)
    let user = await User.findOne({ where: { email } })
    let isAdmin = false

    // If not found in Users table, check the Application table
    if (!user) {
      user = await Application.findOne({ where: { email } })
    } else {
      isAdmin = user.isAdmin
    }

    if (!user) {
      console.log(`User not found for email: ${email}`)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log(`Invalid password for email: ${email}`)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (!isAdmin && user.status !== "accepted") {
      return res.status(403).json({ message: "Your application is still pending or has been rejected" })
    }

    const token = jwt.sign({ userId: user.id, email: user.email, isAdmin }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    })

    console.log(isAdmin ? "Admin login successful" : "User login successful")
    return res.json({ token, isAdmin })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Error during login", details: error.message })
  }
})

export default router

