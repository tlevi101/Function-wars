'use strict';
const { Model, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
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
                    name: 'user_id',
                    allowNull: true,
                },
            });
            this.hasMany(models.Report, {
                foreignKey: 'reported_by',
                as: 'mySentReports',
            });
            this.hasMany(models.Report, {
                foreignKey: 'reported',
                as: 'myReceivedReports',
            });
            this.belongsToMany(models.User, {
                through: 'Friendships',
                as: 'myFriends',
                foreignKey: 'user_id',
            });
            this.belongsToMany(models.User, {
                through: 'Friendships',
                as: 'friendOf',
                foreignKey: 'friend_id',
            });
            this.hasMany(models.Field, {
                foreignKey: 'user_id',
                as: 'fields',
            });
            this.belongsToMany(models.User, {
                through: 'Blocks',
                as: 'blockedBy',
                foreignKey: 'user_id',
            });
            this.belongsToMany(models.User, {
                through: 'Blocks',
                as: 'blocked',
                foreignKey: 'blocked_id',
            });
        }
        comparePassword(password) {
            return bcrypt.compareSync(password, this.password);
        }
        toJSONForJWT() {
            return {
                type: 'user',
                id: this.id,
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
                id: this.id,
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
            const friendShips = await sequelize.models.Friendship.findAll({
                where: {
                    [Op.or]: [{ user_id: this.id }, { friend_id: this.id }],
                    pending: false,
                },
                attributes: [],
                include: [
                    {
                        model: sequelize.models.User,
                        as: 'User',
                        attributes: { exclude: ['password'] },
                        where: {
                            banned: false,
                        },
                    },
                    {
                        model: sequelize.models.User,
                        as: 'Friend',
                        attributes: { exclude: ['password'] },
                        where: {
                            banned: false,
                        },
                    },
                ],
            });
            let friends = [];
            friendShips.forEach(friendship => {
                if (friendship.User.id === this.id) {
                    friends.push(friendship.Friend);
                } else {
                    friends.push(friendship.User);
                }
            });
            return friends;
        }


        async getFriendRequests() {
            const requests = await sequelize.models.Friendship.findAll({
                where: {
                    friend_id: this.id,
                    pending: true,
                },
                include: [
                    {
                        model: sequelize.models.User,
                        as: 'User',
                        attributes: { exclude: ['password'] },
                        where: {
                            banned: false,
                        },
                    },
                ],
            });
            let requestsArray = [];
            requests.forEach(request => {
                let obj = { id: request.id, from: request.User.dataValues };
                requestsArray.push(obj);
            });
            return requestsArray;
        }


        async getChat(friend_id) {
            const friendship = await this.getFriendShip(friend_id);
            if (friendship) {
                return await friendship.getChat();
            }
            return null;
        }


        async getFriendShip(friend_id) {
            const friendship = await sequelize.models.Friendship.findOne({
                where: {
                    [Op.or]: [
                        { user_id: this.id, friend_id: friend_id },
                        { user_id: friend_id, friend_id: this.id },
                    ],
                },
            });
            return friendship;
        }

        async isBlocked(other_user_id) {
            const other_user = await sequelize.models.User.findByPk(other_user_id);
            return await this.hasBlocked(other_user);
        }

        async isFriend(other_user_id) {
            const other_user = await sequelize.models.User.findByPk(other_user_id);
            return (await this.hasFriendOf(other_user)) || (await this.hasMyFriend(other_user));
        }
    }
    User.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: {
                    args: true,
                    msg: 'users_name must be unique',
                },
                validate: {
                    len: {
                        args: [3, 20],
                        msg: 'Username must be between 3 and 20 characters',
                    },
                },
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: {
                    args: true,
                    msg: 'users_email must be unique',
                },
                validate: {
                    isEmail: {
                        msg: 'Invalid email address',
                    },
                    notEmpty: {
                        msg: 'Email cannot be empty',
                    },
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: {
                        msg: 'Password cannot be empty',
                    },
                    len: {
                        args: [8, 20],
                        msg: 'Password must be between 8 and 20 characters',
                    },
                },
            },
            is_admin: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isIn: [['super_admin', 'admin', 'user']],
                },
                defaultValue: 'user',
            },
            banned: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            banned_reason: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len: {
                        args: [0, 255],
                        msg: 'Banned reason must be less than 255 characters',
                    },
                },
                defaultValue: null,
            },
            chat_restriction: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'User',
            hooks: {
                beforeCreate: user => {
                    let salt = bcrypt.genSaltSync(10);
                    user.password = bcrypt.hashSync(user.password, salt);
                },
                beforeUpdate: (user, options) => {
                    const hashedRegex = /^\$2[ayb]\$/;
                    options.validate = false;
                    if (hashedRegex.test(user.password)) return;
                    let salt = bcrypt.genSaltSync(10);
                    user.password = bcrypt.hashSync(user.password, salt);
                },
            },
        }
    );
    return User;
};
