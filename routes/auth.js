import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { Application, User } from "../models/index.js"

const router = express.Router()

console.log("Registering /login route")

// Helper function to check if a string is a valid MD5 hash
function isMD5(str) {
  return /^[a-f0-9]{32}$/i.test(str)
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    console.log("Login attempt for email:", email)

    // First, check if it's an admin user
    let user = await User.findOne({ where: { email } })
    let isAdmin = false

    if (user) {
      isAdmin = user.isAdmin
    } else {
      // If not an admin, check Applications table
      const application = await Application.findOne({ where: { email } })

      if (!application) {
        console.log(`No application found for email: ${email}`)
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Check application status first
      if (application.status !== "accepted") {
        console.log(`Application status for ${email} is: ${application.status}`)
        return res.status(403).json({ 
          error: "Application pending",
          message: application.status === "pending" 
            ? "Your application is still under review" 
            : "Your application has been rejected"
        })
      }

      // If application is accepted, use this as the user
      user = application
    }

    // At this point, we either have an admin user or an accepted applicant
    let isPasswordValid = false

    if (isMD5(user.password)) {
      const md5Hash = crypto.createHash("md5").update(password).digest("hex")
      isPasswordValid = md5Hash === user.password
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password)
    }

    if (!isPasswordValid) {
      console.log(`Invalid password for email: ${email}`)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set")
      return res.status(500).json({ error: "Internal server error" })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isAdmin,
        isApplicant: !isAdmin
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    )

    console.log(`Login successful for ${isAdmin ? 'admin' : 'accepted applicant'}:`, email)
    return res.json({ 
      token, 
      isAdmin,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: isAdmin ? null : user.status
      }
    })

  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Error during login", details: error.message })
  }
})

export default router