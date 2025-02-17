export default (sequelize, DataTypes) => {
    const Subtopic = sequelize.define("Subtopic", {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    })
  
    return Subtopic
  }
  
  