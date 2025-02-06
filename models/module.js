export default (sequelize, DataTypes) => {
    const Module = sequelize.define("Module", {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      topics: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    })
  
    return Module
  }
  
  