import express from 'express';
import { Module, UserProgress, User } from '../models/index.js';
import { Op } from 'sequelize';
import router from './auth.js';

// Crear un nuevo módulo
router.post('/modules', async (req, res) => {
  try {
    const module = await Module.create(req.body);
    res.status(201).json(module);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener todos los módulos
router.get('/modules', async (req, res) => {
  try {
    const modules = await Module.findAll({ order: [['order', 'ASC']] });
    res.status(200).json(modules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un módulo específico
router.get('/modules/:id', async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);
    if (module) {
      res.status(200).json(module);
    } else {
      res.status(404).json({ message: 'Módulo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un módulo
router.put('/modules/:id', async (req, res) => {
  try {
    const [updated] = await Module.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedModule = await Module.findByPk(req.params.id);
      res.status(200).json(updatedModule);
    } else {
      res.status(404).json({ message: 'Módulo no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar un módulo
router.delete('/modules/:id', async (req, res) => {
  try {
    const deleted = await Module.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send("Módulo eliminado");
    } else {
      res.status(404).json({ message: 'Módulo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener el progreso de un usuario en un módulo específico
router.get('/progress/:userId/:moduleId', async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const progress = await UserProgress.findOne({
      where: { userId, moduleId },
      include: [{ model: User, attributes: ['name'] }, { model: Module, attributes: ['title'] }]
    });
    if (progress) {
      res.status(200).json(progress);
    } else {
      res.status(404).json({ message: 'Progreso no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar el progreso de un usuario en un módulo
router.put('/progress/:userId/:moduleId', async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const { progress, currentModule, completedModules } = req.body;
    const [updated] = await UserProgress.update(
      { progress, currentModule, completedModules },
      { where: { userId, moduleId } }
    );
    if (updated) {
      const updatedProgress = await UserProgress.findOne({
        where: { userId, moduleId },
        include: [{ model: User, attributes: ['name'] }, { model: Module, attributes: ['title'] }]
      });
      res.status(200).json(updatedProgress);
    } else {
      res.status(404).json({ message: 'Progreso no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener el progreso general de un usuario
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await UserProgress.findAll({
      where: { userId },
      include: [{ model: Module, attributes: ['title', 'order'] }],
      order: [[Module, 'order', 'ASC']]
    });
    if (progress.length > 0) {
      res.status(200).json(progress);
    } else {
      res.status(404).json({ message: 'Progreso no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;