import fs from "fs/promises"
import path from "path"
import { sequelize, Module, Subtopic } from "../models/index.js"

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
    console.log("Starting module upload process...")
    const moduleData = await readModuleData()
    if (!moduleData) {
      console.error("Failed to read module data")
      return
    }

    console.log("Module data read successfully:", moduleData)

    await sequelize.transaction(async (t) => {
      console.log("Creating module...")
      const module = await Module.create(
        {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order,
        },
        { transaction: t },
      )

      console.log("Module created successfully:", module.toJSON())

      const subtopics = moduleData.subtopics.map((subtopic, index) => ({
        title: subtopic.title,
        content: subtopic.content,
        order: index + 1,
        moduleId: module.id,
      }))

      console.log("Creating subtopics...")
      await Subtopic.bulkCreate(subtopics, { transaction: t })
      console.log("Subtopics created successfully")
    })

    console.log("Module 1 data uploaded successfully")

    // Verify the upload immediately
    const uploadedModule = await Module.findOne({
      where: { order: 1 },
      include: [{ model: Subtopic, as: "subtopics" }],
    })

    if (uploadedModule) {
      console.log("Verification successful - Module found in database:", uploadedModule.toJSON())
    } else {
      console.log("Verification failed - Module not found in database")
    }
  } catch (error) {
    console.error("Error uploading module data:", error)
    console.error("Error details:", error.message)
    if (error.errors) {
      console.error("Validation errors:", error.errors)
    }
  } finally {
    await sequelize.close()
  }
}

// Execute the upload function
uploadModule()

