export default (sequelize, DataTypes) => {
  const UserProgress = sequelize.define("UserProgress", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    moduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Modules",
        key: "id",
      },
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

  UserProgress.associate = (models) => {
    // Relación con Application
    UserProgress.belongsTo(models.Application, {
      foreignKey: "userId",
      targetKey: "userId",
    })
    // Relación con Module
    UserProgress.belongsTo(models.Module, {
      foreignKey: "moduleId",
    })
  }

  return UserProgress
}

