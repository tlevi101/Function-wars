'use strict';
const { faker } = require('@faker-js/faker');
const chalk = require('chalk');
const models = require('../../models');
const { User } = models;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const name = 'Super Admin';
            const email = 'super.admin@functionWars.com';
            const password = faker.internet.password(8);
            const user = await User.create({
                name,
                email,
                password,
                is_admin: true,
                role: 'super_admin',
            });
            console.log(chalk.green('Super Admin created successfully!'));
            console.log(chalk.blue('Name: ' + name));

            console.log(chalk.red('Please save this information in a safe place!'));
            console.info(chalk.blue('Email: ' + email));
            console.info(chalk.blue('Password: ' + password));
        } catch (error) {
            console.error(chalk.red('DevDatabaseSeeder could not run properly, because of this error:'));
            console.log(error);
        }
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
