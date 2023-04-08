'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
module.exports = (sequelize, DataTypes) => {
    class PasswordReset extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.User, { foreignKey: 'user_id' });
        }
        toJSON() {
            return {
                user_id: this.user_id,
                link: this.link,
                uuid: this.uuid,
            };
        }
        getUuid() {
            return this.uuid;
        }
    }
    PasswordReset.init(
        {
            user_id: DataTypes.INTEGER,
            link: DataTypes.STRING,
            uuid: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: 'PasswordReset',
            hooks: {
                beforeCreate: PasswordResetRequest => {
                    const uuid = uuidv4();
                    PasswordResetRequest.uuid = uuid;
                    PasswordResetRequest.link = `reset-password/${uuid}`;
                },
            },
        }
    );
    return PasswordReset;
};
