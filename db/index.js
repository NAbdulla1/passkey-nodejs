import _models from './models/index.js';

let sequelize = null;
let models = null;

export async function initializeDatabase() {
  if (sequelize) return { sequelize, models };
  
  sequelize = _models.sequelize;
  models = _models;

  // Authenticate with the database
  try {
    await sequelize.authenticate();
    console.log('Database initialized and authenticated');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
  
  return { sequelize, models };
}

export function getDatabase() {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sequelize;
}

export function getModels() {
  if (!models) {
    throw new Error('Models not initialized. Call initializeDatabase() first.');
  }
  return models;
}

export async function closeDatabase() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    models = null;
    console.log('Database closed');
  }
}
