import express from "express"
import { User } from "../models/index.js"
import authenticateToken from "../middleware/auth.js"

const router = express.Router()

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ["password"] } })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message })
  }
})

export default router
