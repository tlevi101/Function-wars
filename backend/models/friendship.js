"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Friendship extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.Chat, {
        foreignKey: "friendship_id",
        as: "chat",
      });
    }
  }
  Friendship.init(
    {
      user_id: DataTypes.INTEGER,
      friend_id: DataTypes.INTEGER,
      pending: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Friendship",
    }
  );
  return Friendship;
};
