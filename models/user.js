"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.PasswordReset, {
        foreignKey: {
          name: "user_id",
          allowNull: true,
        },
      });
      // define association here
    }
    comparePassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
    toJSONForJWT() {
      return {
        name: this.name,
        email: this.email,
        banned: this.banned,
        banned_reason: this.banned_reason,
        is_admin: this.is_admin,
        JWT_createdAt: new Date(),
      };
    }
    toJSON() {
      return {
        name: this.name,
        email: this.email,
        banned: this.banned,
        banned_reason: this.banned_reason,
        is_admin: this.is_admin,
      };
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Username already exists",
        },
        validate: {
          len: {
            args: [3, 20],
            msg: "Username must be between 3 and 20 characters",
          },
          notEmpty: {
            msg: "Username cannot be empty",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: {
          args: true,
          msg: "Email already exists",
        },
        validate: {
          isEmail: {
            msg: "Invalid email address",
          },
          notEmpty: {
            msg: "Email cannot be empty",
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password cannot be empty",
          },
          len: {
            args: [8, 20],
            msg: "Password must be between 8 and 20 characters",
          },
        },
      },
      is_admin: DataTypes.BOOLEAN,
      banned: DataTypes.BOOLEAN,
      banned_reason: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: "Banned reason must be less than 255 characters",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user) => {
          let salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },
        afterValidate: (user) => {
          let salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },
      },
    }
  );
  return User;
};
