const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const { Op } = require('sequelize');
const jsonwebtoken = require('jsonwebtoken');
const Client = require('socket.io-client');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const { WaitListController } = require('../types/controllers/WaitListController');
const chalk = require('chalk');
const { CustomGameController } = require('../types/controllers/CustomGameController');

const signToken = json => {
    return jsonwebtoken.sign(json, process.env.JWT_SECRET || 'secret', {
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
    });
};
describe('friend chat through socket', () => {
    let users;
    const userTokens = [];
    let friends;
    let friendClients;
    const serverSockets = [];
    const userClients = [];
    let server;
    beforeAll(async () => {
        server = io.listen(3000);
        io.on('connection', socket => {
            serverSockets.push(socket);
        });
        const connectionPromises = [];
        users = await User.findAll({
            where: {
                role: 'user',
            },
        });
        for await (const user of users) {
            const token = signToken(user.toJSONForJWT());
            userTokens.push(token);
            const newClient = new Client('http://localhost:3000', {
                query: {
                    token: token,
                },
                extraHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            });
            newClient.user = user;
            const connectionPromise = new Promise(resolve => {
                newClient.on('connect', () => {
                    console.log('connected');
                    resolve();
                });
            });
            connectionPromises.push(connectionPromise);
            userClients.push(newClient);
        }
        await Promise.all(connectionPromises);
        friends = await users[0].getFriends();
        friendClients = userClients.filter(client => {
            return friends.some(friend => friend.id === client.user.id);
        });
    }, 10 * 1000);
    afterAll(async () => {
        for await (let client of userClients) {
            client.close();
        }
        await new Promise(resolve => {
            io.close(() => {
                console.warn('server closed');
                resolve();
            });
        });
    }, 10 * 1000);
    test('friend not found', done => {
        userClients[0].on('error', ({ message, code }) => {
            expect(message).toBe('Friend not found.');
            expect(code).toBe(404);
            userClients[0].off('error');
            done();
        });
        userClients[0].emit('send chat message', { message: 'failed', friend_id: 10000 });
    });
    describe('send some message', () => {
        const messages = [{ msg: 'Hello' }, { msg: 'Hello1' }, { msg: 'Hello2' }, { msg: 'Hello3' }];
        test.each(messages)('test send message: $msg', ({ msg }, done) => {
            friendClients[0].on('receive message', ({ from, message, seen }) => {
                expect(message).toBe(msg);
                expect(from).toBe(users[0].id);
                expect(seen).toBeFalsy();
                friendClients[0].off('receive message');
                done();
            });
            console.debug(chalk.red('send message'));
            userClients[0].emit('send chat message', { message: msg, friend_id: friendClients[0].user.id });
        });
    });

    test('set seen error', done => {
        friendClients[0].on('error', ({ message, code }) => {
            expect(message).toBe('Friend not found.');
            expect(code).toBe(404);
            friendClients[0].off('error');
            done();
        });
        friendClients[0].emit('set seen', { friend_id: 10000 });
    });

    test('set seen success', done => {
        setTimeout(async () => {
            const chat = await friends[0].getChat(users[0].id);
            expect(chat.messages.filter(msg => msg.from === users[0].id).every(msg => msg.seen === true)).toBeTruthy();
            done();
        }, 1000);
        friendClients[0].emit('set seen', { friend_id: 1 });
    });
});
