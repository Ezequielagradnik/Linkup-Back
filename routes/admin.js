import express from "express"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/auth.js"
import { Application } from "../models/index.js"

const router = express.Router()


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

    if (status === "rejected") {
      await application.destroy()
      console.log(`Application ${id} has been rejected and deleted`)
      return res.json({ message: "Application rejected and deleted" })
    } else {
      application.status = status
      await application.save()
      console.log(`Successfully updated application ${id} status to ${status}`)
      return res.json(application)
    }
  } catch (error) {
    console.error(`Error updating application ${id}:`, error)
    res.status(500).json({ message: "Error updating application", error: error.message })
  }
})

export default router

