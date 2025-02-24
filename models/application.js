export default (sequelize, DataTypes) => {
    const Application = sequelize.define("Application", {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      linkedinProfile: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      startupName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      shortDescription: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      problemSolved: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sector: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stage: {
        type: DataTypes.ENUM("idea", "mvp", "market", "scaling"),
        allowNull: false,
      },
      hasInvestment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      seekingInvestment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      hasCustomers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      customersDetails: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      links: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      founderContact: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      whyJoinLinkUp: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      howHeardAboutLinkUp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected"),
        defaultValue: "pending",
      },
    })
  
    Application.associate = (models) => {
      // Relación con UserProgress
      Application.hasOne(models.UserProgress, {
        foreignKey: "userId",
        sourceKey: "userId",
      })
    }
    
    return Application
  }
  