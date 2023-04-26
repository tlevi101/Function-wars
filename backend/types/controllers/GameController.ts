import {DecodedToken, MyRequest, MyResponse, socket} from "./Interfaces";
import {GroupChatController} from "./GroupChatController";
import {RuntimeMaps} from "../RuntimeMaps";
import {Game} from "../utils/Game";
import {PlayerInterface, UserInterface} from "../utils/interfaces";
const { Field } = require('../../models');
const chalk = require("chalk");


export class GameController{
    //*****************//
    //Route controllers//
    //*****************//

    /**
     * @method POST
     * @route /games/:gameUUID/function
     */
    public static async functionSubmitRequest(req: MyRequest, res: MyResponse){
        const { gameUUID } = req.params;
        const { fn } = req.body;
        const game = req.games.get(gameUUID);
        if (!game) {
            console.debug(gameUUID)
            return res.status(404).json({ message: 'Game not found.' });
        }
        let currentPlayer = game.CurrentPlayer;
        if (currentPlayer.ID !== req.user.id) {
            return res.status(403).json({ message: 'It is not your turn.' });
        }
        if (!fn) {
            return res.status(400).json({ message: 'You must submit a function.' });
        }
        const location = currentPlayer.Location;
        try {
            await game.submitFunction(fn);
        } catch (e) {
            console.log(e);
            return res.status(400).json({ message: 'Invalid function.' });
        }
        const { points, damages } = await game.calculateFunctionPoints();
        if (game.GameOver) {
            res.io.to(gameUUID).emit('game over', { points, message: `Game over, Winner is ${game.CurrentPlayer.Name}` });
            game.Sockets.forEach(socket => {
                socket.leave(gameUUID);
                GroupChatController.deleteGameGroupChat('chat-' + gameUUID);
            });
            req.games.delete(gameUUID);
            return res.status(200).json({ message: 'Game over.' });
        } else {
            res.io.to(gameUUID).emit('receive function', { points, damages });
        }
        game.changeCurrentPlayer();
        req.games.set(gameUUID, game);
        return res.status(200).json({ message: 'Function submitted.' });
    }


    /**
     * @method GET
     * @route /games/:gameUUID
     */
    public static async getGameRequest(req: MyRequest, res: MyResponse){
        const { gameUUID } = req.params;
        const game = req.games.get(gameUUID);
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }
        let players = game.Players;
        if (!players.find(player => player.ID === req.user.id)) {
            return res.status(403).json({ message: 'You are not in this game.' });
        }
        return res.status(200).json(game.toFrontend());
    }

    //******************//
    //Socket controllers//
    //******************//

    public static async leaveGame(socket: socket){
        const game = await this.getGame(socket.decoded.id);
        if (!game) {
            return;
        }
        game.playerLeft(socket.decoded.id);
        socket.leave(game.UUID);
        console.log(chalk.green(`Player ${socket.decoded.name} left game ${game.UUID}`));
    }

    public static async reconnect(socket: socket, gameUUID: string){
        const game = RuntimeMaps.games.get(gameUUID);
        if (!game) {
            console.debug('game not found');
            return;
        }
        if(!game.playerCanReconnect(socket.decoded.id)){
            console.debug('player cannot reconnect');
            return;
        }
        game.playerReconnect(socket.decoded.id, socket);
        GroupChatController.joinGroupChat(socket, game.ChatUUID);
        console.log(chalk.green(`Player ${socket.decoded.name} socket updated in ${game.UUID}`));
    }

    public static async getGame(playerID: number){
        for await (const [key, game] of RuntimeMaps.games) {
            if (game.Players.find(player => player.ID === playerID)) {
                return game;
            }
        }
        return null;
    }

    public static async createGame(sockets:socket[]){
        const players :UserInterface[] = [];
        const field = await Field.randomField(sockets.length);
        sockets.forEach(async socket => {
            const player : DecodedToken = socket.decoded;
            players.push(player);
        })
        const game = await Game.makeGameFromField(field, players, sockets);
        RuntimeMaps.games.set(game.UUID, game);
        console.log(chalk.green('game created, uuid: ' + game.UUID));
        sockets.forEach(socket => {
            socket.join(game.UUID);
            socket.emit('joined game', {
                room: game.UUID,
                players: game.Players,
                field: game.Field,
            });
        });
        GroupChatController.createGroupChat(sockets, players,game.UUID);

    }

    /**
     * Attempt to delete game, it's possible to try to delete non-existing game
     * @param socket
     */
    public static async deleteGame(socket:socket) {
        let game = await this.getGame(socket.decoded.id);
        if (!game) {
            return;
        }
        const gameUUID = game.UUID;
        const chatUUID =  game.ChatUUID;
        game.destroy();
        socket.to(gameUUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
        await GroupChatController.deleteGameGroupChat(chatUUID);
        console.log(chalk.green(`Game ${gameUUID} deleted.`));
    }

}