import jwt from "jsonwebtoken"
import { Application, User } from "../models/index.js" // Cambiado a Application

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

    // Si es aplicante, verificamos en la tabla Application
    if (decoded.isApplicant) {
      const applicant = await Application.findOne({
        // Cambiado a Application
        where: { userId: decoded.userId },
      })

      if (!applicant) {
        console.log(`Authentication failed: Applicant not found for token ${token}`)
        return res.sendStatus(403)
      }

      req.user = {
        ...decoded,
        isAdmin: false,
        isApplicant: true,
        application: applicant,
      }
      console.log("Applicant authenticated:", req.user)
      return next()
    }

    console.log(`Authentication failed: Invalid user type in token ${token}`)
    return res.sendStatus(403)
  } catch (error) {
    console.error("Error in authentication middleware:", error)
    res.status(403).json({ error: "Invalid token" })
  }
}

export default authenticateToken

