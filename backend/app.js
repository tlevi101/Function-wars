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
const { gameRouter, leaveGame } = require('./socket_handlers/game-handler');
const MyLogger = require('./logs/logger');
//Socket

const io = require('socket.io')(http, {
    cors: {
        origin: ['*', 'https://admin.socket.io', 'http://localhost:4200'],
        credentials: true,
    },
});

let waitList = new Map();
let games = new Map();
let onlineUsers = new Map();
let groupChats = new Map();

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
        console.log('user connected');
        onlineUsers.set(socket.decoded.id, { user: await User.findByPk(socket.decoded.id), socketId: socket.id });

        socket.on('send chat message', async ({ message, friend_id }) => {
            sendChatMessage(socket, message, friend_id, onlineUsers);
        });

        socket.on('set seen', async ({ friend_id }) => {
            setSeen(socket, friend_id);
        });

        socket.on('join wait list', async () => {
            console.log('joined wait list');
            joinWaitList(socket, waitList, games, groupChats);
        });

        socket.on('leave wait list', async () => {
            console.log('left wait list');
            console.log('left wait list');
            leaveWaitList(socket, waitList, games);
        });

        socket.on('leave game', async () => {
            leaveGame(socket, games);
        });

        socket.on('disconnect', async () => {
            console.log('user disconnected');
            onlineUsers.delete(socket.decoded.id);
            leaveWaitList(socket, waitList, games);
            const gamesIter = games.values();
            for (let i = 0; i < games.size; i++) {
                const game = gamesIter.next().value;
                if (game.sockets.includes(socket)) {
                    socket.to(game.UUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
                    game.sockets.forEach(socket => socket.leave(game.UUID));
                    socket.leave(game.UUID);
                    games.delete(game.UUID);
                }
            }
        });
    })
    .on('disconnect', socket => {
        waitList.delete(socket.decoded.id);
        onlineUsers.delete(socket.decoded.id);
        console.log('user disconnected');
        console.log(socket.decoded);
    });

//use socket in routes
app.use(function (req, res, next) {
    res.io = io;
    next();
});
//use socket maps in routes
app.use(function (req, res, next) {
    req.onlineUsers = onlineUsers;
    req.waitList = waitList;
    req.games = games;
    next();
});

// parse requests of content-type - application/json
app.use(express.json());
app.use(cors());

//routers
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/fields'));
app.use('/admin/', require('./routes/admin'));
app.use('/', require('./routes/user'));

//socket router
app.use('/games', gameRouter);

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
