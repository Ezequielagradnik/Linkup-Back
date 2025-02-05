import express from "express"
import { Application } from "../models/index.js"
import { sendApplicationEmail } from "../utils/email.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const applicationData = req.body

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "linkedinProfile",
      "startupName",
      "shortDescription",
      "problemSolved",
      "sector",
      "stage",
      "hasInvestment",
      "seekingInvestment",
      "hasCustomers",
      "customersDetails",
      "links",
      "founderContact",
      "whyJoinLinkUp",
      "howHeardAboutLinkUp",
    ]

    const missingFields = requiredFields.filter((field) => !applicationData[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Validation error",
        errors: missingFields.map((field) => ({ field, message: `${field} is required` })),
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(applicationData.email)) {
      return res.status(400).json({
        message: "Validation error",
        errors: [{ field: "email", message: "Invalid email format" }],
      })
    }

    // Create application in database
    const application = await Application.create(applicationData)

    // Send email notification
    await sendApplicationEmail(application)

    res.status(201).json({ message: "Application submitted successfully", applicationId: application.id })
  } catch (error) {
    console.error("Error processing application:", error)
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }))
      res.status(400).json({ message: "Validation error", errors: validationErrors })
    } else {
      res.status(500).json({ message: "Error submitting application", error: error.message })
    }
  }
})

export default router

