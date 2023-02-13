"use strict";
const { Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: "user_id" });
    }
    toJSON(){
      return{
        user_id: this.user_id,
        link : this.link,
        unique_id : this.unique_id
      }
    }
    getUuid(){
      return this.unique_id;
    }
  }
  PasswordReset.init(
    {
      user_id: DataTypes.INTEGER,
      link: DataTypes.STRING,
      unique_id: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "PasswordReset",
      hooks: {
        beforeCreate: (PasswordResetRequest) => {
          const uuid = uuidv4();
          PasswordResetRequest.unique_id = uuid;
          PasswordResetRequest.link = `/password-reset/${uuid}`;
        },
      },
    }
  );
  return PasswordReset;
};
