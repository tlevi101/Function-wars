'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface
            .createTable('PasswordResets', {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER,
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    references: {
                        model: 'Users',
                        key: 'id',
                    },
                },
                link: {
                    type: Sequelize.STRING,
                },
                uuid: {
                    type: Sequelize.STRING,
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
                queryInterface.addIndex('PasswordResets', ['user_id'], {
                    unique: true,
                });
            });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('PasswordResets');
    },
};
