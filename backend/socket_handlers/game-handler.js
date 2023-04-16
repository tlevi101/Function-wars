const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const gameRouter = express.Router();
const FunctionCalculator = require('../utils/FuncCalculator');

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
    let { currentPlayer } = game;
    if (currentPlayer.id !== req.user.id) {
        return res.status(403).json({ message: 'It is not your turn.' });
    }
    if (!fn) {
        return res.status(400).json({ message: 'You must submit a function.' });
    }
    const modifiedGame = await modifyGame(game);
    const { location } = modifiedGame.currentPlayer.fieldParticle
    const func = new FunctionCalculator(fn, location.x, location.y);
    let { players, field } = modifiedGame;
    if (!func.isValidFunction()) {
        return res.status(400).json({ message: 'Invalid function.' });
    }
    //TODO check end of game

    let nextPlayer = players[(players.indexOf(currentPlayer) + 1) % players.length];

    game.currentPlayer = nextPlayer;
    req.games.set(game_uuid, game);
    console.log('emitting to game room');
    res.io.to(game_uuid).emit('receive function', {function: fn, game: await modifyGame(game)});
    return res.status(200).json({game: await modifyGame(game)});
});

gameRouter.get('/:game_uuid', auth, async (req, res) => {
    const { game_uuid } = req.params;

    const game = req.games.get(game_uuid);
    if (!game) {
        //TODO Handle this on frontend
        return res.status(404).json({ message: 'Game not found.' });
    }
    let { players, field } = game;
    if (!players.find(player => player.id === req.user.id)) {
        //TODO Handle this on frontend
        return res.status(403).json({ message: 'You are not in this game.' });
    }
    res.status(200).json(await modifyGame(game));
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
    if (!game) {
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

const modifyGame = async (game) => {
    let { players, field } = game;
    players = await Promise.all(
        players.map((player, index) => {
            return {
                id: player.id,
                name: player.name,
                fieldParticle: field.field.players[index],
            };
        })
    );
    return {
        players,
        field,
        currentPlayer: players.find(player => player.id === game.currentPlayer.id),
    };
};

