import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

router.get("/debug/modules", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." })
    }

    // Verificar si los archivos existen
    const dataDir = path.join(__dirname, "..", "data")
    const files = fs.readdirSync(dataDir)

    // Intentar importar los módulos dinámicamente
    const modules = []

    for (const file of files) {
      if (file.startsWith("module") && file.endsWith(".js")) {
        try {
          const modulePath = `../data/${file}`
          const moduleData = await import(modulePath)
          const key = Object.keys(moduleData)[0]
          modules.push({
            file,
            title: moduleData[key].title,
            order: moduleData[key].order,
            sections: moduleData[key].content.sections.length,
          })
        } catch (importError) {
          modules.push({
            file,
            error: importError.message,
          })
        }
      }
    }

    res.json({
      message: "Diagnóstico de módulos",
      dataDirectory: dataDir,
      filesInDirectory: files,
      modulesFound: modules,
    })
  } catch (error) {
    console.error("Error en diagnóstico de módulos:", error)
    res.status(500).json({
      message: "Error en diagnóstico de módulos",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
})

export default router

