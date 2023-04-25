import {MyRequest, MyResponse, socket} from "./Interfaces";
import {GroupChatController} from "./GroupChatController";
import {RuntimeMaps} from "../RuntimeMaps";
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
        const { game_uuid } = req.params;
        const game = req.games.get(game_uuid);
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
        console.log(chalk.green(`Player ${socket.decoded.name} socket updated in game to game ${game.UUID}`));
    }

    public static async getGame(socket: socket){
        for await (const [key, game] of RuntimeMaps.games) {
            if (game.Players.find(player => player.ID === socket.decoded.id)) {
                return game;
            }
        }
        return null;
    }

    public static async deleteGame(socket:socket) {
        let game = await this.getGame(socket.decoded.id);
        if (!game) {
            return;
        }
        const gameUUID = game.UUID;
        const chatUUID =  game.ChatUUID;
        socket.to(gameUUID).emit('game ended', { message: `${socket.decoded.name} left the game.` });
        GroupChatController.deleteGameGroupChat(chatUUID);
        console.log(chalk.green(`Game ${gameUUID} deleted.`));
    }

}