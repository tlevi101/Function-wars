const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const Game = require('../utils/dist/Game');
const joinWaitList = async (socket, waitList, games) => {
    socket.join('wait-list');
    console.log('joined wait-list');
    waitList.set(socket.decoded.id, socket);
    if (waitList.size >= 4) {
        PlaceIntoGame(4, waitList, games);
    }
    if (waitList.size >= 3) {
        PlaceIntoGame(3, waitList, games);
    }
    if (waitList.size >= 2) {
        PlaceIntoGame(2, waitList, games);
    }
};

const leaveWaitList = async (socket, waitList) => {
    socket.leave('wait-list');
    console.log('left wait-list');
    waitList.delete(socket.decoded.id);
};

module.exports = {
    joinWaitList,
    leaveWaitList,
};
const PlaceIntoGame = async (count, waitList, games) => {
    let players = [];
    let sockets = [];
    let iter = waitList.keys();
    let field = await Field.randomField(count);
    if (!field) return;
    for (let i = 0; i < count; i++) {
        const id = iter.next().value;
        const user = await User.findByPk(id, { attributes: ['id', 'name'] });
        players.push(user.toJSON());
        sockets.push(waitList.get(id));
    }

    players.forEach(user => {
        waitList.delete(user);
    });
    const newGame =  await Game.makeGameFromField(field, players, sockets);
    games.set(newGame.UUID, newGame);
    sockets.forEach(socket => {
        socket.leave('wait-list');
        socket.join(newGame.UUID);
        socket.emit('joined game', {
            room: newGame.UUID,
            players: newGame.Players,
            field: newGame.Field,
        });
    });
};
