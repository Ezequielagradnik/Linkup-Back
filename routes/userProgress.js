import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"

const router = express.Router()

// Obtener el progreso de un usuario en todos los módulos
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Verificar que el usuario autenticado tenga acceso a estos datos
    if (req.user.userId != userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para acceder a estos datos" })
    }

    const userProgress = await UserProgress.findAll({
      where: { userId },
      include: [{ model: Module, attributes: ["id", "title", "order"] }],
      order: [[Module, "order", "ASC"]],
    })

    res.status(200).json(userProgress)
  } catch (error) {
    console.error("Error al obtener progreso:", error)
    res.status(500).json({ message: "Error al obtener progreso", error: error.message })
  }
})

// Obtener el progreso de un usuario en un módulo específico
router.get("/:userId/:moduleId", authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.params

    // Verificar que el usuario autenticado tenga acceso a estos datos
    if (req.user.userId != userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para acceder a estos datos" })
    }

    // Buscar el progreso existente
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
    })

    // Si no existe, crear un registro inicial
    if (!userProgress) {
      userProgress = {
        userId: Number.parseInt(userId),
        moduleId: Number.parseInt(moduleId),
        progress: 0,
        completedSections: [],
        responses: {},
      }

      // Opcionalmente, guardar este registro inicial en la base de datos
      try {
        await UserProgress.create(userProgress)
      } catch (createError) {
        console.warn("No se pudo crear el registro inicial:", createError)
        // Continuamos con el objeto en memoria aunque no se haya guardado
      }
    }

    res.status(200).json(userProgress)
  } catch (error) {
    console.error("Error al obtener progreso del módulo:", error)
    res.status(500).json({
      message: "Error al obtener progreso del módulo",
      error: error.message,
      moduleId: req.params.moduleId,
      userId: req.params.userId,
    })
  }
})

// Actualizar el progreso de un usuario en un módulo específico
router.put("/:userId/:moduleId", authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.params
    const { progress, completedSections, responses, sectionId } = req.body

    // Verificar que el usuario autenticado tenga acceso a estos datos
    if (req.user.userId != userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para modificar estos datos" })
    }

    // Verificar si existe un registro de progreso
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
    })

    if (userProgress) {
      // Actualizar registro existente
      const updateData = {
        progress: progress || userProgress.progress,
      }

      // Actualizar completedSections si se proporciona
      if (completedSections) {
        updateData.completedSections = completedSections
      }

      // Si hay respuestas para una sección específica, actualizarlas
      if (responses && sectionId) {
        // Obtener las respuestas actuales
        const currentResponses = userProgress.responses || {}

        // Actualizar las respuestas para la sección específica
        currentResponses[sectionId] = responses
        updateData.responses = currentResponses
      }

      await userProgress.update(updateData)

      // Obtener el registro actualizado
      userProgress = await UserProgress.findOne({
        where: {
          userId,
          moduleId,
        },
      })

      res.status(200).json(userProgress)
    } else {
      // Crear nuevo registro
      const newProgress = await UserProgress.create({
        userId: Number.parseInt(userId),
        moduleId: Number.parseInt(moduleId),
        progress: progress || 0,
        completedSections: completedSections || [],
        responses: responses && sectionId ? { [sectionId]: responses } : {},
      })

      res.status(201).json(newProgress)
    }
  } catch (error) {
    console.error("Error al actualizar progreso:", error)
    res.status(500).json({
      message: "Error al actualizar progreso",
      error: error.message,
      moduleId: req.params.moduleId,
      userId: req.params.userId,
    })
  }
})

export default router

