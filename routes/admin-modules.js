import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { Module } from "../models/index.js"
import { module1 } from "../data/module1.js"
import { module2 } from "../data/module2.js"

const router = express.Router()

// Ruta para crear módulos (solo admin)
router.post("/admin/modules/seed", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." })
    }

    const modules = [module1, module2]

    console.log(
      `Intentando crear ${modules.length} módulos:`,
      modules.map((m) => m.title),
    )

    // Verificar si ya existen módulos
    const existingCount = await Module.count()
    console.log(`Módulos existentes: ${existingCount}`)

    // Eliminar módulos existentes si se solicita
    if (req.body.forceReplace && existingCount > 0) {
      await Module.destroy({ where: {} })
      console.log("Módulos existentes eliminados")
    } else if (existingCount > 0) {
      return res.status(400).json({
        message: "Ya existen módulos en la base de datos",
        count: existingCount,
        tip: "Envía forceReplace: true para reemplazarlos",
      })
    }

    // Crear nuevos módulos
    const createdModules = await Module.bulkCreate(modules)
    console.log(`Módulos creados: ${createdModules.length}`)

    res.json({
      message: `${createdModules.length} módulos creados exitosamente`,
      modules: createdModules,
    })
  } catch (error) {
    console.error("Error al crear módulos:", error)
    res.status(500).json({
      message: "Error al crear módulos",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

// Ruta para obtener todos los módulos
router.get("/admin/modules", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." })
    }

    const modules = await Module.findAll({
      order: [["order", "ASC"]],
    })

    res.json(modules)
  } catch (error) {
    console.error("Error al obtener módulos:", error)
    res.status(500).json({
      message: "Error al obtener módulos",
      error: error.message,
    })
  }
})

export default router

