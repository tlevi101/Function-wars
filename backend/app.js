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
const { sendChatMessage, setSeen } = require('./socket_handlers/chat-handler');
const { joinWaitList, leaveWaitList } = require('./socket_handlers/wait-list-handler');
const {
    gameRouter,
    leaveGame,
    userIsOnlineInGame,
    getGame,
    reconnectToGame,
    deleteGame,
    updateGameSocket,
} = require('./socket_handlers/game-handler');
const MyLogger = require('./logs/logger');
const {
    sendGroupMessage,
    leaveGroupChat,
    deleteGameGroupChat,
    reconnectToGroupChat,
    deleteGameGroupChatByUserID,
    groupChatRouter,
} = require('./socket_handlers/group-chat-handler');
const chalk = require('chalk');
const {CustomGameController} = require("./types/controllers/CustomGameController");
const {RuntimeMaps} = require("./types/RuntimeMaps");
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
        console.debug(chalk.blue(`user (id:${socket.decoded.id}, name:${socket.decoded.name}) connected`));
        RuntimeMaps.onlineUsers.set(socket.decoded.id, { user: socket.decoded, socketID: socket.id });
        await updateGameSocket(socket);
        await reconnectToGroupChat(socket);
        //TODO update only socket in group chat, dont reconnect here

        socket.on('create custom game', async ({ fieldID, isPrivate }) => {
            await CustomGameController.createCustomGame(socket, fieldID, isPrivate);
        })

        socket.on('join custom game', async ({ roomUUID }) => {
            await CustomGameController.joinWaitingRoom(socket, roomUUID);
        });

        socket.on('leave custom game', async ({ roomUUID }) => {
            await CustomGameController.leaveWaitingRoom(socket, roomUUID);
        });

        socket.on('send chat message', async ({ message, friend_id }) => {
            sendChatMessage(socket, message, friend_id);
        });

        socket.on('set seen', async ({ friend_id }) => {
            setSeen(socket, friend_id);
        });

        socket.on('join wait list', async () => {
            joinWaitList(socket);
        });

        socket.on('leave wait list', async () => {
            leaveWaitList(socket);
        });

        socket.on('leave game', async () => {
            leaveGame(socket);
            setTimeout(async () => {
                try {
                    if (RuntimeMaps.onlineUsers.has(socket.decoded.id) && (await userIsOnlineInGame(socket, RuntimeMaps.games))) {
                        console.log(chalk.blue(`User (${socket.decoded.name}) reconnected to game in time`));
                        return;
                    }
                } catch (e) {
                    console.error(chalk.red(e.message));
                }
                deleteGame(socket);
                deleteGameGroupChatByUserID(socket.decoded.id);
            }, TIME_TO_RECONNECT);
        });

        socket.on('send group chat message', async ({ message }) => {
            sendGroupMessage(socket, message);
        });

        socket.on('disconnect', async () => {
            console.log(`User (${socket.decoded.name}) disconnected`);
            leaveWaitList(socket);
            RuntimeMaps.onlineUsers.delete(socket.decoded.id);
            setTimeout(async () => {
                if (RuntimeMaps.onlineUsers.has(socket.decoded.id)) {
                    console.log(chalk.blue.underline(`User (${socket.decoded.name}) reconnected`));
                    return;
                }
                await deleteGame(socket, RuntimeMaps.games);
                for (const [uuid, groupChat] of RuntimeMaps.groupChats) {
                    if (groupChat.sockets.includes(socket)) {
                        leaveGroupChat(socket);
                    }
                }
            }, TIME_TO_RECONNECT);
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
app.use('/admin/', require('./routes/admin'));
app.use('/', require('./routes/user'));

//socket router
app.use('/games', gameRouter);
app.use('/group-chat', groupChatRouter);

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
