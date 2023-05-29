'use strict';
const { User, Field } = require('../../models');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const superAdmin = await User.findOne({ where: { role: 'super_admin' } });
        await superAdmin.createField({
            name: 'test field',
            is_admin_field: true,
            field: {
                objects: [
                    {
                        type: 'Rectangle',
                        location: { x: 300, y: 512 },
                        avoidArea: { radius: 105, location: { x: 300, y: 512 } },
                        dimension: { width: 200, height: 200 },
                    },
                    {
                        type: 'Ellipse',
                        location: { x: 500, y: 210 },
                        avoidArea: { radius: 105, location: { x: 500, y: 210 } },
                        dimension: { width: 200, height: 200 },
                    },
                ],
                players: [
                    {
                        location: { x: 210, y: 210 },
                        avoidArea: { radius: 130, location: { x: 210, y: 210 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 700, y: 525 },
                        avoidArea: { radius: 130, location: { x: 700, y: 525 } },
                        dimension: { width: 40, height: 40 },
                    },
                ],
                dimension: { width: 1000, height: 700 },
            },
        });

        await superAdmin.createField({
            name: 'test field',
            is_admin_field: true,
            field: {
                objects: [
                    {
                        type: 'Rectangle',
                        location: { x: 38, y: 512 },
                        avoidArea: { radius: 105, location: { x: 93, y: 567 } },
                        dimension: { width: 110, height: 110 },
                    },
                    {
                        type: 'Ellipse',
                        location: { x: 588, y: 43 },
                        avoidArea: { radius: 105, location: { x: 588, y: 43 } },
                        dimension: { width: 110, height: 110 },
                    },
                ],
                players: [
                    {
                        location: { x: 921, y: 629 },
                        avoidArea: { radius: 130, location: { x: 921, y: 629 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 54, y: 38 },
                        avoidArea: { radius: 130, location: { x: 54, y: 38 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 90, y: 509 },
                        avoidArea: { radius: 130, location: { x: 921, y: 629 } },
                        dimension: { width: 40, height: 40 },
                    },
                ],
                dimension: { width: 1000, height: 700 },
            },
        });

        await superAdmin.createField({
            name: 'test field',
            is_admin_field: true,
            field: {
                objects: [
                    {
                        type: 'Rectangle',
                        location: { x: 38, y: 512 },
                        avoidArea: { radius: 105, location: { x: 93, y: 567 } },
                        dimension: { width: 110, height: 110 },
                    },
                    {
                        type: 'Ellipse',
                        location: { x: 588, y: 43 },
                        avoidArea: { radius: 105, location: { x: 588, y: 43 } },
                        dimension: { width: 110, height: 110 },
                    },
                ],
                players: [
                    {
                        location: { x: 921, y: 629 },
                        avoidArea: { radius: 130, location: { x: 921, y: 629 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 54, y: 38 },
                        avoidArea: { radius: 130, location: { x: 54, y: 38 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 90, y: 509 },
                        avoidArea: { radius: 130, location: { x: 921, y: 629 } },
                        dimension: { width: 40, height: 40 },
                    },
                    {
                        location: { x: 721, y: 329 },
                        avoidArea: { radius: 130, location: { x: 921, y: 629 } },
                        dimension: { width: 40, height: 40 },
                    },
                ],
                dimension: { width: 1000, height: 700 },
            },
        });
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
