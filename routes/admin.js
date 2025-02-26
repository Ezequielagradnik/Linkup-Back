import express from "express"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/auth.js"
import { Application, User } from "../models/index.js"

const router = express.Router()


// Get all applications
router.get("/applications", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching applications. User:", req.user)

    if (!req.user || !req.user.isAdmin) {
      console.log(`Unauthorized access attempt to fetch applications. User: ${req.user ? req.user.email : "Unknown"}`)
      return res.status(403).json({ message: "Access denied" })
    }

    console.log("Attempting to fetch applications from database")
    const applications = await Application.findAll()
    console.log(`Successfully fetched ${applications.length} applications`)
    res.json(applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    res.status(500).json({ message: "Error fetching applications", error: error.message, stack: error.stack })
  }
})

// Update application status
router.put("/applications/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    console.log(
      `Intento de acceso no autorizado para actualizar aplicación. Usuario: ${req.user ? req.user.email : "Desconocido"}`,
    )
    return res.status(403).json({ message: "Acceso denegado" })
  }

  const { id } = req.params
  const { status } = req.body

  if (!["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Estado no válido" })
  }

  try {
    const application = await Application.findByPk(id)
    if (!application) {
      console.log(`Intento de actualizar una aplicación inexistente con id: ${id}`)
      return res.status(404).json({ message: "Aplicación no encontrada" })
    }

    if (status === "rejected") {
      await application.destroy()
      console.log(`Aplicación ${id} ha sido rechazada y eliminada`)
      return res.json({ message: "Aplicación rechazada y eliminada" })
    } else if (status === "accepted") {
      // Crear nuevo usuario a partir de la aplicación aceptada
      try {
        // Verificar si ya existe un usuario con este email
        const existingUser = await User.findOne({ where: { email: application.email } })

        if (existingUser) {
          console.log(`Usuario con email ${application.email} ya existe`)
          return res.status(409).json({
            message: "Ya existe un usuario con este correo electrónico",
            application,
          })
        }

        // Crear el username a partir del nombre y apellido
        const username = `${application.firstName.toLowerCase()}.${application.lastName.toLowerCase()}`

        // Crear nuevo usuario solo con los campos que existen en el modelo User
        const newUser = await User.create({
          username: username,
          email: application.email,
          password: application.password, // Asegúrate de que la contraseña ya esté hasheada
          isAdmin: false,
        })

        console.log(`Creado nuevo usuario con ID ${newUser.id} a partir de la aplicación ${id}`)

        // Actualizar estado de la aplicación
        application.status = status
        await application.save()

        return res.json({
          message: "Aplicación aceptada y usuario creado exitosamente",
          application,
          user: newUser,
        })
      } catch (error) {
        console.error(`Error al crear usuario desde la aplicación ${id}:`, error)
        return res.status(500).json({
          message: "Error al crear usuario desde la aplicación",
          error: error.message,
        })
      }
    } else {
      // Para otras actualizaciones de estado (como "pending")
      application.status = status
      await application.save()
      console.log(`Actualizado exitosamente el estado de la aplicación ${id} a ${status}`)
      return res.json(application)
    }
  } catch (error) {
    console.error(`Error al actualizar la aplicación ${id}:`, error)
    res.status(500).json({ message: "Error al actualizar la aplicación", error: error.message })
  }
})

export default router

