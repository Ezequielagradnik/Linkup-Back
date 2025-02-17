import fs from "fs/promises"
import path from "path"

// Function to read and parse the JSON file
export async function readModuleData() {
  try {
    const data = await fs.readFile(path.join(process.cwd(), "src", "data", "module1_data.json"), "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading or parsing the file:", error)
    return null
  }
}

// Function to process the module data
export function processModuleData(moduleData) {
  if (!moduleData) {
    console.log("No data to process")
    return
  }

  console.log(`Module Title: ${moduleData.title}`)
  console.log(`Description: ${moduleData.description}`)
  console.log(`Order: ${moduleData.order}`)
  console.log("\nSubtopics:")

  moduleData.subtopics.forEach((subtopic, index) => {
    console.log(`\n${index + 1}. ${subtopic.title}`)
    console.log(`   Content length: ${subtopic.content.length} characters`)

    // Extract key concepts (assuming they're marked with bullet points)
    const keyConcepts = subtopic.content.match(/●[^\n]+/g) || []
    console.log(`   Key concepts: ${keyConcepts.length}`)

    // Check for exercises or practical parts
    const hasExercises = subtopic.content.includes("Ejercicio práctico")
    console.log(`   Includes exercises: ${hasExercises}`)
  })
}

// Main execution function
export async function analyzeModule() {
  const moduleData = await readModuleData()
  processModuleData(moduleData)
}

// If this file is run directly (not imported), execute the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeModule()
}

