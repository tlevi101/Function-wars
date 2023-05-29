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
describe('test custom game through API  and socket', () => {
    let users;
    const userTokens = [];
    const serverSockets = [];
    const userClients = [];
    let field;
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
        let fields = await users[0].getFields();
        field = fields[0];
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

    test('test start game', done => {
        let counter = 0;
        const checkDone = () => {
            counter++;
            if (counter === 2) {
                done();
            }
        };
        for (let i = 0; i < 2; i++) {
            userClients[i].on('joined game', async () => {
                checkDone();
            });
        }
        userClients[1].on('waiting room joined', async () => {
            userClients[0].emit('start custom game');
        });

        userClients[0].on('waiting room created', async ({ roomUUID }) => {
            userClients[1].emit('join custom game', { roomUUID });
        });

        userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: false, friendIDs: [] });
    });

    describe('create custom game', () => {
        let friends;
        let friendSockets;
        beforeAll(async () => {
            friends = await users[0].getFriends();
            friendSockets = serverSockets
                .map((socket, index) => {
                    if (friends.some(friend => friend.id === socket.decoded.id)) {
                        return userClients[index];
                    }
                })
                .filter(socket => socket !== undefined);
        });
        afterEach(async () => {
            userClients[0].off('waiting room created');
            userClients[0].off('error');
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        });
        test('field id is missing', done => {
            userClients[0].on('error', ({ message, code }) => {
                expect(message).toBe('Field is required');
                expect(code).toBe(400);
                done();
            });
            userClients[0].emit('create custom game', { fieldID: '', isPrivate: false });
        });

        test('create was successful', done => {
            userClients[0].on('waiting room created', ({ roomUUID, groupChatUUID }) => {
                let waitRoom = Array.from(RuntimeMaps.waitingRooms.values())[0];
                expect(roomUUID).toBe(waitRoom.UUID);
                expect(groupChatUUID).toBe(waitRoom.ChatUUID);
                expect(waitRoom.userIsInRoom(users[0].id));
                done();
            });
            userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: false });
        });

        test('other users can see the created game', done => {
            userClients[0].on('waiting room created', async ({ roomUUID, groupChatUUID }) => {
                let response = await request.get('/custom-games').set('Authorization', `Bearer ${userTokens[1]}`);
                expect(response.body?.customGames[0]?.roomUUID).toBe(roomUUID);

                response = await request.get('/custom-games').set('Authorization', `Bearer ${userTokens[2]}`);
                expect(response.body?.customGames[0]?.roomUUID).toBe(roomUUID);

                done();
            });
            userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: false });
        });

        test('other users can t see a private custom game', done => {
            userClients[0].on('waiting room created', async ({ roomUUID, groupChatUUID }) => {
                let response = await request.get('/custom-games').set('Authorization', `Bearer ${userTokens[1]}`);
                expect(response.body?.customGames.length).toBe(0);

                response = await request.get('/custom-games').set('Authorization', `Bearer ${userTokens[2]}`);
                expect(response.body?.customGames.length).toBe(0);

                done();
            });
            userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: true });
        });

        test('friends gets the invite', done => {
            let counter = 0;
            const checkDone = () => {
                counter++;
                if (counter === friends.length) {
                    friendSockets.forEach(socket => socket.off('receive invite'));
                    done();
                }
            };
            for (const socket of friendSockets) {
                socket.on('receive invite', ({ inviter, customGameUUID }) => {
                    const waitRoom = Array.from(RuntimeMaps.waitingRooms.values())[0];
                    expect(inviter.id).toBe(users[0].id);
                    expect(customGameUUID).toBe(waitRoom.UUID);
                    checkDone();
                });
            }

            userClients[0].emit('create custom game', {
                fieldID: field.id,
                isPrivate: true,
                friendIDs: friends.map(friend => friend.id),
            });
        });
    });

    describe('test join to public custom game', () => {
        let UUID;
        beforeEach(done => {
            userClients[0].on('waiting room created', ({ roomUUID, groupChatUUID }) => {
                UUID = roomUUID;
                userClients[0].off('waiting room created');
                done();
            });
            userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: false });
        });
        afterEach(async () => {
            UUID = '';
            userClients[1].off('error');
            userClients[2].off('error');
            userClients[1].off('waiting room joined');
            userClients[2].off('waiting room joined');
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        });

        test('join to custom with wrongUUID', done => {
            userClients[1].on('error', ({ message, code }) => {
                expect(message).toBe('Custom game not found.');
                expect(code).toBe(404);
                done();
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test('join to custom with the correct UUID', done => {
            userClients[1].on('waiting room joined', async () => {
                const response = await request
                    .get(`/wait-rooms/${UUID}`)
                    .set('Authorization', `Bearer ${userTokens[1]}`);
                expect(response.status).toBe(200);
                expect(response.body.waitRoom).toEqual(
                    expect.objectContaining({
                        roomUUID: UUID,
                        chatUUID: expect.any(String),
                        owner: expect.objectContaining({ id: users[0].id }),
                        players: expect.any(Array),
                        fieldID: field.id,
                        userCount: 2,
                        capacity: 2,
                    })
                );
                done();
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test('join to full custom game', done => {
            userClients[2].on('error', async ({ message, code }) => {
                expect(message).toBe('Custom game is full');
                expect(code).toBe(403);
                done();
            });
            userClients[1].on('waiting room joined', async () => {
                userClients[2].emit('join custom game', { roomUUID: UUID });
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test('joined custom game notification', done => {
            userClients[0].on('user joined waiting room', async () => {
                done();
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });
    });
    describe('test join to private custom game', () => {
        let UUID;
        let friends;
        let friendSockets;
        let nonFriendSockets;
        beforeAll(async () => {
            friends = await users[0].getFriends();
            friendSockets = serverSockets
                .map((socket, index) => {
                    if (friends.some(friend => friend.id === socket.decoded.id)) {
                        return userClients[index];
                    }
                })
                .filter(socket => socket !== undefined);

            nonFriendSockets = serverSockets
                .map((socket, index) => {
                    if (socket.decoded.id !== users[0].id && !friends.some(friend => friend.id === socket.decoded.id)) {
                        return userClients[index];
                    }
                })
                .filter(socket => socket !== undefined);
        });
        beforeEach(done => {
            userClients[0].on('waiting room created', ({ roomUUID, groupChatUUID }) => {
                UUID = roomUUID;
                userClients[0].off('waiting room created');
                done();
            });
            userClients[0].emit('create custom game', {
                fieldID: field.id,
                isPrivate: true,
                friendIDs: friends.map(friend => friend.id),
            });
        });
        afterEach(async () => {
            UUID = '';
            userClients.forEach(socket => {
                socket.off('error');
                socket.off('waiting room joined');
            });
            friendSockets.forEach(socket => {
                socket.off('waiting room joined');
            });
            nonFriendSockets.forEach(socket => {
                socket.off('error');
            });
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        });

        test('join to custom with invitation', done => {
            friendSockets[0].on('waiting room joined', () => {
                const waitRoom = Array.from(RuntimeMaps.waitingRooms.values())[0];
                expect(waitRoom.userIsInRoom(friends[0].id));
                done();
            });
            friendSockets[0].emit('join custom game', { roomUUID: UUID });
        });

        test('join to custom game without invitation', done => {
            nonFriendSockets[0].on('error', async ({ message, code }) => {
                expect(message).toBe('You are not invited!');
                expect(code).toBe(404);
                done();
            });
            nonFriendSockets[0].emit('join custom game', { roomUUID: UUID });
        });
    });
    describe('test disconnections', () => {
        let UUID = '';
        let customGame;
        beforeEach(done => {
            userClients[0].on('waiting room created', ({ roomUUID, groupChatUUID }) => {
                UUID = roomUUID;
                customGame = Array.from(RuntimeMaps.waitingRooms.values())[0];
                userClients[0].emit('route change', { url: `/wait-rooms/${UUID}` });
                userClients[0].off('waiting room created');
                done();
            });
            userClients[0].emit('create custom game', { fieldID: field.id, isPrivate: false, friendIDs: [] });
        });

        afterEach(() => {
            UUID = '';
            userClients.forEach(client => {
                client.off('wait room owner left');
                client.off('user left wait room');
                client.off('waiting room joined');
            });
        });

        test('disconnected from server', done => {
            userClients[0].on('user left wait room', () => {
                userClients[1] = new Client('http://localhost:3000', {
                    query: {
                        token: userTokens[1],
                    },
                    extraHeaders: {
                        Authorization: `Bearer ${userTokens[1]}`,
                    },
                });
                done();
            });
            userClients[1].on('waiting room joined', () => {
                userClients[1].disconnect();
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test('left via navigation', done => {
            userClients[0].on('user left wait room', () => {
                done();
            });
            userClients[1].on('waiting room joined', () => {
                userClients[1].emit('route change', { url: '/' });
            });
            userClients[1].emit('route change', { url: `/wait-rooms/${UUID}` });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test('owner left', done => {
            userClients[1].on('wait room owner left', () => {
                done();
            });
            userClients[1].on('waiting room joined', async () => {
                userClients[0].emit('route change', { url: '/' });
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });

        test(
            'owner disconnected from server',
            done => {
                userClients[1].on('wait room owner left', () => {
                    userClients[0] = new Client('http://localhost:3000', {
                        query: {
                            token: userTokens[0],
                        },
                        extraHeaders: {
                            Authorization: `Bearer ${userTokens[0]}`,
                        },
                    });
                    done();
                });
                userClients[1].on('waiting room joined', async () => {
                    userClients[0].disconnect();
                });
                userClients[1].emit('join custom game', { roomUUID: UUID });
            },
            15 * 1000
        );

        test(
            'owner disconnected and reconnected',
            done => {
                userClients[1].on('waiting room joined', async () => {
                    userClients[0].disconnect();
                    setTimeout(async () => {
                        userClients[0] = new Client('http://localhost:3000', {
                            query: {
                                token: userTokens[0],
                            },
                            extraHeaders: {
                                Authorization: `Bearer ${userTokens[0]}`,
                            },
                        });
                        userClients[0].emit('route change', { url: `/wait-rooms/${UUID}` });
                    }, 2 * 1000);
                    setTimeout(() => {
                        const waitRoom = Array.from(RuntimeMaps.waitingRooms.values())[0];
                        expect(waitRoom.ownerIsOnline).toBeTruthy();
                        done();
                    }, 4 * 1000);
                });
                userClients[1].emit('join custom game', { roomUUID: UUID });
            },
            15 * 1000
        );

        test('kick user', done => {
            userClients[1].on('waiting room joined', async () => {
                const response = await request
                    .post(`/wait-rooms/${UUID}/${users[1].id}/kick`)
                    .set('Authorization', `Bearer ${userTokens[0]}`);
                expect(response.status).toBe(200);
                const waitRoom = Array.from(RuntimeMaps.waitingRooms.values())[0];
                expect(waitRoom.userIsInRoom(users[1].id)).toBeFalsy();
                done();
            });
            userClients[1].emit('join custom game', { roomUUID: UUID });
        });
    });
});
