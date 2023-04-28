require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const date = require('date-and-time');
const { Sequelize } = require('sequelize');
require('express-async-errors');
const fs = require('fs').promises;
const { User } = require('./models');
const app = express();
const cors = require('cors');
const http = require('http').createServer();
const jwt = require('jsonwebtoken');
const MyLogger = require('./logs/logger');
const chalk = require('chalk');
const { CustomGameController } = require('./types/controllers/CustomGameController');
const { RuntimeMaps } = require('./types/RuntimeMaps');
const { GroupChatController } = require('./types/controllers/GroupChatController');
const { SocketConnectionService } = require('./types/services/SocketConnectionService');
const { FriendChatController } = require('./types/controllers/FriendChatController');
const { WaitListController } = require('./types/controllers/WaitListController');
//Socket

const io = require('socket.io')(http, {
    cors: {
        origin: ['*', 'https://admin.socket.io', 'http://localhost:4200'],
        credentials: true,
    },
});

const TIME_TO_RECONNECT = 10000;

io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, 'secret', function (err, decoded) {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded;
            next();
        });
    } else {
        next(new Error('Authentication error'));
    }
})
    .on('connection', async socket => {
        SocketConnectionService.userConnected(socket);

        socket.on('route change', async ({ url }) => {
            SocketConnectionService.userNavigated(socket, url);
        });
        socket.on('create custom game', async ({ fieldID, isPrivate, friendIDs }) => {
            await CustomGameController.createCustomGame(socket, fieldID, isPrivate, friendIDs);
        });

        socket.on('join custom game', async ({ roomUUID }) => {
            console.log(`User (${socket.decoded.name}) is joining room (${roomUUID})`);
            await CustomGameController.joinWaitingRoom(socket, roomUUID);
            await GroupChatController.joinGroupChat(socket, 'chat-' + roomUUID);
        });

        socket.on('start custom game', async () => {
            CustomGameController.startGame(socket);
        });
        socket.on('leave custom game', async ({ roomUUID }) => {
            await CustomGameController.leaveWaitingRoom(socket, roomUUID);
        });

        socket.on('join group chat', async ({ roomUUID }) => {
            await GroupChatController.joinGroupChat(socket, roomUUID);
        });

        socket.on('reject invite', async ({ invite }) => {
            RuntimeMaps.invites.delete(invite);
        });

        socket.on('send chat message', async ({ message, friend_id }) => {
            FriendChatController.sendMessage(socket, message, friend_id);
        });

        socket.on('set seen', async ({ friend_id }) => {
            FriendChatController.setSeen(socket, friend_id);
        });

        socket.on('join wait list', async () => {
            WaitListController.joinWaitList(socket);
        });

        socket.on('leave wait list', async () => {
            WaitListController.leaveWaitList(socket);
        });

        socket.on('send group chat message', async ({ message }) => {
            GroupChatController.sendMessage(socket, message);
        });

        socket.on('disconnect', async () => {
            SocketConnectionService.userDisconnected(socket);
        });
    })
    .on('disconnect', socket => {});

//use socket in routes
app.use(function (req, res, next) {
    res.io = io;
    next();
});
//use socket maps in routes
app.use(function (req, res, next) {
    req.onlineUsers = RuntimeMaps.onlineUsers;
    req.waitList = RuntimeMaps.waitList;
    req.games = RuntimeMaps.games;
    req.groupChats = RuntimeMaps.groupChats;
    req.waitingRooms = RuntimeMaps.waitingRooms;
    next();
});

// parse requests of content-type - application/json
app.use(express.json());
app.use(cors());

//routers
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/fields'));
app.use('/', require('./routes/customGame'));
app.use('/group-chats', require('./routes/groupChats'));
app.use('/admin/', require('./routes/admin'));
app.use('/', require('./routes/user'));
app.use('/games', require('./routes/games'));

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// catch any sequelize validation errors
app.use(function (err, req, res, next) {
    if (err instanceof Sequelize.UniqueConstraintError) {
        res.status(400).json({ msg: err.errors[0].message });
    } else if (err instanceof Sequelize.ValidationError) {
        res.status(400).json({ msg: err.message });
    }
    // else if (err instanceof Sequelize.DatabaseError) {
    //   res.status(400).json({ error: err.message });
    // }
    next(err, req, res, next);
});

// error logger
app.use(async function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    const time = date.format(new Date(), 'HH:mm:ss');
    console.error(err.stack);
    const error = {
        [time.toString()]: {
            name: err.name,
            message: err.message,
            stack: err.stack.split('\n'),
            req: {
                body: req.body,
                params: req.params,
                headers: req.headers,
                url: req.url,
            },
        },
    };
    MyLogger('errors/', error);
    res.status(err.status || 500).json({ error: err.message });
});

module.exports = {
    app,
    io,
};
