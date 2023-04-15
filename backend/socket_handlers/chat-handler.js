const { Friendship, User, Chat } = require('../models');
const { Op } = require('sequelize');


const sendChatMessage = async (socket, message, friend_id, onlineUsers) => {
	console.log(onlineUsers);
	const user = onlineUsers.get(socket.decoded.id).user;
	let chat = await user.getChat(friend_id);
	if (!chat) {
		const friendship = await user.getFriendShip(friend_id);
		if (!friendship) return;
		let newMessages = [];
		newMessages.push({ from: user.id, message: message, seen: false });
		const newChat = await Chat.create({ friendship_id: friendship.id, messages: newMessages });
		chat = newChat;
	}
	chat.messages.push({ from: user.id, message: message, seen: false });
	await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
	if(onlineUsers.has(friend_id)){
		socket.to(onlineUsers.get(friend_id).socketId).emit('receive message', { from: user.id, message: message, seen: false });
	}
}



const setSeen = async (socket, friend_id ) => {
	const user = await User.findOne({ where: { id: socket.decoded.id } });
	const chat = await user.getChat(friend_id);
	if (!chat) return;
	chat.messages = chat.messages.map(message => {
		if (message.from !== user.id) {
			message.seen = true;
		}
		return message;
	});
	await Chat.update({ messages: chat.messages }, { where: { id: chat.id } });
}




module.exports = {
	sendChatMessage,
	setSeen,
}