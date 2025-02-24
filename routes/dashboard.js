import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    // Ya no necesitamos buscar la aplicación porque viene en req.user
    const application = req.user.application

    // Buscamos el progreso del usuario
    const userProgress = (await UserProgress.findOne({
      where: { userId: req.user.userId },
    })) || {
      currentModule: 1,
      progress: 0,
      completedSections: [],
      responses: {},
    }

    const modules = await Module.findAll({
      order: [["order", "ASC"]],
    })

    res.json({
      user: {
        name: application.firstName,
        currentModule: userProgress.currentModule,
        progress: userProgress.progress,
        completedModules: userProgress.completedSections,
      },
      modules: modules,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
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

