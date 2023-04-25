import {DecodedToken, GamesMap, GroupChatsMap, MyRequest, MyResponse, socket, WaitingRoomsMap} from './Interfaces';
import { WaitingRoom } from '../utils/WaitingRoom';
import { GroupChat } from '../utils/GroupChat';
import {RuntimeMaps} from "../RuntimeMaps";
// const { app } = require('../../app
export class CustomGameController {
    //*****************//
    //Route controllers//
    //*****************//

    /**
     * Basically the waiting rooms for custom games
     * @route GET /custom-games
     * @param req
     * @param res
     */
    public static async getCustomGames(req: MyRequest, res: MyResponse) {
        const waitingRooms = WaitingRoom.publicRoomsFree(Array.from(req.waitingRooms.values()));
        return res.status(200).json({ customGames: WaitingRoom.toFrontendAll(waitingRooms)});
    }
    /**
     * @route GET /custom-games/:roomUUID
     * @param req
     * @param res
     */
    public static async getWaitingRoom(req: MyRequest, res: MyResponse) {
        const { roomUUID } = req.params;
        console.debug(`Getting waiting room ${roomUUID}`)
        const room = req.waitingRooms.get(roomUUID||'');
        if(!room) {
            return res.status(404).json({message: 'Room not found'});
        }
        return res.status(200).json({ waitRoom: room.toFrontend() });
    }


    //******************//
    //Socket controllers//
    //******************//

    /**
     * @event create custom game
     * @param socket: socket
     * @param fieldID: number
     * @param isPrivate: boolean
     */
    public static async createCustomGame(
        socket: socket,
        fieldID: number,
        isPrivate:boolean,
    ) {
        console.debug(`User (${socket.decoded.name}) created a custom game.`);
        const room = new WaitingRoom(socket.decoded, fieldID, socket, isPrivate);
        RuntimeMaps.waitingRooms.set(room.UUID, room);
        RuntimeMaps.groupChats.set(room.ChatUUID, new GroupChat(room.ChatUUID, room.playersToUserInterface(), room.Sockets));
        socket.emit('waiting room created', { roomUUID: room.UUID, groupChatUUID: room.ChatUUID });
    }

    /**
     * @event join waiting room
     * @param socket: socket
     * @param roomUUID: string
     */
    public static async joinWaitingRoom(
        socket: socket,
        roomUUID: string,
    ) {
        const room = RuntimeMaps.waitingRooms.get(roomUUID);
        const groupChat = RuntimeMaps.groupChats.get(room?.ChatUUID || '');
        const user = socket.decoded;
        if(!room || !groupChat) {
            socket.emit('error', {message: 'Custom game not found.'});
            console.debug('Custom game not found.');
            //TODO: add error handling on client side
            return;
        }
        if (room.isFull()) {
            socket.emit('error', { message: 'Custom game is full' });
            console.debug('Custom game is full');
            return;
        }
        socket.join(room.UUID);
        socket.join(room.ChatUUID);
        room.join(user, socket);
        groupChat.join({ id: user.id, name: user.name }, socket);
        socket.emit('waiting room joined');
    }

    /**
     * @event leave waiting room
     * @param socket
     * @param owner
     */
    public static async leaveWaitingRoom(socket:socket) {

        const room = await CustomGameController.getWaitingRoomByUser(socket.decoded);
        const groupChat = RuntimeMaps.groupChats.get(room?.ChatUUID || '');
        const user = socket.decoded;
        if(!room || !groupChat) {
            socket.emit('error', {message: 'Room not found'});
            return;
        }
        if(room.isOwner(user.id)) {
            room.destroy();
            groupChat.destroy();
        }
        room.leave(user.id);
        groupChat.leave(user.id, socket);
    }

    /**
     *
     * @param user : DecodedToken
     * @private
     */
    private static async getWaitingRoomByUser(user: DecodedToken) {
        for await (const [key, value] of RuntimeMaps.waitingRooms.entries()) {
            if (value.Players.some(p => p.id === user.id)) {
                return value;
            }
        }
        return null;
    }
}
