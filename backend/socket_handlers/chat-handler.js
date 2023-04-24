const { Friendship, User, Chat } = require('../models');
const { Op } = require('sequelize');
const {RuntimeMaps} = require("../types/RuntimeMaps");

const sendChatMessage = async (socket, message, friend_id) => {
    console.log(RuntimeMaps.onlineUsers);
    const user = await User.findByPk(RuntimeMaps.onlineUsers.get(socket.decoded.id).user.id);
    let chat = await user.getChat(friend_id);
    if (!chat) {
        const friendship = await user.getFriendShip(friend_id);
        if (!friendship) {
            console.error('Message not sent. Friendship not found.');
            return;
        }
        let newMessages = [];
        newMessages.push({ from: user.id, message: message, seen: false });
        const newChat = await Chat.create({ friendship_id: friendship.id, messages: newMessages });
        chat = newChat;
    }
    chat.messages.push({ from: user.id, message: message, seen: false });
    await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
    if (RuntimeMaps.onlineUsers.has(friend_id)) {
        console.log('Friend is online.');
        socket
            .to(RuntimeMaps.onlineUsers.get(friend_id).socketID)
            .emit('receive message', { from: user.id, message: message, seen: false });
    } else {
        console.log('Friend is offline.');
    }
};

const setSeen = async (socket, friend_id) => {
    const user = await User.findOne({ where: { id: socket.decoded.id } });
    const chat = await user.getChat(friend_id);
    if (!chat) {
        console.error('Chat not found.');
        return;
    }
    chat.messages = chat.messages.map(message => {
        if (message.from !== user.id) {
            message.seen = true;
        }
        return message;
    });
    await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
};

module.exports = {
    sendChatMessage,
    setSeen,
};
