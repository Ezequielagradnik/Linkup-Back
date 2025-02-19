export default (sequelize, DataTypes) => {
  const Module = sequelize.define("Module", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      // Adding this field that was missing
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  })

  return Module
}

