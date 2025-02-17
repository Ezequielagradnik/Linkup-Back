// routes/userProgress.js
import express from 'express'
import { UserProgress, Module, User } from '../models/index.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get user progress for all modules
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const progress = await UserProgress.findAll({
      where: { userId },
      include: [{ model: Module, attributes: ['title', 'order'] }],
      order: [[Module, 'order', 'ASC']]
    })
    if (progress.length > 0) {
      res.status(200).json(progress)
    } else {
      res.status(404).json({ message: 'No progress found for this user' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user progress for a specific module
router.get('/:userId/:moduleId', authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.params
    const progress = await UserProgress.findOne({
      where: { userId, moduleId },
      include: [
        { model: User, attributes: ['name'] },
        { model: Module, attributes: ['title'] }
      ]
    })
    if (progress) {
      res.status(200).json(progress)
    } else {
      res.status(404).json({ message: 'Progress not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user progress for a specific module
router.put('/:userId/:moduleId', authenticateToken, async (req, res) => {
  try {
    const { userId, moduleId } = req.params
    const { progress, currentModule, completedModules } = req.body
    const [updated] = await UserProgress.update(
      { progress, currentModule, completedModules },
      { where: { userId, moduleId } }
    )
    if (updated) {
      const updatedProgress = await UserProgress.findOne({
        where: { userId, moduleId },
        include: [
          { model: User, attributes: ['name'] },
          { model: Module, attributes: ['title'] }
        ]
      })
      res.status(200).json(updatedProgress)
    } else {
      res.status(404).json({ message: 'Progress not found' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

export default router