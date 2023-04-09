require('dotenv').config();
const app = require('./app');
const http = require('http').createServer();
const { User, Friendship, Chat } = require('./models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { instrument } = require('@socket.io/admin-ui');
const { joinChatRoom, sendChatMessage, setSeen } = require('./socket_handlers/chat-handler');
const { joinWaitList, leaveWaitList } = require('./socket_handlers/wait-list-handler');

const io = require('socket.io')(http, {
    cors: {
        origin: ['*', 'https://admin.socket.io', 'http://localhost:4200'],
        credentials: true,
    },
});
let waitList = new Map();
let games = new Map();
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
    .on('connection', socket => {
        
		socket.on('join chat rooms', async () => {
			joinChatRoom(socket);
        });
        
		socket.on('send chat message', async ({ message, room }) => {
           sendChatMessage(socket, { message, room });
        });
        
		socket.on('set seen', async ({ room }) => {
            setSeen(socket, { room });
        });

		socket.on('join wait list', async () => {
			joinWaitList(socket, waitList, games);
		});
		
		socket.on('leave wait list', async () => {
			leaveWaitList(socket, waitList, games);
		});
			
    })
    .on('disconnect', socket => {
        console.log(socket.decoded);
    });

instrument(io, {
    auth: false,
});

io.listen(3000);

console.log('Socket listening on port 3000');
// start server
(async () => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}.`);
    });
})();
