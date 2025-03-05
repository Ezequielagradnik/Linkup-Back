import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"

const router = express.Router()

// NUEVA RUTA ESPECÍFICA: Obtener el progreso del usuario actual en un módulo específico
// Esta ruta debe ir ANTES de las rutas con parámetros genéricos
router.get("/module/:moduleId", authenticateToken, async (req, res) => {
  try {
    console.log("1️⃣ Token user data:", JSON.stringify(req.user, null, 2));

    // Validar si req.user y userId están definidos
    const userId = req.user?.userId;
    if (!userId) {
      console.error("❌ Error: userId es undefined o null", req.user);
      return res.status(401).json({
        message: "Usuario no autenticado",
        error: "No valid userId in request",
      });
    }

    const { moduleId } = req.params;
    console.log(`2️⃣ Buscando progreso para usuario ${userId} en módulo ${moduleId}`);

    // Buscar el progreso existente - IMPORTANTE: NO incluir ninguna asociación
    let userProgress = await UserProgress.findOne({
      where: {
        userId,
        moduleId,
      },
      // Especificar exactamente qué atributos queremos
      attributes: ["userId", "moduleId", "progress", "completedSections", "responses"],
      // NO incluir ninguna asociación
      include: [],
      raw: true, // Obtener un objeto plano en lugar de una instancia de Sequelize
    });

    // Si no existe, crear un objeto de respuesta con progreso 0%
    if (!userProgress) {
      console.log(`3️⃣ No se encontró progreso para usuario ${userId} en módulo ${moduleId}, creando nuevo registro`);

      // Crear un objeto de respuesta con valores predeterminados
      const defaultProgress = {
        userId,
        moduleId: Number.parseInt(moduleId),
        progress: 0,
        completedSections: [],
        responses: {},
      };

      // Guardar este registro inicial en la base de datos
      try {
        userProgress = await UserProgress.create(defaultProgress);
        console.log(`✅ Registro inicial creado exitosamente en la base de datos`);
        // Convertir a objeto plano para evitar problemas con las asociaciones
        userProgress = userProgress.get({ plain: true });
      } catch (createError) {
        console.error("❌ Error al crear UserProgress:", createError.message, createError.stack);
        // Devolvemos el objeto en memoria aunque no se haya guardado
        return res.status(200).json({
          ...defaultProgress,
          _error: createError.message, // Incluir el error para depuración
        });
      }
    } else {
      console.log(`✅ 4️⃣ Progreso encontrado:`, JSON.stringify(userProgress, null, 2));
    }

    // Devolver el progreso encontrado o creado
    res.status(200).json(userProgress);
  } catch (error) {
    console.error("🔥 Error al obtener progreso del módulo:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId || "unknown",
      moduleId: req.params.moduleId,
    });

    // En caso de error, devolver un objeto con progreso 0% en lugar de un error
    const defaultProgress = {
      userId: req.user?.userId,
      moduleId: Number.parseInt(req.params.moduleId),
      progress: 0,
      completedSections: [],
      responses: {},
      _error: error.message, // Incluir el error para depuración
    };

    res.status(200).json(defaultProgress);
  }
});


export default router

