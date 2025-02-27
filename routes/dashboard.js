import express from "express"
import { authenticateToken } from "../middleware/auth.js"
import { UserProgress, Module } from "../models/index.js"
import { Application } from "../models/index.js"

const router = express.Router()


router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("1️⃣ Token user data:", JSON.stringify(req.user, null, 2));

    // Validar si req.user y userId están definidos
    const userId = req.user?.userId;
    if (!userId) {
      console.error("❌ Error: userId es undefined o null", req.user);
      return res.status(401).json({
        message: "Unauthorized",
        error: "No valid userId in request",
      });
    }

    console.log(`2️⃣ Buscando aplicación con userId: ${userId}`);

    // Buscar la aplicación del usuario
    const application = await Application.findOne({
      where: { userId: userId },
    });

    if (!application) {
      console.error(`❌ No se encontró application para userId: ${userId}`);
      return res.status(404).json({
        message: "Application not found",
        error: "No application found for this user",
      });
    }

    console.log("✅ 3️⃣ Application encontrada:", JSON.stringify(application, null, 2));

    // Buscar módulos ordenados
    const modules = await Module.findAll({
      order: [["order", "ASC"]],
    });

    console.log(`✅ Se encontraron ${modules.length} módulos`);

    if (modules.length === 0) {
      console.error("❌ No se encontraron módulos en la base de datos");
      return res.status(500).json({
        message: "Error interno",
        error: "No se encontraron módulos disponibles",
      });
    }

    // Obtener el primer módulo
    const firstModule = modules[0];
    console.log("✅ Primer módulo encontrado:", JSON.stringify(firstModule, null, 2));

    // Buscar el progreso del usuario
    let userProgress = await UserProgress.findOne({
      where: { userId: userId },
    });

    // Si no existe el progreso, lo creamos con el moduleId del primer módulo
    if (!userProgress) {
      console.log("ℹ️ No se encontró progreso, creando nuevo con moduleId:", firstModule.id);
      
      try {
        // Verificar que el moduleId existe y es válido
        if (!firstModule.id) {
          throw new Error("El primer módulo no tiene un ID válido");
        }
        
        // Crear el progreso del usuario con valores explícitos
        userProgress = await UserProgress.create({
          userId: userId,
          moduleId: firstModule.id,
          currentModule: 1,
          progress: 0,
          completedSections: [],
          responses: {}
        });
        
        console.log("✅ Nuevo progreso creado:", JSON.stringify(userProgress, null, 2));
      } catch (createError) {
        console.error("❌ Error al crear UserProgress:", createError.message, createError.stack);
        return res.status(500).json({
          message: "Error al crear progreso de usuario",
          error: createError.message,
          details: {
            userId,
            moduleId: firstModule?.id || "undefined",
            firstModuleExists: !!firstModule,
            modulesCount: modules.length
          }
        });
      }
    }

    console.log("✅ 4️⃣ Progreso del usuario:", JSON.stringify(userProgress, null, 2));

    // Construir respuesta segura
    const responseData = {
      user: {
        id: userId,
        name: application.firstName,
        email: application.email,
        currentModule: userProgress.currentModule,
        progress: userProgress.progress,
        completedModules: userProgress.completedSections || [],
        startupName: application.startupName,
        stage: application.stage,
      },
      modules: modules.map((m) => m.toJSON()), // Convertir a JSON plano
    };

    console.log("✅ 6️⃣ Enviando respuesta:", JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error("🔥 Error en /api/dashboard:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId || "unknown",
    });

    res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
      debug: {
        userId: req.user?.userId || "unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }
});


router.post("/update-progress", authenticateToken, async (req, res) => {
  try {
    const { moduleId, progress } = req.body

    let userProgress = await UserProgress.findOne({
      where: { userId: req.user.userId },
    })

    if (!userProgress) {
      userProgress = await UserProgress.create({
        userId: req.user.userId,
        moduleId,
        currentModule: moduleId,
        progress,
        completedSections: [],
        responses: {},
      })
    } else {
      userProgress.currentModule = moduleId
      userProgress.progress = progress

      if (progress === 100 && !userProgress.completedSections.includes(moduleId)) {
        userProgress.completedSections = [...userProgress.completedSections, moduleId]
      }

      await userProgress.save()
    }

    res.json({
      message: "Progress updated successfully",
      userProgress,
    })
  } catch (error) {
    console.error("Error updating progress:", error)
    res.status(500).json({ message: "Error updating progress" })
  }
})

export default router

