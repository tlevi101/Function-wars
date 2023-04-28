const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const gameRouter = express.Router();
const FuncCalculator = require('../types/utils/FuncCalculator');
const { deleteGameGroupChat } = require('./group-chat-handler');
const chalk = require('chalk');
const { RuntimeMaps } = require('../types/RuntimeMaps');
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
            deleteGameGroupChat(req.groupChats, 'chat-' + game_uuid);
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
    const game = req.games.get(game_uuid);
    if (!game) {
        return res.status(404).json({ message: 'Game not found.' });
    }
    let players = game.Players;
    if (!players.find(player => player.ID === req.user.id)) {
        return res.status(403).json({ message: 'You are not in this game.' });
    }
    if (game.playerCanReconnect(req.user.id)) {
        console.log(chalk.green(`Player ${req.user.name} reconnected to game ${game.UUID}`));
        game.playerReconnect(req.user.id);
    }
    return res.status(200).json(game.toFrontend());
});

const leaveGame = async socket => {
    const game = await getGame(socket.decoded.id, RuntimeMaps.games);
    if (!game) {
        return;
    }
    game.playerLeft(socket.decoded.id);
    console.log(chalk.green(`Player ${socket.decoded.name} left game ${game.UUID}`));
};

const deleteGame = async socket => {
    let game = await getGame(socket.decoded.id, RuntimeMaps.games);
    if (!game) {
        return;
    }
    let gameUUID = game.UUID;
    socket.to(gameUUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
    game.Sockets.forEach(socket => socket.leave(gameUUID));
    socket.leave(game.room);
    RuntimeMaps.games.delete(gameUUID);
    console.log(chalk.green(`Game ${gameUUID} deleted.`));
};

const getGame = async userID => {
    for await (const [key, game] of RuntimeMaps.games) {
        if (game.Players.find(player => player.id === userID)) {
            return game;
        }
    }
    return null;
};
const userIsOnlineInGame = async socket => {
    let game = await getGame(socket.decoded.id, RuntimeMaps.games);
    if (!game) {
        console.debug('game not found');
        throw new Error('Game not found.');
    }
    return game.playerIsOnline(socket.decoded.id);
};

const reconnectToGame = async socket => {
    let game = await getGame(socket.decoded.id, RuntimeMaps.games);
    if (!game) {
        console.debug('game not found');
        return;
    }
    socket.join(game.UUID);
    game.updatePlayerSocket(socket.decoded.id, socket);
    console.log(chalk.green(`Player ${socket.decoded.name} socket updated in game to game ${game.UUID}`));
};
const updateGameSocket = async socket => {
    let game = await getGame(socket.decoded.id, RuntimeMaps.games);
    if (!game) {
        console.debug('game not found');
        return;
    }
    game.updatePlayerSocket(socket.decoded.id, socket);
};
