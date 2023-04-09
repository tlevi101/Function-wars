const { Friendship, User, Chat } = require('../models');
const { Op } = require('sequelize');


const joinChatRoom = async (socket) => {
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
}



const sendChatMessage = async (socket, { message, room }) => {
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
}



const setSeen = async (socket, { room }) => {
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
}




module.exports = {
	joinChatRoom,
	sendChatMessage,
	setSeen,
}