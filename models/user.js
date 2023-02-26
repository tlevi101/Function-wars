"use strict";
const { Model, Op } = require("sequelize");
const bcrypt = require("bcryptjs");
// const {Friendship} = require("sequelize.models")
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
      this.hasOne(models.Report, {
        foreignKey:"reported_by",
        as: "mySentReport",
      });
      this.hasOne(models.Report, {
        foreignKey: "reported",
        as: "myReceivedReport",
      });
      this.belongsToMany(models.User, {
        through: "Friendships",
        as: "myFriends",
        foreignKey: "user_id",
      });
      this.belongsToMany(models.User, {
        through: "Friendships",
        as: "friendOf",
        foreignKey:"friend_id",
      });
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
        role: this.role,
        JWT_createdAt: new Date(),
        chat_restriction: this.chat_restriction,
      };
    }
    toJSON() {
      return {
        name: this.name,
        email: this.email,
        banned: this.banned,
        banned_reason: this.banned_reason,
        is_admin: this.is_admin,
        role: this.role,
        chat_restriction: this.chat_restriction,
      };
    }
    async getFriends() {
      const friends = await sequelize.models.Friendship.findAll({
        where: {
          [Op.or]:[{user_id: this.id}, {friend_id: this.id}],
          pending: false,
        },
      });
      return friends;
    }
    async getFriendRequests() {
      return await sequelize.models.Friendship.findAll({
        where: {
          friend_id: this.id,
          pending: true,
        },
      });
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
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
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
      role: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn:[['super_admin', 'admin', 'user']],
        }
      },
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
      chat_restriction: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user) => {
          let salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },
        beforeUpdate: (user, options) => {
          options.validate = false;
          let salt = bcrypt.genSaltSync(10);
          user.password = bcrypt.hashSync(user.password, salt);
        },

      },
    }
  );
  return User;
};
