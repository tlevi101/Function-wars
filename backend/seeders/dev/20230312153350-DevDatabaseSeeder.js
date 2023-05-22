'use strict';
const { faker } = require('@faker-js/faker');
const chalk = require('chalk');
const models = require('../../models');
const { User, Friendship, Report } = models;
const { Op } = require('sequelize');

const findFriendship = async (user_id, friend_id) => {
    const friendship = await Friendship.findOne({
        where: {
            [Op.or]: [
                { friend_id: friend_id, user_id: user_id },
                { friend_id: user_id, user_id: friend_id },
            ],
        },
    });
    return friendship;
};
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const adminCount = faker.datatype.number({ min: 2, max: 3 });
            const userCount = faker.datatype.number({ min: 30, max: 50 });
            let users = [];
            for (let i = 0; i < userCount; i++) {
                let userName = faker.internet.userName();
                while (userName.length < 3 || userName.length > 20) {
                    userName = faker.internet.userName();
                }
                const user = await User.create({
                    name: userName,
                    email: `user${i + 1}@functionWars.com`,
                    password: 'password',
                });
                users.push(user);
            }
            for (let i = 0; i < adminCount; i++) {
                let userName = faker.internet.userName();
                while (userName.length < 3 || userName.length > 20) {
                    userName = faker.internet.userName();
                }
                const admin = await User.create({
                    name: userName,
                    email: `admin${i+1}@functionWars.com`,
                    password: 'password',
                    is_admin: true,
                    role: 'admin',
                });
            }
            for (const user of users) {
                const friendCount = faker.datatype.number({ min: 20, max: 30 });
                let otherUsers = users.filter(u => u.id !== user.id);
                for (let i = 0; i < friendCount; i++) {
                    let friend_id = faker.helpers.arrayElement(otherUsers).id;
                    otherUsers = otherUsers.filter(u => u.id !== friend_id);
                    const newFriendship = await Friendship.create({
                        user_id: user.id,
                        friend_id: friend_id,
                        pending: faker.datatype.boolean(),
                    });
                }
                const reportCount = faker.datatype.number({ min: 0, max: 3 });
                otherUsers = users.filter(u => u.id !== user.id);
                for (let i = 0; i < reportCount; i++) {
                    let reported_id = faker.helpers.arrayElement(otherUsers).id;
                    const newReport = await Report.create({
                        reported_by: user.id,
                        reported: reported_id,
                        description: faker.lorem.sentence(),
                        handled: faker.datatype.boolean(),
                    });
                }
            }
        } catch (err) {
            console.log(chalk.red('DevDatabaseSeeder could not run properly, because of this error:'));
            console.log(err);
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
