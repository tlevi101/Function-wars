const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const { Game} = require('../dist/Game');
const {GroupChat} = require("../dist/GroupChat");
const chalk = require("chalk");
const joinWaitList = async (socket, waitList, games, groupChats) => {
    socket.join('wait-list');
    waitList.set(socket.decoded.id, socket);
    console.log(`User (${socket.decoded.name}) joined wait list`);
    if (waitList.size >= 4) {
        PlaceIntoGame(4, waitList, games, groupChats);
    }
    if (waitList.size >= 3) {
        PlaceIntoGame(3, waitList, games, groupChats);
    }
    if (waitList.size >= 2) {
        PlaceIntoGame(2, waitList, games, groupChats);
    }
};

const leaveWaitList = async (socket, waitList) => {
    socket.leave('wait-list');
    console.log(`User (${socket.decoded.name}) left wait list`);
    waitList.delete(socket.decoded.id);
};

module.exports = {
    joinWaitList,
    leaveWaitList,
};
const PlaceIntoGame = async (count, waitList, games, groupChats) => {
    let players = [];
    let sockets = [];
    let iter = waitList.keys();
    let field = await Field.randomField(count);
    if (!field){
        //TODO: create seeder for fields
        //TODO: handle on frontend if no field found
        console.error(chalk.red.underline.italic(`No field found,for ${count} players`));
        return;
    }
    for (let i = 0; i < count; i++) {
        const id = iter.next().value;
        const user = await User.findByPk(id, { attributes: ['id', 'name'] });
        players.push(user.toJSON());
        sockets.push(waitList.get(id));
    }

    const newGame = await Game.makeGameFromField(field, players, sockets);
    games.set(newGame.UUID, newGame);
    sockets.forEach(socket => {
        leaveWaitList(socket, waitList);
        socket.join(newGame.UUID);
        socket.emit('joined game', {
            room: newGame.UUID,
            players: newGame.Players,
            field: newGame.Field,
        });
    });
    console.log(chalk.green('game created, uuid: ' + newGame.UUID));
    placeIntoGroupChat(sockets, players, groupChats, newGame.UUID)
};

const placeIntoGroupChat = async (sockets, players, groupChats, roomUUID) => {
    console.log(chalk.green('group chat created, uuid: chat-' + roomUUID));
    groupChats.set('chat-'+roomUUID, new GroupChat('chat-'+roomUUID,players.map(player=> { return {id:player.id, name:player.name}}),sockets));
    sockets.forEach(socket => {
        socket.join('chat-'+roomUUID);
    });
}
