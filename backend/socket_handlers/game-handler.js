const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const gameRouter = express.Router();
const FuncCalculator = require('../dist/FuncCalculator');
const {stack} = require("sequelize/lib/utils");
const {deleteGameGroupChat} = require("./group-chat-handler");
const chalk = require("chalk");

/**
 * @route GET games/:game_uuid/function/submit
 * on success: 200 and emit 'receive function' socket event to game room
 */
gameRouter.post('/:game_uuid/function/submit', auth, async (req, res) => {
    const { game_uuid } = req.params;
    const { fn } = req.body;
    const game = req.games.get(game_uuid);
    if (!game) {
        return res.status(404).json({ message: 'Game not found.' });
    }
    let currentPlayer = game.CurrentPlayer;
    if (currentPlayer.ID !== req.user.id) {
        return res.status(403).json({ message: 'It is not your turn.' });
    }
    if (!fn) {
        return res.status(400).json({ message: 'You must submit a function.' });
    }
    const { location } = currentPlayer;
    try {
        await game.submitFunction(fn);
    } catch (e) {
        console.log(e);
        return res.status(400).json({ message: 'Invalid function.' });
    }
    const { points, damages } = await game.calculateFunctionPoints();
    if (game.GameOver) {
        res.io.to(game_uuid).emit('game over', { points, message: `Game over, Winner is ${game.CurrentPlayer.Name}` });
        game.Sockets.forEach(socket => {
            socket.leave(game_uuid);
            deleteGameGroupChat(req.groupChats, 'chat-'+game_uuid);
        });
        req.games.delete(game_uuid);
        return res.status(200).json({ message: 'Game over.' });
    } else {
        res.io.to(game_uuid).emit('receive function', { points, damages });
    }
    game.changeCurrentPlayer();
    req.games.set(game_uuid, game);
    return res.status(200).json({ message: 'Function submitted.' });
});

gameRouter.get('/:game_uuid', auth, async (req, res) => {
    const { game_uuid } = req.params;
    console.log('game_uuid: ', game_uuid);
    const game = req.games.get(game_uuid);
    if (!game) {
        return res.status(404).json({ message: 'Game not found.' });
    }
    let players = game.Players;
    if (!players.find(player => player.ID === req.user.id)) {
        return res.status(403).json({ message: 'You are not in this game.' });
    }
    if(game.playerCanReconnect(req.user.id)){
        game.playerReconnect(req.user.id)
    }
    return res.status(200).json(game.toFrontend());
});

const leaveGame = async (socket, games) => {
    const game = await getGame(socket.decoded.id, games);
    if (!game) {
        return;
    }
    game.playerLeft(socket.decoded.id);
};

const deleteGame = async (socket,games) => {
    let game = await getGame(socket.decoded.id, games);
    if (!game) {
        return;
    }
    let gameUUID = game.UUID;
    socket.to(gameUUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
    game.Sockets.forEach(socket => socket.leave(gameUUID));
    socket.leave(game.room);
    games.delete(gameUUID);
};

const getGame = async (userID, games) => {
    for await (const [key, game] of games) {
        if (game.Players.find(player => player.id === userID)) {
            return game;
        }
    }
    return null;
}
const userIsOnlineInGame = async (socket, games) => {
    let game = await getGame(socket.decoded.id, games);
    if (!game) {
        throw new Error('Game not found.');
    }
    return game.playerIsOnline(socket.decoded.id);
}

const reconnectToGame = async (socket, games) => {
    let game = await getGame(socket.decoded.id, games);
    if (!game) {
        console.log(chalk.red('game not found'));
        return;
    }
    socket.join(game.UUID);
    game.updatePlayerSocket(socket.decoded.id,socket)
}
const updateGameSocket = async (socket, games) => {
    let game = await getGame(socket.decoded.id, games);
    if (!game) {
        console.log(chalk.red('game not found'));
        return;
    }
    game.updatePlayerSocket(socket.decoded.id,socket)
}

module.exports = {
    leaveGame,
    deleteGame,
    getGame,
    userIsOnlineInGame,
    reconnectToGame,
    updateGameSocket,
    gameRouter,
};
