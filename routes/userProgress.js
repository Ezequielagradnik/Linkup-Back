import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"

const router = express.Router()

// NUEVA RUTA ESPECÍFICA: Obtener el progreso del usuario actual en un módulo específico
// Esta ruta debe ir ANTES de las rutas con parámetros genéricos
router.get("/module/:moduleId", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Usuario no autenticado" })
    }

    const { moduleId } = req.params
    const userId = req.user.userId

    console.log(`Buscando progreso para usuario ${userId} en módulo ${moduleId}`)

    // Buscar el progreso existente - IMPORTANTE: NO incluir ninguna asociación
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
      // Especificar exactamente qué atributos queremos
      attributes: ["userId", "moduleId", "progress", "completedSections", "responses"],
      // NO incluir ninguna asociación
      include: [],
      raw: true, // Obtener un objeto plano en lugar de una instancia de Sequelize
    })

    // Si no existe, crear un objeto de respuesta con progreso 0%
    if (!userProgress) {
      console.log(`No se encontró progreso para usuario ${userId} en módulo ${moduleId}, devolviendo progreso 0%`)

      // Crear un objeto de respuesta con valores predeterminados
      const defaultProgress = {
        userId,
        moduleId: Number.parseInt(moduleId),
        progress: 0,
        completedSections: [],
        responses: {},
      }

      // Opcionalmente, guardar este registro inicial en la base de datos
      try {
        userProgress = await UserProgress.create(defaultProgress)
        console.log(`Registro inicial creado exitosamente en la base de datos`)
        // Convertir a objeto plano para evitar problemas con las asociaciones
        userProgress = userProgress.get({ plain: true })
      } catch (createError) {
        console.warn("No se pudo crear el registro inicial en la base de datos:", createError)
        // Devolvemos el objeto en memoria aunque no se haya guardado
        return res.status(200).json(defaultProgress)
      }
    } else {
      console.log(`Progreso encontrado:`, JSON.stringify(userProgress))
    }

    // Devolver el progreso encontrado o creado
    res.status(200).json(userProgress)
  } catch (error) {
    console.error("Error al obtener progreso del módulo:", error)

    // En caso de error, devolver un objeto con progreso 0% en lugar de un error
    const defaultProgress = {
      userId: req.user?.userId,
      moduleId: Number.parseInt(req.params.moduleId),
      progress: 0,
      completedSections: [],
      responses: {},
      error: error.message, // Incluir el error para depuración
    }

    res.status(200).json(defaultProgress)
  }
})

// Obtener el progreso de un usuario en todos los módulos
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Verificar que el usuario autenticado tenga acceso a estos datos
    if (req.user.userId != userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "No tienes permiso para acceder a estos datos" })
    }

    // IMPORTANTE: Especificar exactamente qué atributos queremos del modelo Module
    const userProgress = await UserProgress.findAll({
      where: { userId },
      include: [
        {
          model: Module,
          attributes: ["id", "title", "order"],
        },
      ],
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

    // Buscar el progreso existente - NO incluir el modelo User
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
      attributes: ["userId", "moduleId", "currentModule", "progress", "completedSections", "responses"],
    })

    // Si no existe, crear un registro inicial
    if (!userProgress) {
      const defaultProgress = {
        userId: Number.parseInt(userId),
        moduleId: Number.parseInt(moduleId),
        progress: 0,
        completedSections: [],
        responses: {},
      }

      // Opcionalmente, guardar este registro inicial en la base de datos
      try {
        userProgress = await UserProgress.create(defaultProgress)
      } catch (createError) {
        console.warn("No se pudo crear el registro inicial:", createError)
        // Devolvemos el objeto en memoria aunque no se haya guardado
        return res.status(200).json(defaultProgress)
      }
    }

    res.status(200).json(userProgress)
  } catch (error) {
    console.error("Error al obtener progreso del módulo:", error)

    // En caso de error, devolver un objeto con progreso 0% en lugar de un error
    const defaultProgress = {
      userId: Number.parseInt(req.params.userId),
      moduleId: Number.parseInt(req.params.moduleId),
      progress: 0,
      completedSections: [],
      responses: {},
      error: error.message, // Incluir el error para depuración
    }

    res.status(200).json(defaultProgress)
  }
})

// NUEVA RUTA ESPECÍFICA: Actualizar el progreso del usuario actual en un módulo específico
router.put("/module/:moduleId", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Usuario no autenticado" })
    }

    const { moduleId } = req.params
    const userId = req.user.userId
    const { progress, completedSections, responses, sectionId } = req.body

    console.log(`Actualizando progreso para usuario ${userId} en módulo ${moduleId}`)
    console.log(
      `Datos recibidos:`,
      JSON.stringify({
        progress,
        completedSections: completedSections ? `[${completedSections.length} items]` : null,
        sectionId,
        responses: responses ? "Datos de respuestas" : null,
      }),
    )

    // Verificar si existe un registro de progreso
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
      attributes: ["userId", "moduleId", "progress", "completedSections", "responses"], // Solo seleccionar columnas que necesitamos
    })

    if (userProgress) {
      console.log(`Progreso existente encontrado, actualizando...`)

      // Actualizar registro existente
      const updateData = {}

      if (progress !== undefined) {
        updateData.progress = progress
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
      console.log(`Progreso actualizado exitosamente`)

      // Obtener el registro actualizado
      userProgress = await UserProgress.findOne({
        where: {
          userId,
          moduleId,
        },
        attributes: ["userId", "moduleId", "progress", "completedSections", "responses"], // Solo seleccionar columnas que necesitamos
      })

      res.status(200).json(userProgress)
    } else {
      console.log(`No se encontró progreso existente, creando nuevo registro...`)

      // Crear nuevo registro
      const newProgress = await UserProgress.create({
        userId,
        moduleId: Number.parseInt(moduleId),
        progress: progress || 0,
        completedSections: completedSections || [],
        responses: responses && sectionId ? { [sectionId]: responses } : {},
      })

      console.log(`Nuevo registro de progreso creado exitosamente`)
      res.status(201).json(newProgress)
    }
  } catch (error) {
    console.error("Error al actualizar progreso:", error)
    res.status(500).json({
      message: "Error al actualizar progreso",
      error: error.message,
      moduleId: req.params.moduleId,
      userId: req.user?.userId || "unknown",
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
      attributes: ["userId", "moduleId", "progress", "completedSections", "responses"],
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
        attributes: ["userId", "moduleId", "progress", "completedSections", "responses"],
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

    // En caso de error, devolver un objeto con progreso 0% en lugar de un error
    const defaultProgress = {
      userId: Number.parseInt(req.params.userId),
      moduleId: Number.parseInt(req.params.moduleId),
      progress: 0,
      completedSections: [],
      responses: {},
      error: error.message, // Incluir el error para depuración
    }

    res.status(200).json(defaultProgress)
  }
})

export default router

