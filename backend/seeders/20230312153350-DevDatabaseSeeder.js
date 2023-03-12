"use strict";
const { faker } = require("@faker-js/faker");
const chalk = require("chalk");
const models = require("../models");
const { User, Friendship } = models;
const { Op } = require("sequelize");


const findFriendship= async (user_id, friend_id) => {
  const friendship = await Friendship.findOne({
    where: {
      [Op.or]: [
        { friend_id: friend_id, user_id: user_id },
        { friend_id: user_id, user_id: friend_id },
      ],
    },
  });
  return friendship;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const adminCount = faker.datatype.number({ min: 2, max: 3 });
      const userCount = faker.datatype.number({ min: 20, max: 30 });
      let users = [];
      for (let i = 0; i < userCount; i++) {
        let userName= faker.internet.userName();
        console.log(userName.length);
        while(userName.length<3 || userName.length>20){
          userName= faker.internet.userName();
        }
        const user = await User.create({
          name: userName,
          email: `user${i + 1}@functionWars.com`,
          password: "password",
        });
        users.push(user);
      }
      console.log('admin');
      for (let i = 0; i < adminCount; i++) {
        let userName= faker.internet.userName();
        console.log(userName.length);
        while(userName.length<3 || userName.length>20){
          userName= faker.internet.userName();
        }
        const admin = await User.create({
          name: userName,
          email: `admin${i}@functionWars.com`,
          password: "password",
          is_admin: true,
        });
      }
      console.log('friendship');
      for (const user of users) {
        const friendCount = faker.datatype.number({ min: 3, max: 7 });
        for (let i = 0; i < friendCount; i++) {
          let friend_id = faker.helpers.arrayElement(users).id;
            while (
            friend_id === user.id ||
            await findFriendship(user.id, friend_id) !== null
          ) {
            friend_id = faker.helpers.arrayElement(users).id;
          }
          const newFriendship = await Friendship.create({
            user_id: user.id,
            friend_id: friend_id,
            pending: false,
          });
        }
      }
    } catch (err) {
      console.log(
        chalk.red(
          "DevDatabaseSeeder could not run properly, because of this error:"
        )
      );
      console.log(chalk.gray(err));
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
