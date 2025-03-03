import express from "express"
import { Module } from "../models/index.js"
import { module1 } from "../data/module1.js"

const router = express.Router()

// Ruta pública para configuración inicial (solo usar en desarrollo)
router.get("/setup/modules", async (req, res) => {
  try {
    // Verificar si ya existen módulos
    const existingCount = await Module.count()

    if (existingCount > 0) {
      return res.json({
        message: "Los módulos ya están configurados",
        count: existingCount,
      })
    }

    const modules = [
      module1,
      // Aquí se añadirían los demás módulos cuando estén disponibles
    ]

    // Crear módulos
    const createdModules = await Module.bulkCreate(modules)

    res.json({
      message: `${createdModules.length} módulos creados exitosamente`,
      modules: createdModules,
    })
  } catch (error) {
    console.error("Error en setup de módulos:", error)
    res.status(500).json({
      message: "Error en setup de módulos",
      error: error.message,
    })
  }
})

export default router

