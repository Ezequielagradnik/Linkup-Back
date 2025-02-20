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
    console.log("\n=== Login Request ===")
    const { email, password } = req.body
    console.log("Login attempt for:", email)

    if (!email || !password) {
      console.log("Missing email or password")
      return res.status(400).json({ error: "Email and password are required" })
    }

    // First, check if it's an admin user
    let user = await User.findOne({ where: { email } })
    let isAdmin = false

    console.log("Checking admin user:", user ? "Found" : "Not found")

    if (user) {
      isAdmin = user.isAdmin
      console.log("User is admin:", isAdmin)
    } else {
      // If not an admin, check Applications table
      console.log("Checking applications table...")
      const application = await Application.findOne({ 
        where: { email },
        raw: true
      })

      console.log("Application found:", application ? "Yes" : "No")
      if (application) {
        console.log("Application status:", application.status)
        console.log("Application data:", JSON.stringify(application, null, 2))
      }

      if (!application) {
        console.log("No application found for email:", email)
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Check application status first
      if (application.status !== "accepted") {
        console.log(`Application status is ${application.status}, access denied`)
        return res.status(403).json({ 
          error: "Application pending",
          message: application.status === "pending" 
            ? "Your application is still under review" 
            : "Your application has been rejected"
        })
      }

      // If application is accepted, use this as the user
      user = application
      console.log("Using accepted application as user")
    }

    // Password validation
    console.log("Starting password validation")
    console.log("Stored password:", user.password)
    
    let isPasswordValid = false

    if (isMD5(user.password)) {
      const md5Hash = crypto.createHash("md5").update(password).digest("hex")
      isPasswordValid = md5Hash === user.password
      console.log("MD5 validation result:", isPasswordValid)
    } else if (user.password.length > 30) { // Assuming bcrypt hashes are longer than 30 chars
      isPasswordValid = await bcrypt.compare(password, user.password)
      console.log("bcrypt validation result:", isPasswordValid)
    } else {
      // Plain text password comparison
      isPasswordValid = password === user.password
      console.log("Plain text validation result:", isPasswordValid)
    }

    if (!isPasswordValid) {
      console.log("Password validation failed")
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

    console.log("Login successful")
    console.log("Response data:", {
      isAdmin,
      userId: user.id,
      email: user.email,
      name: user.name,
      status: isAdmin ? null : user.status
    })

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
    console.error("Error stack:", error.stack)
    res.status(500).json({ error: "Error during login", details: error.message })
  }
})

export default router