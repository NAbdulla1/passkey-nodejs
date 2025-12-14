'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('PassKeys', 'authenticatorName', {
    type: Sequelize.STRING,
    allowNull: true,
    after: 'credentialBackedUp'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('PassKeys', 'authenticatorName');
}
