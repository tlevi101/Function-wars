import { DecodedToken, GroupChatsMap, MyRequest, MyResponse, socket, WaitingRoomsMap } from './Interfaces';
import { WaitingRoom } from '../utils/WaitingRoom';
import { GroupChat } from '../utils/GroupChat';

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
     * @param waitingRooms: WaitingRoomsMap
     * @param groupChats: GroupChatsMap
     */
    public static async createCustomGame(
        socket: socket,
        fieldID: number,
        isPrivate:boolean,
        waitingRooms: WaitingRoomsMap,
        groupChats: GroupChatsMap
    ) {
        console.debug(`User (${socket.decoded.name}) created a custom game.`);
        const room = new WaitingRoom(socket.decoded, fieldID, socket, isPrivate);
        waitingRooms.set(room.UUID, room);
        groupChats.set(room.ChatUUID, new GroupChat(room.ChatUUID, room.playersToUserInterface(), room.Sockets));
        socket.emit('waiting room created', { roomUUID: room.UUID, groupChatUUID: room.ChatUUID });
    }

    /**
     * @event join waiting room
     * @param socket: socket
     * @param owner: DecodedToken
     * @param waitingRooms: WaitingRoomsMap
     * @param groupChats: GroupChatsMap
     */
    public static async joinWaitingRoom(
        socket: socket,
        roomUUID: string,
        waitingRooms: WaitingRoomsMap,
        groupChats: GroupChatsMap
    ) {
        const room = waitingRooms.get(roomUUID);
        const groupChat = groupChats.get(room?.ChatUUID || '');
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
     * @param waitingRooms
     * @param groupChats
     */
    public static async leaveWaitingRoom(socket:socket, owner: DecodedToken, waitingRooms: WaitingRoomsMap, groupChats: GroupChatsMap) {
        //TODO if owner leaves, delete room
        const room = await CustomGameController.getWaitingRoomByOwner(owner, waitingRooms);
        const groupChat = groupChats.get(room?.ChatUUID || '');
        const user = socket.decoded;
        if(!room || !groupChat) {
            socket.emit('error', {message: 'Room not found'});
            return;
        }
        socket.leave(room.UUID);
        socket.leave(room.ChatUUID);
        room.leave(user.id);
        groupChat.leave(user.id, socket);
        socket.emit('waiting room left', { roomUUID: room.UUID, groupChatUUID: room.ChatUUID });
    }

    /**
     *
     * @param owner
     * @param waitingRooms
     * @private
     */
    private static async getWaitingRoomByOwner(owner: DecodedToken, waitingRooms: WaitingRoomsMap) {
        for await (const [key, value] of waitingRooms.entries()) {
            if (value.Players.some(p => p.id === owner.id)) {
                return value;
            }
        }
        return null;
    }
}
