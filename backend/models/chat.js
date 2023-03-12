'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Friendship, {
        foreignKey: 'friendship_id',
        as: 'friendship'
      });
    }
  }
  Chat.init({
    friendship_id: DataTypes.INTEGER,
    messages: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Chat',
  });
  return Chat;
};