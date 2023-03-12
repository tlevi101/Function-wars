"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Field.init(
    {
      user_id: DataTypes.INTEGER,
      is_admin_field: DataTypes.BOOLEAN,
      field: DataTypes.JSON,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Field",
    }
  );
  return Field;
};
