"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface
      .createTable("Users", {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
        },
        email: {
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
        },
        is_admin: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        banned: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        banned_reason: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        chat_restriction: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })
      .then(() => {
        queryInterface.addIndex("Users", ["email"], {
          unique: true,
        });
      })
      .then(() => {
        queryInterface.addIndex("Users", ["name"], {
          unique: true,
        });
      });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
