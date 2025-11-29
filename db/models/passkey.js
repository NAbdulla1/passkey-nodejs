'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class PassKey extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PassKey.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }
  PassKey.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    challenge: DataTypes.STRING,
    credentialId: DataTypes.STRING,
    credentialCounter: DataTypes.INTEGER,
    credentialPublicKey: DataTypes.TEXT,
    credentialTransports: DataTypes.JSON,
    credentialDeviceType: DataTypes.STRING,
    credentialBackedUp: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PassKey',
  });
  return PassKey;
};