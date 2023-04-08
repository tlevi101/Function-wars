require('dotenv').config();
const app = require('./app');
const http = require('http').createServer();
const { User, Friendship, Chat } = require('./models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { instrument } = require('@socket.io/admin-ui');

const io = require('socket.io')(http, {
    cors: {
        origin: ['*', 'https://admin.socket.io', 'http://localhost:4200'],
        credentials: true,
    },
});
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
            const user = await User.findOne({ where: { id: socket.decoded.id } });
            if (!user) return;
            const friendShips = await Friendship.findAll({
                where: { [Op.or]: [{ user_id: user.id }, { friend_id: user.id }] },
            });
            friendShips.forEach(friendShip => {
                socket.join(`chat-${friendShip.id}`);
                socket.emit(`joined chat room`, {
                    room: `chat-${friendShip.id}`,
                    friend_id: friendShip.friend_id === user.id ? friendShip.user_id : friendShip.friend_id,
                });
            });
        });
        socket.on('send chat message', async ({ message, room }) => {
            const user = await User.findOne({ where: { id: socket.decoded.id } });
            let chat = await user.getChat(room.friend_id);
            if (!chat) {
                const friendship = await user.getFriendShip(room.friend_id);
                if (!friendship) return;
                let newMessages = [];
                newMessages.push({ from: user.id, message: message, seen: false });
                const newChat = await Chat.create({ friendship_id: friendship.id, messages: newMessages });
                chat = newChat;
            }
            chat.messages.push({ from: user.id, message: message, seen: false });
            await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
            socket.to(room.room).emit('receive message', { from: user.id, message: message, seen: false });
        });
        socket.on('set seen', async ({ room }) => {
            const user = await User.findOne({ where: { id: socket.decoded.id } });
            const chat = await user.getChat(room.friend_id);
            if (!chat) return;
            chat.messages = chat.messages.map(message => {
                if (message.from !== user.id) {
                    message.seen = true;
                }
                return message;
            });
            await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
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
