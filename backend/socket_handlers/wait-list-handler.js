const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const { Game } = require('../types/utils/Game');
const { GroupChat } = require('../types/utils/GroupChat');
const chalk = require('chalk');
const { RuntimeMaps } = require('../types/RuntimeMaps');
const {GroupChatController} = require("../types/controllers/GroupChatController");
const joinWaitList = async (socket) => {
    socket.join('wait-list');
    RuntimeMaps.waitList.set(socket.decoded.id, socket);
    console.log(`User (${socket.decoded.name}) joined wait list`);
    if (RuntimeMaps.waitList.size >= 4) {
        PlaceIntoGame(4);
    }
    if (RuntimeMaps.waitList.size >= 3) {
        PlaceIntoGame(3);
    }
    if (RuntimeMaps.waitList.size >= 2) {
        PlaceIntoGame(2);
    }
};

const leaveWaitList = async (socket) => {
    socket.leave('wait-list');
    console.log(`User (${socket.decoded.name}) left wait list`);
    RuntimeMaps.waitList.delete(socket.decoded.id);
};

const PlaceIntoGame = async (count) => {
    let players = [];
    let sockets = [];
    let iter = RuntimeMaps.waitList.keys();
    let field = await Field.randomField(count);
    if (!field) {
        //TODO: create seeder for fields
        //TODO: handle on frontend if no field found
        console.error(chalk.red.underline.italic(`No field found,for ${count} players`));
        return;
    }
    for (let i = 0; i < count; i++) {
        const id = iter.next().value;
        const user = await User.findByPk(id, { attributes: ['id', 'name'] });
        players.push(user.toJSON());
        sockets.push(RuntimeMaps.waitList.get(id));
    }
    const newGame = await Game.makeGameFromField(field, players, sockets);
    RuntimeMaps.games.set(newGame.UUID, newGame);
    sockets.forEach(socket => {
        leaveWaitList(socket);
        socket.join(newGame.UUID);
        socket.emit('joined game', {
            room: newGame.UUID,
            players: newGame.Players,
            field: newGame.Field,
        });
    });
    console.log(chalk.green('game created, uuid: ' + newGame.UUID));
    GroupChatController.createGroupChat(sockets, players.map(p => {
        return {id: p.id, name: p.name};
    }), newGame.UUID)
};