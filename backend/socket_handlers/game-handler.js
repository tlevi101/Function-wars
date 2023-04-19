const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const gameRouter = express.Router();
const FuncCalculator = require('../dist/FuncCalculator');

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
    return res.status(200).json(game.toFrontend());
});

const leaveGame = async (socket, games) => {
    let game = null;
    let gameUUID = null;
    games.forEach((value, key) => {
        if (value.sockets.find(s => s.id === socket.id)) {
            game = value;
            gameUUID = key;
        }
    });
    if (!game || !gameUUID) {
        return;
    }
    socket.to(gameUUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
    game.sockets.forEach(socket => socket.leave(gameUUID));
    socket.leave(game.room);
    games.delete(gameUUID);
};

module.exports = {
    leaveGame,
    gameRouter,
};
