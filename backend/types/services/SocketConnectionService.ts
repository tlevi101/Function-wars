import {RuntimeMaps} from "../RuntimeMaps";
import {socket} from "../controllers/Interfaces";
import {CustomGameController} from "../controllers/CustomGameController";
import {GroupChatController} from "../controllers/GroupChatController";
import {Game} from "../utils/Game";
import {GameController} from "../controllers/GameController";
import {WaitListController} from "../controllers/WaitListController";
const  chalk = require("chalk");


export class SocketConnectionService{
    private static TIME_TO_RECONNECT = 10*1000;
    public static userConnected(socket: socket) {
        console.debug(chalk.blue(`user (id:${socket.decoded.id}, name:${socket.decoded.name}) connected`));
        RuntimeMaps.onlineUsers.set(socket.decoded.id, { user: socket.decoded, socketID: socket.id, currentURL: '' });
    }
    public static async userNavigated(socket:socket, url:string){
        const user = RuntimeMaps.onlineUsers.get(socket.decoded.id);
        if(user){
            console.log(`User (${socket.decoded.name}) navigated to ${url}`);
            if(user.currentURL !== url && this.userLeftFromWaitRoomOrGame(user.currentURL)){
                await GameController.leaveGame(socket);
                await CustomGameController.leaveWaitingRoom(socket);
                console.log('user left game or waiting room');
                setTimeout(async ()=>{
                    console.log('timeout');
                    if(await this.userLeftTheGame(socket)){
                        GameController.deleteGame(socket);
                    }
                    if(await this.ownerLeftWaitingRoom(socket)){
                        CustomGameController.deleteWaitingRoom(socket);
                    }

                }, this.TIME_TO_RECONNECT)
            }
            user.currentURL = url;
            const gameUUID = this.getGameUUIDFromURL(url);
            if(gameUUID){
                await this.userAttemptToReconnectToGame(socket, gameUUID);
                return;
            }
            const waitRoomUUID = this.getWaitRoomUUIDFromURL(url);
            if(waitRoomUUID){
                await CustomGameController.joinWaitingRoom(socket, waitRoomUUID);
                return;
            }
        }
    }

    public static userDisconnected(socket:socket){
        console.log(`User (${socket.decoded.name}) disconnected`);
        const user = RuntimeMaps.onlineUsers.get(socket.decoded.id);
        RuntimeMaps.onlineUsers.delete(socket.decoded.id);
        if(user && !this.userLeftFromWaitRoomOrGame(user.currentURL)){
            return;
        }
        WaitListController.leaveWaitList(socket);
        CustomGameController.leaveWaitingRoom(socket);
        GroupChatController.leaveGroupChat(socket);
        GameController.leaveGame(socket);
        setTimeout(async ()=>{
            if(await this.userLeftTheGame(socket)){
                GameController.deleteGame(socket);
            }
            if(await this.ownerLeftWaitingRoom(socket)){
                CustomGameController.deleteWaitingRoom(socket);
            }

        }, this.TIME_TO_RECONNECT)
    }

    private static async userLeftTheGame(socket:socket){
        const game:Game| null = await GameController.getGame(socket.decoded.id);
        if(!game){
            //user is not in any game
            return;
        }
        return !game.playerIsOnline(socket.decoded.id);
    }

    private static async ownerLeftWaitingRoom(socket:socket){
        return await CustomGameController.ownerLeft(socket);
    }

    private static async userAttemptToReconnectToGame(socket:socket, gameUUID:string){
        GameController.reconnect(socket, gameUUID);
    }

    private static getGameUUIDFromURL(url:string):string|null{
        const regex = /\/games\/([a-zA-Z0-9\-]+)/;
        const match = url.match(regex);
        if(match){
            return match[1];
        }
        return null;
    }

    private static getWaitRoomUUIDFromURL(url:string):string|null{
        const regex = /\/wait-rooms\/([a-zA-Z0-9\-]+)/;
        const match = url.match(regex);
        if(match){
            return match[1];
        }
        return null;
    }

    private static userLeftFromWaitRoomOrGame(url:string){
        const regex = /(\/wait-rooms\/[a-zA-Z0-9\-]+)|\/games\/([a-zA-Z0-9\-]+)/;
        return url.search(regex)!==-1;
    }
}