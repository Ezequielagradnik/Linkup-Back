import express from "express"
import bcrypt from "bcryptjs"
import { Application } from "../models/index.js"
import { sendApplicationEmail } from "../utils/email.js"

const router = express.Router()

router.post("/", async (req, res) => {
  console.log("==== Application Submission Process Started ====")
  console.log("Timestamp:", new Date().toISOString())
  console.log("Request body:", JSON.stringify(req.body, null, 2))

  try {
    const applicationData = req.body

    console.log("1. Validating application data")
    // Add validation logic here if needed
    console.log("Application data validated successfully")

    console.log("2. Hashing password")
    const hashedPassword = await bcrypt.hash(applicationData.password, 10)
    applicationData.password = hashedPassword
    console.log("Password hashed successfully")

    console.log("3. Creating application in database")
    console.log("Application data to be inserted:", JSON.stringify(applicationData, null, 2))
    const application = await Application.create(applicationData)
    console.log("4. Application created successfully. ID:", application.id)

    console.log("5. Sending confirmation email")
    await sendApplicationEmail(application)
    console.log("6. Confirmation email sent successfully")

    console.log("==== Application Submission Process Completed Successfully ====")

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application.id,
    })
  } catch (error) {
    console.error("==== Error in Application Submission Process ====")
    console.error("Error details:", error)
    console.error("Error name:", error.name)
    console.error("Error message:", error.message)
    console.error("Stack trace:", error.stack)

    if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      })
    } else if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Email already in use" })
    } else {
      res.status(500).json({
        message: "Error submitting application",
        error: error.message,
      })
    }
  }
})

export default router
