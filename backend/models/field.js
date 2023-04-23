'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Field extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user',
            });
        }
        static async randomField(playerLimit = 2) {
            let fields = await this.findAll({ where: { is_admin_field: true } });
            fields = await Promise.all(fields.filter(field => field.field.players.length === playerLimit));
            return fields[Math.floor(Math.random() * fields.length)];
        }
    }
    Field.init(
        {
            name: DataTypes.STRING,
            user_id: DataTypes.INTEGER,
            is_admin_field: DataTypes.BOOLEAN,
            field: DataTypes.JSON,
            deletedAt: DataTypes.DATE,
        },
        {
            sequelize,
            modelName: 'Field',
        }
    );
    return Field;
};
