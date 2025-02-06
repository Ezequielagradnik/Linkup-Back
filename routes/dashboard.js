import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { User, UserProgress, Module } from "../models/index.js"

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      include: [{ model: UserProgress }],
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const modules = await Module.findAll({ order: [["order", "ASC"]] })

    res.json({
      user: {
        name: user.username,
        currentModule: user.UserProgress.currentModule,
        progress: user.UserProgress.progress,
        completedModules: user.UserProgress.completedModules,
      },
      modules: modules,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    res.status(500).json({ message: "Error fetching dashboard data" })
  }
})

router.post("/update-progress", authenticateToken, async (req, res) => {
  try {
    const { moduleId, progress } = req.body
    const userProgress = await UserProgress.findOne({ where: { userId: req.user.userId } })

    if (!userProgress) {
      return res.status(404).json({ message: "User progress not found" })
    }

    userProgress.currentModule = moduleId
    userProgress.progress = progress

    if (progress === 100 && !userProgress.completedModules.includes(moduleId)) {
      userProgress.completedModules = [...userProgress.completedModules, moduleId]
    }

    await userProgress.save()

    res.json({ message: "Progress updated successfully", userProgress })
  } catch (error) {
    console.error("Error updating progress:", error)
    res.status(500).json({ message: "Error updating progress" })
  }
})

export default router

