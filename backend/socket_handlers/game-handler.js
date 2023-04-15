const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');

const submitFunction = async (socket, gameUUID, games, fn) => {
    let game = games.get(gameUUID);
    let { currentPlayer } = game;
    if (currentPlayer.player.id !== socket.decoded.id) {
        //TODO Handle this on frontend
        return socket.emit('receive game data', { error: 'It is not your turn.' });
    }

    let { player } = currentPlayer;

    //TODO validate function
    //TODO check end of game

    let nextPlayer = players[(players.indexOf(player) + 1) % players.length];

    game.currentPlayer = nextPlayer;
    games.set(gameUUID, game);
    socket.to(gameUUID).emit('receive function', { function: fn, player: player });
};

module.exports = {
    submitFunction,
};

class Function {
    constructor(fn, width = 1000, height = 800, zeroX, zeroY, ratio = 35) {
        this.fn = fn;
        this.width = width;
        this.height = height;
        this.zeroX = zeroX;
        this.zeroY = zeroY;
        this.ratio = ratio;
        if (!this.isValidFunction()) {
            throw new Error('Invalid function');
        }
    }

    calculateRightSidePoints() {
        let points = [];
        for (let x = this.zeroX; x < this.width; x++) {
            if (!Number.isFinite(this.calculateY(x))) {
                if (this.calculateY(x) == Infinity) {
                    points.push({ x: x, y: 0 });
                }
                if (this.calculateY(x) == -Infinity) {
                    points.push({ x: x, y: this.height });
                }
                return points;
            }
            if (Number.isInteger(this.calculateY(x))) {
                points.push({ x: x, y: this.calculateY(x) });
                if (this.calculateY(x) < 0 || this.calculateY(x) > this.height) {
                    return points;
                }
            }
        }
        return points;
    }

    calculateLeftSidePoints() {
        let points = [];
        for (let x = this.zeroX; x > 0; x--) {
            if (!Number.isFinite(this.calculateY(x))) {
                if (this.calculateY(x) == Infinity) {
                    points.push({ x: x, y: 0 });
                }
                if (this.calculateY(x) == -Infinity) {
                    points.push({ x: x, y: this.height });
                }
                return points;
            }
            if (Number.isInteger(this.calculateY(x))) {
                points.push({ x: x, y: this.calculateY(x) });
                if (this.calculateY(x) < 0 || this.calculateY(x) > this.height) {
                    return points;
                }
            }
        }
        return points;
    }

    calculateY(x) {
        let fn = this.replaceXWithValue((x - this.zeroX) / this.ratio);
        return Math.round(this.zeroY - eval(fn) * this.ratio);
    }

    firstValidPoint() {
        for (let x = this.zeroX; x < this.width; x++) {
            if (Number.isInteger(this.calculateY(x))) {
                return { x: x, y: this.calculateY(x) };
            }
        }
        for (let x = this.zeroX; x > 0; x--) {
            if (Number.isInteger(this.calculateY(x))) {
                return { x: x, y: this.calculateY(x) };
            }
        }
        return null;
    }

    replaceXWithValue(value) {
        let fn = this.fn.replaceAll('X', value.toString());
        return fn;
    }

    isValidFunction() {
        return !Number.isNaN(this.calculateY(0)) && this.firstValidPoint !== null; //TODO make other checks
    }
}
