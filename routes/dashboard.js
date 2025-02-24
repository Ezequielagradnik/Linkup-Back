import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"

const router = express.Router()

// Cambiamos la ruta para usar el ID del usuario autenticado
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("Dashboard request received, user data:", req.user)

    // Verificamos que tengamos el ID del usuario
    if (!req.user || !req.user.userId) {
      console.error("No user ID in request")
      return res.status(401).json({
        message: "Unauthorized",
        error: "No user ID available",
      })
    }

    // Buscamos la aplicación por el ID del usuario autenticado
    const application = await Application.findOne({
      where: { id: req.user.userId },
    })

    if (!application) {
      console.error("No application found for user ID:", req.user.userId)
      return res.status(404).json({
        message: "Application not found",
        error: "No application found for this user",
      })
    }

    console.log("Application found:", {
      id: application.id,
      firstName: application.firstName,
      email: application.email,
    })

    // Buscamos el progreso del usuario
    let userProgress
    try {
      userProgress = await UserProgress.findOne({
        where: { userId: application.id },
      })
      console.log("User progress found:", userProgress)
    } catch (error) {
      console.error("Error finding user progress:", error)
    }

    // Si no hay progreso, usamos valores por defecto
    if (!userProgress) {
      console.log("No progress found, using defaults")
      userProgress = {
        currentModule: 1,
        progress: 0,
        completedSections: [],
        responses: {},
      }
    }

    // Buscamos los módulos
    const modules = await Module.findAll({
      order: [["order", "ASC"]],
    })
    console.log("Modules found:", modules.length)

    const responseData = {
      user: {
        id: application.id,
        name: application.firstName,
        email: application.email,
        currentModule: userProgress.currentModule,
        progress: userProgress.progress,
        completedModules: userProgress.completedSections || [],
      },
      modules: modules,
    }

    console.log("Sending response:", responseData)
    res.json(responseData)
  } catch (error) {
    console.error("Error in dashboard route:", error)
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

router.post("/update-progress", authenticateToken, async (req, res) => {
  try {
    const { moduleId, progress } = req.body

    let userProgress = await UserProgress.findOne({
      where: { userId: req.user.userId },
    })

    if (!userProgress) {
      userProgress = await UserProgress.create({
        userId: req.user.userId,
        moduleId,
        currentModule: moduleId,
        progress,
        completedSections: [],
        responses: {},
      })
    } else {
      userProgress.currentModule = moduleId
      userProgress.progress = progress

      if (progress === 100 && !userProgress.completedSections.includes(moduleId)) {
        userProgress.completedSections = [...userProgress.completedSections, moduleId]
      }

      await userProgress.save()
    }

    res.json({
      message: "Progress updated successfully",
      userProgress,
    })
  } catch (error) {
    console.error("Error updating progress:", error)
    res.status(500).json({ message: "Error updating progress" })
  }
})

export default router

