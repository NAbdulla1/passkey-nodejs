import { hashSync } from 'bcryptjs';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // create user
    const now = new Date();
    await queryInterface.bulkInsert('users', [
      {
        username: 'nayon',
        email: 'a@b.com',
        createdAt: now,
        updatedAt: now,
      },
    ], { transaction });

    // fetch the inserted user's id
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'a@b.com' LIMIT 1;",
      { transaction }
    );
    if (!users || users.length === 0) return;

    const userId = users[0].id;

    // create an auth row with hashed password
    const passwordPlain = 'pass123'; // change this as needed
    const passwordHash = hashSync(passwordPlain, 10);

    await queryInterface.bulkInsert('auths', [
      {
        userId: userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    ], { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding first user:', error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  // remove auth rows for this user and the user itself
  // remove auth entries that reference the user with this email
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.sequelize.query(
      "DELETE FROM auths WHERE userId IN (SELECT id FROM users WHERE email = 'a@b.com');",
      { transaction }
    );

    await queryInterface.bulkDelete('users', { email: 'a@b.com' }, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error reverting first user seed:', error);
    throw error;
  }
}
