import { Module } from "../models/index.js"
import { module1 } from "../data/module1.js"
import { module2 } from "../data/module2.js"

// Aquí importarías los demás módulos cuando estén disponibles
// import { module3 } from '../data/module3.js'
// etc.

const modules = [
  module1,
  module2,
  // module3,
  // etc.
]

async function seedModules() {
  try {
    // Verificar si ya existen módulos
    const existingCount = await Module.count()
    console.log(`Módulos existentes: ${existingCount}`)

    if (existingCount > 0) {
      console.log("Ya existen módulos en la base de datos. ¿Deseas continuar y reemplazarlos? (s/n)")
      // En un script real, aquí podrías agregar una confirmación del usuario
      // Para este ejemplo, asumimos que sí queremos reemplazarlos
    }

    // Eliminar módulos existentes
    await Module.destroy({ where: {} })
    console.log("Módulos existentes eliminados")

    // Insertar nuevos módulos
    const createdModules = await Module.bulkCreate(modules)

    console.log(`✅ ${createdModules.length} módulos creados exitosamente`)
    console.log(
      "Módulos:",
      createdModules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
      })),
    )

    return createdModules
  } catch (error) {
    console.error("❌ Error al crear módulos:", error)
    throw error
  }
}

// Ejecutar el script
seedModules()
  .then(() => {
    console.log("✅ Script completado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error en el script:", error)
    process.exit(1)
  })

