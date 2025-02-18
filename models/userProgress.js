export default (sequelize, DataTypes) => {
  const UserProgress = sequelize.define("UserProgress", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
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
    UserProgress.belongsTo(models.User, { foreignKey: "userId" })
    UserProgress.belongsTo(models.Module, { foreignKey: "moduleId" })
  }

  return UserProgress
}

