export default {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn("Application", "userId", {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        after: "id",
      })
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn("Application", "userId")
    },
  }
  
  