import express from "express"
import { UserProgress, User, Module } from "../models/index.js"
import { sequelize } from "../models/index.js"
import authenticateToken from "../middleware/auth.js"
import router from "./auth.js"

// Actualizar el progreso de un usuario en un módulo
router.put("/:userId/:moduleId", authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.params
    const { progress, completedSections, responses, sectionId } = req.body

    const [updated] = await UserProgress.update(
      {
        progress,
        completedSections,
        responses: sequelize.fn("jsonb_set", sequelize.col("responses"), `{${sectionId}}`, JSON.stringify(responses)),
      },
      {
        where: { userId, moduleId },
        returning: true,
      },
    )

    if (updated) {
      const updatedProgress = await UserProgress.findOne({
        where: { userId, moduleId },
        include: [
          { model: User, attributes: ["name"] },
          { model: Module, attributes: ["title"] },
        ],
      })
      res.status(200).json(updatedProgress)
    } else {
      // Si no existe, crear nuevo registro
      const newProgress = await UserProgress.create({
        userId,
        moduleId,
        progress,
        completedSections,
        responses: { [sectionId]: responses },
      })
      res.status(201).json(newProgress)
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router
