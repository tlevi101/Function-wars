const supertest = require('supertest');
const { app, io } = require('../app');
const request = supertest(app);
const { User, Friendship, Chat } = require('../models');
const { Op } = require('sequelize');
const jsonwebtoken = require('jsonwebtoken');
const Client = require('socket.io-client');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const chalk = require('chalk');
const {CustomGameController} = require("../types/controllers/CustomGameController");

const signToken = json => {
    return jsonwebtoken.sign(json, process.env.JWT_SECRET || 'secret', {
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
    });
};




describe('test group chat through API', () => {
    let users;
    const userTokens = [];
    const serverSockets = [];
    const userClients = [];
    let field;
    let server;
    let chatUUID;

    const messages = [
        { description: '0', from: 0, msg: 'user1 message1'},
        { description: '1', from: 0, msg: 'user1 message2'},
        { description: '2', from: 1, msg: 'user2 message1'},
        { description: '3', from: 1, msg: 'user2 message1'},
        { description: '4', from: 0, msg: 'user1 message3'},
        { description: '5', from: 0, msg: 'user1 message4'},
    ];

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

    describe('sending messages', () => {
        beforeAll((done) => {
            userClients[1].on('waiting room joined', () =>{
                userClients[0].off('waiting room joined');
                done();
            })
            userClients[0].on('waiting room created', ({roomUUID, groupChatUUID})=>{
                chatUUID = groupChatUUID;
                // userClients[0].emit('route change', {url:`/wait-rooms/${roomUUID}`});
                userClients[0].off('waiting room created');
                userClients[1].emit('join custom game', {roomUUID})
            })
            userClients[0].emit('create custom game', {fieldID:field.id, isPrivate:false, friendIDs:[]});
        })
        afterAll(async () => {
            chatUUID = '';
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        })
        test.each(messages)('sending a message $description', ({from, msg}, done)=>{
            let toIndex = from === 1? 0:1;
                userClients[toIndex].on('receive group message', (message)=>{
                    expect(message.from.id).toBe(users[from].id);
                    expect(message.message).toBe(msg);
                    userClients[toIndex].off('receive group message');
                    done();
                })
            userClients[from].emit('send group chat message', {message: msg} )
        })
    })

    describe('sending messages while muted', ()=>{
        beforeAll((done) => {
            userClients[0].on('waiting room created', ({roomUUID, groupChatUUID})=>{
                chatUUID = groupChatUUID;
                // userClients[0].emit('route change', {url:`/wait-rooms/${roomUUID}`});
                userClients[0].off('waiting room created');
                userClients[1].emit('join custom game', {roomUUID})
                done()
            })
            userClients[0].emit('create custom game', {fieldID:field.id, isPrivate:false, friendIDs:[]});
        })
        afterAll(async () => {
            chatUUID = '';
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        })
        const muteTestCases=[
            { userIndex:0, targetUserIndex:1, roomUUID:'should-be-404',description: 'room not found', code:404},
            { userIndex:3, targetUserIndex:1, roomUUID:'valid',description: 'user is not in the chat', code:403},
            { userIndex:0, targetUserIndex:3, roomUUID:'valid',description: 'target user not found', code:404},
            { userIndex:0, targetUserIndex:1, roomUUID:'valid',description: 'success', code:200},
        ];

        test.each(muteTestCases)('mute other user: $description', async ({userIndex, targetUserIndex, roomUUID, code})=>{
            roomUUID = roomUUID === 'valid' ? chatUUID : roomUUID;
            const response = await request
                .post(`/group-chats/${roomUUID}/mute/${users[targetUserIndex].id}`)
                .set('Authorization',`Bearer ${userTokens[userIndex]}`);
            expect(response.status).toBe(code);
        })
        test.each(messages)('sending a message $description', async ({from, msg})=>{
            let toIndex = from === 1? 0:1;
            const messageReceived = new Promise(resolve =>{
                if(from===1){
                    setTimeout(() =>{
                        userClients[toIndex].off('receive group message');
                        resolve();
                    }, 1000)
                }
                userClients[toIndex].on('receive group message', (message)=>{
                    expect(message.from.id).toBe(users[from].id);
                    expect(message.message).toBe(msg);
                    userClients[toIndex].off('receive group message');
                    resolve();
                })
            })
            userClients[from].emit('send group chat message', {message: msg} )
            await messageReceived;
        })
        test('test get messages, chat not found', async () =>{
            const response = await request
                .get(`/group-chats/should-be-404/messages`)
                .set('Authorization',`Bearer ${userTokens[0]}`);
            expect(response.status).toBe(404);
        })

        test('test get messages, but user is not in the chat', async () =>{
            const response = await request
                .get(`/group-chats/${chatUUID}/messages`)
                .set('Authorization',`Bearer ${userTokens[3]}`);
            expect(response.status).toBe(403);
        })

        test('test get messages from muted', async () =>{
            const response = await request
                .get(`/group-chats/${chatUUID}/messages`)
                .set('Authorization',`Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
            expect(response.body.messages.length).toBe(messages.filter(msg => msg.from === 0).length);
        })

        test('test get messages as the muted', async () =>{
            const response = await request
                .get(`/group-chats/${chatUUID}/messages`)
                .set('Authorization',`Bearer ${userTokens[1]}`);
            expect(response.status).toBe(200);
            expect(response.body.messages.length).toBe(messages.length);
        })

        test.each(muteTestCases)('unmute other user: $description', async ({userIndex, targetUserIndex, roomUUID, code})=>{
            roomUUID = roomUUID === 'valid' ? chatUUID : roomUUID;
            const response = await request
                .post(`/group-chats/${roomUUID}/unmute/${users[targetUserIndex].id}`)
                .set('Authorization',`Bearer ${userTokens[userIndex]}`);
            expect(response.status).toBe(code);
        })
    })

    describe('sending messages while chat restricted', ()=>{
        let chatRestrictedUserClient;
        beforeAll((done) => {
            chatRestrictedUserClient = userClients.find(client => client.user.chat_restriction);
            userClients[0].on('waiting room created', ({roomUUID, groupChatUUID})=>{
                chatUUID = groupChatUUID;
                // userClients[0].emit('route change', {url:`/wait-rooms/${roomUUID}`});
                userClients[0].off('waiting room created');
                chatRestrictedUserClient.emit('join custom game', {roomUUID})
                done()
            })
            userClients[0].emit('create custom game', {fieldID:field.id, isPrivate:false, friendIDs:[]});
        })
        afterAll(async () => {
            chatUUID = '';
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        })

        test('should not get the message', async () => {
            setTimeout(()=>{
                expect(Array.from(RuntimeMaps.groupChats.values())[0].messages.length).toBe(0);
            }, 1000)
            chatRestrictedUserClient.emit('send group chat message', {message: 'msg'} )
        })
    })

    describe('user statuses',()=>{
        beforeAll((done) => {
            userClients[0].on('waiting room created', ({roomUUID, groupChatUUID})=>{
                chatUUID = groupChatUUID;
                // userClients[0].emit('route change', {url:`/wait-rooms/${roomUUID}`});
                userClients[0].off('waiting room created');
                userClients[1].emit('join custom game', {roomUUID})
                done()
            })
            userClients[0].emit('create custom game', {fieldID:field.id, isPrivate:false, friendIDs:[]});
        })
        afterAll(async () => {
            chatUUID = '';
            await CustomGameController.deleteWaitingRoom(serverSockets[0]);
        })

        test('get user statuses',async ()=>{
            const response = await request.get(`/group-chats/${chatUUID}/users-status`)
                .set('Authorization',`Bearer ${userTokens[0]}`);
            expect(response.status).toBe(200);
        })
    })
});
