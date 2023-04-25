import {RuntimeMaps} from "../RuntimeMaps";
import {socket} from "../controllers/Interfaces";
import {leaveWaitList} from "../../socket_handlers/wait-list-handler";
import {CustomGameController} from "../controllers/CustomGameController";
import {deleteGame, getGame} from "../../socket_handlers/game-handler";
import {GroupChatController} from "../controllers/GroupChatController";
import {Game} from "../utils/Game";
import {GroupChat} from "../utils/GroupChat";
import {GameController} from "../controllers/GameController";


export class SocketConnectionService{
    private static TIME_TO_RECONNECT = 10*1000;
    public static userConnected(socket: socket) {
        RuntimeMaps.onlineUsers.set(socket.decoded.id, { user: socket.decoded, socketID: socket.id, currentURL: '' });
    }
    public static async userNavigated(socket:socket, url:string){
        const user = RuntimeMaps.onlineUsers.get(socket.decoded.id);
        if(user){
            if(user.currentURL !== url){
                await GameController.leaveGame(socket);
                await CustomGameController.leaveWaitingRoom(socket);
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
        RuntimeMaps.onlineUsers.delete(socket.decoded.id);
        leaveWaitList(socket);
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
        const game:Game| null = await getGame(socket.decoded.id);
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
        const regex = /\/waiting-room\/([a-zA-Z0-9\-]+)/;
        const match = url.match(regex);
        if(match){
            return match[1];
        }
        return null;
    }
}