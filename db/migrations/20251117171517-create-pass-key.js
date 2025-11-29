'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('PassKeys', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    challenge: {
      type: Sequelize.STRING,
      allowNull: false
    },
    credentialId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    credentialCounter: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    credentialPublicKey: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    credentialTransports: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    credentialDeviceType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    credentialBackedUp: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('PassKeys');
}