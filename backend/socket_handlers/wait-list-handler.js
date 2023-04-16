const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');

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
        players.push(await User.findByPk(id, { attributes: ['id', 'name'] }));
        sockets.push(waitList.get(id));
    }

    players.forEach(user => {
        waitList.delete(user);
    });

    games.set(`game-${field.id}-${players.map(player => player.id).join('')}`, {
        sockets: sockets,
        players: players,
        field: field,
        currentPlayer: players[0],
    });
    sockets.forEach(socket => {
        socket.leave('wait-list');
        socket.join(`game-${field.id}-${players.map(player => player.id).join('')}`);
        socket.emit('joined game', {
            room: `game-${field.id}-${players.map(player => player.id).join('')}`,
            players: players,
            field: field,
        });
    });
};
