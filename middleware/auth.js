import jwt from "jsonwebtoken"
import { User } from "../models/index.js"

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (token == null) {
      console.log("Authentication failed: No token provided")
      return res.sendStatus(401)
    }

    console.log("Verifying token:", token) // Log the token being verified

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("Decoded token:", decoded) // Log the decoded token

    if (decoded.isAdmin) {
      req.user = { ...decoded, isAdmin: true }
      console.log("Admin user authenticated:", req.user)
      return next()
    }

    const user = await User.findByPk(decoded.userId)

    if (!user) {
      console.log(`Authentication failed: User not found for token ${token}`)
      return res.sendStatus(403)
    }

    req.user = user
    console.log("User authenticated:", req.user)
    next()
  } catch (error) {
    console.error("Error in authentication middleware:", error)
    res.status(403).json({ error: "Invalid token" })
  }
}

export default authenticateToken