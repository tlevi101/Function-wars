'use strict';
const { faker } = require("@faker-js/faker");
const chalk = require("chalk");
const models = require("../models");
const { User, Friendship  } = models;
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      const adminCount = faker.datatype.number({ min: 2, max: 3 });
      const userCount = faker.datatype.number({ min: 20, max: 30 });
      let users = [];
      for (let i = 0; i < userCount; i++) {
        const user = await User.create({
          name: faker.internet.userName(),
          email: `user${i+1}@functionWars.com`,
          password: "password",
        });
        users.push(user);
      }
      for (let i = 0; i < adminCount; i++) {
        const admin = await User.create({
          name: faker.internet.userName(),
          email: `admin${i}@functionWars.com`,
          password: "password",
          isAdmin: true,
        });
      }
      users.forEach(async user => {
        const friendCount = faker.datatype.number({ min: 3, max: 7 });
        for (let i = 0; i < friendCount; i++) {
          const friendShip = await Friendship.create({
            user_id: user.id,
            friend_id: faker.helpers.arrayElement(users).id,
            pending: faker.helpers.maybe(()=>true, 0.4),
          });
        }
      });
    } catch (err) {
      console.log(
        chalk.red(
          "DevDatabaseSeeder could not run properly, because of this error:"
        )
      );
      console.log(chalk.gray(err));
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
