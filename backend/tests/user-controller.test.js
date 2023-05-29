const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const { Op } = require('sequelize');
const jsonwebtoken = require('jsonwebtoken');
const Client = require('socket.io-client');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const chalk = require('chalk');
const { CustomGameController } = require('../types/controllers/CustomGameController');
const { v4: uuidv4 } = require('uuid');
const signToken = json => {
    return jsonwebtoken.sign(json, process.env.JWT_SECRET || 'secret', {
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
    });
};
describe('test users controller', () => {
    let guestToken;
    let users;
    const userTokens = [];
    beforeAll(async () => {
        users = await User.findAll({
            where: {
                role: 'user',
            },
        });
        for await (const user of users) {
            const token = signToken(user.toJSONForJWT());
            userTokens.push(token);
        }
        guestToken = signToken({
            type: 'guest',
            name: `Guest: test guest`,
            guest: true,
            JWT_createdAt: new Date(),
            id: uuidv4(),
        });
    }, 10 * 1000);

    describe('send report', () => {
        const testCases = [
            { title: 'self report', targetID: 1, description: 'lorem', code: 403, msg: "You can't report yourself." },
            {
                title: 'description missing',
                targetID: 2,
                description: undefined,
                code: 400,
                msg: 'Description is required.',
            },
            {
                title: 'target user not found',
                targetID: 10000,
                description: 'lorem',
                code: 404,
                msg: 'User not found.',
            },
            { title: 'success', targetID: 2, description: 'lorem', code: 200, msg: 'Report sent.' },
        ];

        test.each(testCases)('test $title', async ({ targetID, description, code, msg }) => {
            const response = await request
                .post(`/users/${targetID}/report`)
                .send({
                    description,
                })
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(code);
            expect(response.body.message).toBe(msg);
        });

        test('test guest user', async () => {
            const response = await request
                .post(`/users/${1}/report`)
                .send({
                    description: 'fail',
                })
                .set('Authorization', `Bearer ${guestToken}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Guest cannot make this request!');
        });
    });

    describe('block tests', () => {
        const blockTestCases = [
            { title: 'target user not found', targetID: 10000, code: 404, message: 'Other user not found.' },
            { title: 'self block', targetID: 1, code: 403, message: "You can't block yourself." },
            { title: 'success', targetID: 2, code: 200, message: 'User blocked.' },
        ];

        const unblockTestCases = [
            { title: 'target user not found', targetID: 10000, code: 404, message: 'Other user not found.' },
            { title: 'success', targetID: 2, code: 200, message: 'User unblocked.' },
        ];

        test.each(blockTestCases)('test block: $title', async ({ targetID, code, message }) => {
            const response = await request
                .post(`/users/${targetID}/block`)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(code);
            if (message) {
                expect(response.body.message).toBe(message);
            }
        });

        test.each(unblockTestCases)('test unblock: $title', async ({ targetID, code, message }) => {
            const response = await request
                .delete(`/users/${targetID}/unblock`)
                .set('Authorization', `Bearer ${userTokens[0]}`);
            expect(response.status).toBe(code);
            if (message) {
                expect(response.body.message).toBe(message);
            }
        });
        test('test block: guest user', async () => {
            const response = await request
                .post(`/users/${1}/block`)
                .send({
                    description: 'fail',
                })
                .set('Authorization', `Bearer ${guestToken}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Guest cannot make this request!');
        });
        test('test unblock: guest user', async () => {
            const response = await request
                .delete(`/users/${1}/unblock`)
                .send({
                    description: 'fail',
                })
                .set('Authorization', `Bearer ${guestToken}`);
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Guest cannot make this request!');
        });
    });
});
