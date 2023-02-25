'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Report extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.User, {
        foreignKey: {
          name: 'reported_by',
          allowNull: false,
        },
        as:{
          name: 'reportedBy',
        }
      });
      this.hasOne(models.User, {
        foreignKey: {
          name: 'reported',
          allowNull: false,
        },
        as:{
          name: 'reportedUser',
        }
      });
    }
  }
  Report.init({
    reported_by: DataTypes.INTEGER,
    reported: DataTypes.INTEGER,
    description: DataTypes.STRING,
    handled: DataTypes.BOOLEAN,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Report',
  });
  return Report;
};