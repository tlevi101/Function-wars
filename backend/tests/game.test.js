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

const expectedValue = (coordX, origo, fn) => {
    const ratio = 35;
    let currentX = (coordX - origo.x) / ratio;
    let y = Math.round(origo.y - fn(currentX) * ratio);
    if (y === -0) {
        y = 0;
    }
    if (y === Infinity) {
        y = 0;
    }
    if (y === -Infinity) {
        y = 700;
    }
    // let calculatedY = Number.parseFloat((origo.y - point.y)/ratio).toFixed(2);
    return y;
};
describe('test game through API', () => {
    let users;
    const userTokens = [];
    const serverSockets = [];
    const userClients = [];
    let server;
    let game;
    let currentPlayer;
    let fn;

    const findToken = async (targetID, equals = true) => {
        for await (let token of userTokens) {
            const decoded = jsonwebtoken.decode(token);
            if (decoded.id === targetID && equals) {
                return token;
            } else if (decoded.id !== targetID && !equals) {
                return token;
            }
        }
    };

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
            const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET || 'secret', {
                algorithm: process.env.JWT_ALGORITHM || 'HS256',
            });
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

        const promise = new Promise(resolve => {
            let counter = 0;
            const checkDone = () => {
                counter++;
                if (counter === 4) {
                    game = Array.from(RuntimeMaps.games.values())[0];
                    resolve();
                }
            };
            serverSockets[0].on('join wait list', async () => {
                await WaitListController.joinWaitList(serverSockets[0]);
                checkDone();
            });

            serverSockets[1].on('join wait list', async () => {
                await WaitListController.joinWaitList(serverSockets[1]);
                checkDone();
            });

            userClients[0].on('joined game', async () => {
                checkDone();
            });
            userClients[1].on('joined game', async () => {
                checkDone();
            });
        });
        userClients[0].emit('join wait list');
        userClients[1].emit('join wait list');
        await promise;
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
    }, 20 * 1000);

    beforeEach(async () => {
        game = Array.from(RuntimeMaps.games.values())[0];
        if (game) {
            currentPlayer = game.CurrentPlayer;
        }
        fn = null;
    });

    afterEach(async () => {
        game = null;
        currentPlayer = null;
        fn = null;
    });

    describe('test funcCalculator errors through API', () => {
        test('tangent function included', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: 'tan(X) + sin(X)/4',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Tan function is not allowed!',
            });
        });

        test('division by x', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: 'x^2/(3x)',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Division by x is not allowed!',
            });
        });

        test('Multiply with negative number without parentheses', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: '2x*-3',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'You cannot multiply with negative number without parentheses!',
            });
        });

        test('multiply with without multiplication opertator', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: '(x-3)(x+2)',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'You cannot multiply without multiply operator! Except ax (a*x)',
            });
        });

        test('empty function', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: '',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'You must submit a function.',
            });
        });

        test('function is not intersects with the base', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: '|X-5|+5',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Function must intersects with your base!',
            });
        });

        test('other user tries to submit', async () => {
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: '|X|',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID, false)}`);
            expect(response.status).toBe(403);
            expect(response.body).toEqual({
                message: 'It is not your turn.',
            });
        });

        test('game not found', async () => {
            const response = await request
                .post(`/games/should-be-error/function`)
                .send({
                    fn: '|X|',
                })
                .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                message: 'Game not found.',
            });
        });
    });

    test('current player changes successfully', async () => {
        const receiveFnPromise = new Promise(resolve => {
            userClients[0].on('receive function', async ({ points, damages, length }) => {
                resolve();
            });
        });
        const response = await request
            .post(`/games/${game.UUID}/function`)
            .send({
                fn: '|X+1|',
            })
            .set('Authorization', `Bearer ${await findToken(game.CurrentPlayer.ID)}`);
        expect(response.status).toBe(200);
        await receiveFnPromise;
        game = Array.from(RuntimeMaps.games.values())[0];
        expect(game.CurrentPlayer.ID).not.toBe(currentPlayer.ID);
    });

    //**********************//
    //test points on success//
    //**********************//
    describe('test points on success', () => {
        const testCases = [
            { fnString: 'sin(X)+2X/3', fnCallback: x => Math.sin(x) + (2 * x) / 3 },
            { fnString: '|X|', fnCallback: x => Math.abs(x) },
            { fnString: '-|X|', fnCallback: x => -Math.abs(x) },
            { fnString: 'log(X)', fnCallback: x => Math.log(x) },
            { fnString: 'X^2', fnCallback: x => x ** 2 },
            { fnString: '3^X', fnCallback: x => 3 ** x },
            { fnString: '√X', fnCallback: x => Math.sqrt(x) },
            { fnString: '√(-X)', fnCallback: x => Math.sqrt(-x) },
            { fnString: '-√(-X)', fnCallback: x => -Math.sqrt(-x) },
            { fnString: '-√X', fnCallback: x => -Math.sqrt(x) },
            { fnString: 'sin(X)*cos(X)+1/2^X', fnCallback: x => Math.sin(x) * Math.cos(x) + 1 / 2 ** x },
            { fnString: 'sin(2X)+|X|-2X/3', fnCallback: x => Math.sin(2 * x) + Math.abs(x) - (2 * x) / 3 },
            { fnString: '|X-3|-3', fnCallback: x => Math.abs(x - 3) - 3 },
            { fnString: 'e^(X)', fnCallback: x => Math.exp(x) },
            { fnString: 'e^X', fnCallback: x => Math.exp(x) },
            { fnString: 'cos(X)', fnCallback: x => Math.cos(x) },
            { fnString: 'cos(X^2)', fnCallback: x => Math.cos(x ** 2) },
            { fnString: 'cos(X^2)-X', fnCallback: x => Math.cos(x ** 2) - x },
            { fnString: 'cos(X^2)-1', fnCallback: x => Math.cos(x ** 2) - 1 },
            { fnString: 'sin(log(X))', fnCallback: x => Math.sin(Math.log(x)) },
            { fnString: 'sin(log(X^2))', fnCallback: x => Math.sin(Math.log(x ** 2)) },
            { fnString: '|sin(X-3)|', fnCallback: x => Math.abs(Math.sin(x - 3)) },
            { fnString: 'sin(√X)', fnCallback: x => Math.abs(Math.sin(Math.sqrt(x))) },
            { fnString: 'sin(√(-X))', fnCallback: x => Math.abs(Math.sin(Math.sqrt(-x))) },
            { fnString: 'e^(2X)', fnCallback: x => Math.exp(2 * x) },
            { fnString: 'X(2-X)', fnCallback: x => x * (2 - x) },
        ];
        test.each(testCases)('valid function, $fnString', async ({ fnString, fnCallback }) => {
            fn = fnCallback;
            const receiveFnPromise = new Promise(resolve => {
                let counter = 0;
                const checkDone = () => {
                    counter++;
                    if (counter === 2) {
                        resolve();
                    }
                };
                for (let i = 0; i < 2; i++) {
                    userClients[i].on('receive function', async ({ points, damages, length }) => {
                        for (let x = currentPlayer.Location.x; x < 1000; x += 35) {
                            const point = points.rightSide.find(p => p.x === x);
                            if (point) {
                                expect(point.y).toBe(expectedValue(x, currentPlayer.Location, fn));
                            }
                        }
                        for (let x = currentPlayer.Location.x; x > 0; x -= 35) {
                            const point = points.rightSide.find(p => p.x === x);
                            if (point) {
                                expect(point.y).toBe(expectedValue(x, currentPlayer.Location, fn));
                            }
                        }
                        checkDone();
                    });
                }
            });
            const response = await request
                .post(`/games/${game.UUID}/function`)
                .send({
                    fn: fnString,
                })
                .set('Authorization', `Bearer ${await findToken(currentPlayer.ID)}`);
            expect(response.status).toBe(200);
            await receiveFnPromise;
        });
    });

    //*********//
    //Game over//
    //*********//

    test('game over', async () => {
        const receiveGameOverPromise = new Promise(resolve => {
            userClients[0].on('game over', async ({ points, message }) => {
                expect(message).toEqual(expect.stringContaining(currentPlayer.Name));
                resolve();
            });
        });

        const response = await request
            .post(`/games/${game.UUID}/function`)
            .send({
                fn: '-2X/3',
            })
            .set('Authorization', `Bearer ${await findToken(currentPlayer.ID)}`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Game over.' });
        await receiveGameOverPromise;
    });

    describe('test user left from game', () => {
        beforeEach(done => {
            let counter = 0;
            const checkDone = () => {
                counter++;
                if (counter === 2) {
                    game = Array.from(RuntimeMaps.games.values())[0];
                    done();
                }
            };
            for (let i = 0; i < 2; i++) {
                userClients[i].on('joined game', async ({ room }) => {
                    userClients[i].emit('route change', { url: '/games/' + room });
                    checkDone();
                });
                userClients[i].emit('join wait list');
            }
        });

        test('user navigated', done => {
            userClients[1].on('game ended', ({ message }) => {
                console.debug(chalk.red('game ended test'));
                done();
            });
            const timeout = setTimeout(() => {
                userClients[0].emit('route change', { url: '/' });
                timeout.unref();
            }, 500);
        });

        test(
            'user disconnected',
            done => {
                userClients[1].on('game ended', async ({ message }) => {
                    expect(message).toEqual(expect.stringContaining(serverSockets[0].decoded.name));
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
                userClients[0].disconnect();
            },
            15 * 1000
        );

        test(
            'user disconnected, and reconnected in time',
            done => {
                userClients[0].disconnect();
                const timeout = setTimeout(() => {
                    userClients[0] = new Client('http://localhost:3000', {
                        query: {
                            token: userTokens[0],
                        },
                        extraHeaders: {
                            Authorization: `Bearer ${userTokens[0]}`,
                        },
                    });
                    userClients[0].emit('route change', { url: `/games/${game.UUID}` });
                    timeout.unref();
                }, 2 * 1000);
                const timeout2 = setTimeout(() => {
                    expect(game.playerIsOnline(serverSockets[0].decoded.id)).toBeTruthy();
                    done();
                    timeout2.unref();
                }, 4 * 1000);
            },
            10 * 1000
        );
    });
});
