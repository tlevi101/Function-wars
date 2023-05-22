const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const { Op } = require('sequelize');
const jsonwebtoken = require('jsonwebtoken');
const Client = require('socket.io-client');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const { WaitListController } = require('../types/controllers/WaitListController');

describe('stress tests', () => {
    let stressTestCount = 0;
    let stressTestUsers;
    const stressTestUserTokens = [];
    const stressTestUserClients = [];
    const serverSockets = [];

    beforeAll(async () => {
        io.listen(3000);
        io.on('connection', socket => {
            if (!socket) {
                console.error('socket is null');
            }
            console.info('new socket connection, sockets count:', serverSockets.length);
            stressTestCount++;
            serverSockets.push(socket);
        });
        const connectionPromises = [];

        stressTestUsers = await User.findAll({
            where: {
                role: 'user',
                email: { [Op.like]: 'stress%' },
            },
        });
        for (const user of stressTestUsers) {
            console.info('new client connection, clients count:', stressTestUserClients.length);
            const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET || 'secret', {
                algorithm: process.env.JWT_ALGORITHM || 'HS256',
            });
            stressTestUserTokens.push(token);
            const newClient = new Client('http://localhost:3000', {
                query: {
                    token: token,
                },
                extraHeaders: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const newConnectionPromise = new Promise(resolve => {
                newClient.on('connect', () => {
                    resolve();
                });
            });
            console.info('new client connection, clients count:', stressTestUserClients.length);
            connectionPromises.push(newConnectionPromise);
            stressTestUserClients.push(newClient);
        }

        await Promise.all(connectionPromises);
    }, 60 * 1000);

    afterAll(done => {
        io.close(() => {
            console.log('server closed');
            setTimeout(() => {
                done();
            }, 1000);
        });
        for (const client of stressTestUserClients) {
            client.close();
        }
    }, 10 * 1000);

    afterEach(() => {
        serverSockets.map(socket => {
            socket.removeAllListeners();
        });
        stressTestUserClients.map(client => {
            client.removeAllListeners();
        });
    });

    test(
        'stress',
        async () => {
            let joinedWaitListCount = 0;
            let joinedGameCount = 0;
            const clientSideListenPromises = [];
            await Promise.all(
                serverSockets.map((serverSocket, index) => {
                    console.info('new server socket connection, sockets count:', serverSockets.length);
                    serverSocket.on('test join wait list', async () => {
                        joinedWaitListCount++;
                        console.info('received join wait list: ', joinedWaitListCount);
                        console.info('user id: ', serverSocket.decoded.id);
                        await WaitListController.joinWaitList(serverSocket);
                    });
                })
            );
            stressTestUserClients.forEach((stressUserClient, index) => {
                console.info('new promise');
                const clientSidePromise = new Promise(resolve => {
                    stressUserClient.emit('test join wait list');
                    stressUserClient.on('joined game', async ({ room, players, field }) => {
                        joinedGameCount++;
                        console.info(`User id: ${stressTestUsers[index].id} joined game: ${room}`);
                        console.info('joined game: ', joinedGameCount);
                        expect(RuntimeMaps.games.has(room)).toBe(true);
                        expect(
                            RuntimeMaps.games.get(room).players.some(player => player.ID == stressTestUsers[index].id)
                        ).toBe(true);
                        expect(RuntimeMaps.groupChats.has('chat-' + room)).toBe(true);
                        expect(
                            RuntimeMaps.groupChats
                                .get('chat-' + room)
                                .Users.some(player => player.id == stressTestUsers[index].id)
                        ).toBe(true);
                        resolve();
                    });
                });
                clientSideListenPromises.push(clientSidePromise);
            });
            await Promise.all(clientSideListenPromises);
            expect(joinedWaitListCount).toBe(stressTestCount);
            expect(joinedGameCount).toBe(stressTestCount);
        },
        60 * 1000
    );
});
