export default (sequelize, DataTypes) => {
  const UserProgress = sequelize.define("UserProgress", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currentModule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    completedSections: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    responses: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  })

  // Modificamos la asociación para que sea más explícita y no cause problemas
  UserProgress.associate = (models) => {
    // Relación con Module
    UserProgress.belongsTo(models.Module, {
      foreignKey: "moduleId",
    })

    // Relación con User - IMPORTANTE: NO incluir atributos que no existen
    UserProgress.belongsTo(models.User, {
      foreignKey: "userId",
      // Especificar exactamente qué atributos queremos
      scope: {
        attributes: ["id", "username", "email", "isAdmin"],
      },
    })
  }

  return UserProgress
}

