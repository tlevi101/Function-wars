'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Friendship extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.hasOne(models.Chat, {
                foreignKey: 'friendship_id',
                as: 'Chat',
            });
            this.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'User',
                onDelete: 'CASCADE',
            });
            this.belongsTo(models.User, {
                foreignKey: 'friend_id',
                as: 'Friend',
                onDelete: 'CASCADE',
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
            modelName: 'Friendship',
        }
    );
    return Friendship;
};
