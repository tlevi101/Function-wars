const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const {stack} = require("sequelize/lib/utils");
const chalk = require("chalk");
const groupChatRouter = express.Router();


const leaveGroupChat = async (socket, groupChats) => {
    let groupChat = null;
    let groupChatUUID = null;
    for await (const _groupChat of groupChats) {
        if (_groupChat.Users.find(user => user.ID === socket.decoded.id)) {
            groupChat = _groupChat
            break;
        }
    }
    if (!groupChat) {
        return;
    }
    groupChat.leave(socket.decoded.id);
    if(groupChat.Users.length === 0) {
        groupChats.delete(groupChat.chatUUID);
    }
    socket.leave(groupChatUUID);
}

const deleteGameGroupChat = async (groupChats, groupChatUUID) => {
    const groupChat = groupChats.get(groupChatUUID);
    if (!groupChat) {
        return;
    }
    groupChat.Sockets.forEach(socket => socket.leave(groupChatUUID));
    groupChats.delete(groupChatUUID);
}

const deleteGameGroupChatByUserID = async (groupChats, userID) => {
    const groupChat = await getCroupChat(userID, groupChats);
    if (!groupChat) {
        return;
    }
    groupChat.Sockets.forEach(socket => socket.leave(groupChat.chatUUID));
    groupChats.delete(groupChat.chatUUID);
}

const joinGroupChat = async (socket, groupChats, groupChatUUID) => {
    const groupChat = groupChats.get(groupChatUUID);
    if (!groupChat) {
        return;
    }
    groupChat.join({id:socket.decoded.id, name:socket.decoded.name}, socket);
    socket.join(groupChatUUID);
}

const reconnectToGroupChat = async (socket, groupChats) => {
    const groupChat = await getCroupChat(socket.decoded.id, groupChats);
    if (!groupChat) {
        console.log(chalk.red('chat not found'));
        return;
    }
    socket.join(groupChat.chatUUID);
    groupChat.reconnect(socket.decoded.id, socket);
}

const getCroupChat = async (userID, groupChats) => {
    for await (const groupChat of groupChats.values()) {
        if (groupChat.Users.find(user => user.id === userID)) {
            return groupChat;
        }
    }
    return null;
}
const sendGroupMessage = async (socket, message, groupChats ) => {
    const groupChat = await findUserInGroupChats(groupChats, socket.decoded.id);
    if (!groupChat) {
        return;
    }
    if(!await groupChat.userCanSendMessage(socket.decoded.id)) {
        return;
    }
    await new Promise((resolve) =>{
        groupChat.addMessage({id:socket.decoded.id, name:socket.decoded.name}, message)
        resolve();
    });
    groupChat.Sockets.forEach(async s => {
        if(socket.decoded.id !== s.decoded.id) {
            console.log(await groupChat.userWantToReceiveMessagesFrom(s.decoded.id, socket.decoded.id));
            if (await groupChat.userWantToReceiveMessagesFrom(s.decoded.id, socket.decoded.id)) {
                s.emit('receive group message', {message: message, from: {id: socket.decoded.id, name: socket.decoded.name}});
            }
        }
    });

}


groupChatRouter.post('/:roomUUID/mute/:userID', auth, async (req, res) => {
    const { roomUUID, userID } = req.params;
    const { user } = req;
    const groupChat = req.groupChats.get(roomUUID);
    if (!groupChat) {
        return res.status(404).json({ message: 'Group chat not found.' });
    }
    let users = groupChat.Users;
    if (groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    if (groupChat.userIsInChat(userID)) {
        return res.status(404).json({ message: 'User not found.' });
    }
    try{
        groupChat.muteUser(user.id, userID);
    }
    catch(e) {
        return res.status(400).json({ message: e.message });
    }
    return res.status(200).json({ message: 'User muted.' });
});

groupChatRouter.post('/:roomUUID/unmute/:userID', auth, async (req, res) => {
    const { roomUUID, userID } = req.params;
    const { user } = req;
    const groupChat = req.groupChats.get(roomUUID);
    if (!groupChat) {
        return res.status(404).json({ message: 'Group chat not found.' });
    }
    let users = groupChat.Users;
    if (groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    if (groupChat.userIsInChat(userID)) {
        return res.status(404).json({ message: 'User not found.' });
    }
    try{
        groupChat.unmuteUser(user.id, userID);
    }
    catch(e) {
        return res.status(400).json({ message: e.message });
    }
    return res.status(200).json({ message: 'User unmuted.' });
});

groupChatRouter.get('/:roomUUID/messages', auth, async (req, res) => {
    const { roomUUID } = req.params;
    const { user } = req;
    const groupChat = req.groupChats.get(roomUUID);
    if (!groupChat) {
        return res.status(404).json({ message: 'Group chat not found.' });
    }
    if (groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    //TODO reconnect user here if they are not connected
    return res.status(200).json({ messages: groupChat.getMessagesForUser(user.id) });
});

module.exports={
    leaveGroupChat,
    deleteGameGroupChat,
    joinGroupChat,
    sendGroupMessage,
    reconnectToGroupChat,
    getCroupChat,
    deleteGameGroupChatByUserID,
    groupChatRouter
}

const findUserInGroupChats = async (groupChats, userID) => {
    for await (const [key, groupChat] of groupChats) {
        if (groupChat.users.find(user => user.id === userID)) {
            return groupChat;
        }
    }
    return null;
}