const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');

const getGameData = (socket, gameUUID, games) => {
	let game = games.get(gameUUID);
	console.log(game);
	if (!game) {
		//TODO Handle this on frontend
		return socket.emit('receive game data', { error: 'Game not found.' });
	}
	let { players, field  } = game;
	if(!players.find(player => player.id === socket.decoded.id)){
		
		//TODO Handle this on frontend
		return socket.emit('receive game data', { error: 'You are not in this game.' });
	}
	socket.emit('receive game data', { players, field });
}



module.exports = {
	getGameData,
};