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
      completedModules: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
      },
    })
  
    return UserProgress
  }
  
  