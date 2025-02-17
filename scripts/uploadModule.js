import fs from "fs/promises"
import path from "path"
import { sequelize, Module, Subtopic } from "../src/models/index.js"

async function readModuleData() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), "src", "data", "module1_data.json"), "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading or parsing the file:", error)
    return null
  }
}

async function uploadModule() {
  try {
    const moduleData = await readModuleData()
    if (!moduleData) {
      console.error("Failed to read module data")
      return
    }

    await sequelize.transaction(async (t) => {
      const module = await Module.create(
        {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
        },
        { transaction: t },
      )

      const subtopics = moduleData.subtopics.map((subtopic, index) => ({
        title: subtopic.title,
        content: subtopic.content,
        order: index + 1,
        moduleId: module.id,
      }))

      await Subtopic.bulkCreate(subtopics, { transaction: t })
    })

    console.log("Module 1 data uploaded successfully")
  } catch (error) {
    console.error("Error uploading module data:", error)
  } finally {
    await sequelize.close()
  }
}

async function verifyUpload() {
  const uploadedModule = await Module.findOne({
    where: { title: "Módulo 1: Introducción al Mundo de las Startups" },
    include: [{ model: Subtopic, as: "subtopics" }],
  })

  if (uploadedModule) {
    console.log("Módulo verificado en la base de datos:")
    console.log(`Título: ${uploadedModule.title}`)
    console.log(`Número de subtemas: ${uploadedModule.subtopics.length}`)
  } else {
    console.log("No se encontró el módulo en la base de datos.")
  }
}

// Execute the upload function and then verify
uploadModule().then(verifyUpload)

