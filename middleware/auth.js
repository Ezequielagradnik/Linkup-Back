import jwt from "jsonwebtoken"
import { User, Application } from "../models/index.js"

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) {
      console.log("Authentication failed: No token provided")
      return res.sendStatus(401)
    }

    console.log("Verifying token:", token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Decoded token:", decoded)

    // Verificar que el userId exista en el token
    if (!decoded.userId) {
      console.log("Authentication failed: No userId in token payload", decoded)
      return res.status(401).json({
        message: "Token inválido",
        error: "El token no contiene un userId válido"
      })
    }

    // Si es admin, verificamos en la tabla Users
    if (decoded.isAdmin) {
      const adminUser = await User.findByPk(decoded.userId)
      if (!adminUser) {
        console.log(`Authentication failed: Admin user not found for token ${token}`)
        return res.sendStatus(403)
      }
      req.user = { ...decoded, isAdmin: true }
      console.log("Admin user authenticated:", req.user)
      return next()
    }

    // Si es aplicante, verificamos en la tabla Applications
    if (decoded.isApplicant) {
      const applicant = await Application.findOne({
        where: { userId: decoded.userId }
      })
      
      if (!applicant) {
        console.log(`Authentication failed: Applicant not found for userId: ${decoded.userId}`)
        return res.status(403).json({
          message: "Acceso denegado",
          error: `No se encontró aplicante con userId: ${decoded.userId}`
        })
      }
      
      req.user = { 
        ...decoded, 
        isAdmin: false,
        isApplicant: true,
        application: applicant // Incluimos los datos de la aplicación
      }
      console.log("Applicant authenticated:", JSON.stringify({
        userId: req.user.userId,
        isApplicant: req.user.isApplicant
      }))
      return next()
    }

    // Si no es ni admin ni aplicante, error
    console.log(`Authentication failed: Invalid user type in token ${token}`)
    return res.sendStatus(403)

  } catch (error) {
    console.error("Error in authentication middleware:", error.message, error.stack)
    res.status(403).json({ 
      message: "Error de autenticación", 
      error: error.message 
    })
  }
}

export default authenticateToken