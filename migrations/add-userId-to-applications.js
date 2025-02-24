export default {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.addColumn("Applications", "userId", {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        after: "id",
      })
    },
  
    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeColumn("Applications", "userId")
    },
  }
  
  