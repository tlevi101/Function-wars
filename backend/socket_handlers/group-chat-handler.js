const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const chalk = require('chalk');
const { RuntimeMaps } = require('../types/RuntimeMaps');
import GroupChat from '../types/utils/GroupChat';
const groupChatRouter = express.Router();

const leaveGroupChat = async socket => {
    let groupChat = null;
    let groupChatUUID = null;
    for await (const _groupChat of RuntimeMaps.groupChats) {
        if (_groupChat.Users.find(user => user.ID === socket.decoded.id)) {
            groupChat = _groupChat;
            break;
        }
    }
    if (!groupChat) {
        return;
    }
    groupChat.leave(socket.decoded.id);
    if (groupChat.Users.length === 0) {
        RuntimeMaps.groupChats.delete(groupChat.chatUUID);
    }
    socket.leave(groupChatUUID);
};

const deleteGameGroupChat = async groupChatUUID => {
    const groupChat = RuntimeMaps.groupChats.get(groupChatUUID);
    if (!groupChat) {
        return;
    }
    groupChat.Sockets.forEach(socket => socket.leave(groupChatUUID));
    RuntimeMaps.groupChats.delete(groupChatUUID);
};

const deleteGameGroupChatByUserID = async userID => {
    const groupChat = await getCroupChat(userID, RuntimeMaps.groupChats);
    if (!groupChat) {
        return;
    }
    groupChat.Sockets.forEach(socket => socket.leave(groupChat.chatUUID));
    RuntimeMaps.groupChats.delete(groupChat.chatUUID);
};

const joinGroupChat = async (socket, groupChatUUID) => {
    const groupChat = RuntimeMaps.groupChats.get(groupChatUUID);
    if (!groupChat) {
        return;
    }
    groupChat.join({ id: socket.decoded.id, name: socket.decoded.name }, socket);
    socket.join(groupChatUUID);
};

const reconnectToGroupChat = async socket => {
    const groupChat = await getCroupChat(socket.decoded.id, RuntimeMaps.groupChats);
    if (!groupChat) {
        console.debug('chat not found');
        return;
    }
    socket.join(groupChat.chatUUID);
    groupChat.reconnect(socket.decoded.id, socket);
};

const getCroupChat = async userID => {
    for await (const groupChat of RuntimeMaps.groupChats.values()) {
        if (groupChat.Users.find(user => user.id === userID)) {
            return groupChat;
        }
    }
    return null;
};
const sendGroupMessage = async (socket, message) => {
    const groupChat = await findUserInGroupChats(socket.decoded.id);
    if (!groupChat) {
        return;
    }
    if (!(await groupChat.userCanSendMessage(socket.decoded.id))) {
        return;
    }
    await new Promise(resolve => {
        groupChat.addMessage({ from: { id: socket.decoded.id, name: socket.decoded.name }, message });
        resolve();
    });
    groupChat.Sockets.forEach(async s => {
        if (socket.decoded.id !== s.decoded.id) {
            console.log(await groupChat.userWantToReceiveMessagesFrom(s.decoded.id, socket.decoded.id));
            if (await groupChat.userWantToReceiveMessagesFrom(s.decoded.id, socket.decoded.id)) {
                s.emit('receive group message', {
                    message: message,
                    from: { id: socket.decoded.id, name: socket.decoded.name },
                });
            }
        }
    });
};

groupChatRouter.post('/:roomUUID/mute/:userID', auth, async (req, res) => {
    const { roomUUID, userID } = req.params;
    const { user } = req;
    const groupChat = req.groupChats.get(roomUUID);
    if (!groupChat) {
        return res.status(404).json({ message: 'Group chat not found.' });
    }
    if (!groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    if (!groupChat.userIsInChat(userID)) {
        return res.status(404).json({ message: 'User not found.' });
    }
    try {
        groupChat.muteUser(user.id, userID);
    } catch (e) {
        console.error(e.message);
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
    console.debug(groupChat.userIsInChat(user.id));
    if (!groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    console.debug(groupChat.userIsInChat(userID));
    if (!groupChat.userIsInChat(userID)) {
        return res.status(404).json({ message: 'User not found.' });
    }
    try {
        groupChat.unmuteUser(user.id, userID);
    } catch (e) {
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
    if (!groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    //TODO reconnect user here if they are not connected
    return res.status(200).json({ messages: groupChat.getMessagesForUser(user.id) });
});

groupChatRouter.get('/:roomUUID/users-status', auth, async (req, res) => {
    const { roomUUID } = req.params;
    const { user } = req;
    const groupChat = req.groupChats.get(roomUUID);
    if (!groupChat) {
        return res.status(404).json({ message: 'Group chat not found.' });
    }
    console.debug(!groupChat.userIsInChat(user.id));
    if (!groupChat.userIsInChat(user.id)) {
        return res.status(403).json({ message: 'You are not in this group chat.' });
    }
    return res.status(200).json({ users: await groupChat.getOtherUsersStatusForUser(user.id) });
});

const findUserInGroupChats = async userID => {
    for await (const [key, groupChat] of RuntimeMaps.groupChats) {
        if (groupChat.users.find(user => user.id === userID)) {
            return groupChat;
        }
    }
    return null;
};
