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

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      console.log(`Authentication failed: User not found for token ${token}`)
      return res.sendStatus(403)
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Error in authentication middleware:", error)
    res.status(403).json({ error: "Invalid token" })
  }
}

export default authenticateToken