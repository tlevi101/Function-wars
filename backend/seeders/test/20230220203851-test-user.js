'use strict';
const { faker } = require('@faker-js/faker');
const chalk = require('chalk');
const models = require('../../models');
const { User, Friendship, Report, PasswordReset, Chat } = models;
const { Op } = require('sequelize');

/**
 * Creates 5 user and an admin
 * First user has pending friendShip with the second and the a friendship with third user
 * First user blocked 4th user
 * @type {import('sequelize-cli').Migration}
 * */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const adminCount = 1;
            const userCount = 5;
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

            users.push(
                await User.create({
                    name: 'banned user',
                    email: 'user6@functionWars.com',
                    password: 'password',
                    banned: true,
                    banned_reason: 'Test banned user',
                })
            );

            users.push(
                await User.create({
                    name: 'Chat restricted',
                    email: 'user7@functionWars.com',
                    password: 'password',
                    chat_restriction: true,
                })
            );

            users.push(
                await User.create({
                    name: 'Asked new password',
                    email: 'user8@functionWars.com',
                    password: 'password',
                })
            );

            for (let i = 0; i < adminCount; i++) {
                let userName = faker.internet.userName();
                while (userName.length < 3 || userName.length > 20) {
                    userName = faker.internet.userName();
                }
                const admin = await User.create({
                    name: userName,
                    email: `admin${i}@functionWars.com`,
                    password: 'password',
                    is_admin: true,
                    role: 'admin',
                });
            }

            const superAdmin = await User.create({
                name: 'SuperAdmin',
                email: 'superAdmin@functionWars.com',
                password: 'password',
                is_admin: true,
                role: 'super_admin',
            });

            await users[0].addMyFriends(users[1]);
            await users[0].addMyFriends(users[4]);

            const friendship1 = await Friendship.create({
                user_id: users[0].id,
                friend_id: users[2].id,
                pending: false,
            });
            const chat = await Chat.create({
                friendship_id: friendship1.id,
                messages: Array({ from: users[2].id, message: 'test message', seen: false }),
            });

            const friendship2 = await Friendship.create({
                user_id: users[0].id,
                friend_id: users[3].id,
                pending: false,
            });

            await users[0].addBlocked(users[7]);

            await users[7].createPasswordReset({
                createdAt: new Date().setHours(new Date().getHours() - 2),
            });

            const countOfStressUsers = process.env.STRESS_USERS || 0;
            for (let i = 0; i < countOfStressUsers; i++) {
                let userName = `stressUser${i + 1}`;
                console.log(userName);
                const user = await User.create({
                    name: userName,
                    email: `${userName}@functionWars.com`,
                    password: 'password',
                });
            }

            // for (const user of users) {
            //     const reportCount = faker.datatype.number({ min: 0, max: 3 });
            //     otherUsers = users.filter(u => u.id !== user.id);
            //     for (let i = 0; i < reportCount; i++) {
            //         let reported_id = faker.helpers.arrayElement(otherUsers).id;
            //         const newReport = await Report.create({
            //             reported_by: user.id,
            //             reported: reported_id,
            //             description: faker.lorem.sentence(),
            //             handled: faker.datatype.boolean(),
            //         });
            //     }
            // }
        } catch (err) {
            console.log(chalk.red('Test DB Seeder could not run properly, because of this error:'));
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
