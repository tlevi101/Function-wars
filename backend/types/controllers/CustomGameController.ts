import { DecodedToken, MyRequest, MyResponse, socket } from './Interfaces';
import { WaitingRoom } from '../utils/WaitingRoom';
import { GroupChat } from '../utils/GroupChat';
import { RuntimeMaps } from '../RuntimeMaps';
import { GroupChatController } from './GroupChatController';
import { GameController } from './GameController';
import chalk = require('chalk');
const { User } = require('../../models');
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
        return res.status(200).json({ customGames: WaitingRoom.toFrontendAll(waitingRooms) });
    }

    /**
     * @route GET /wait-rooms/:roomUUID
     * @param req
     * @param res
     */
    public static async getWaitingRoom(req: MyRequest, res: MyResponse) {
        const { roomUUID } = req.params;
        console.debug(`Getting waiting room ${roomUUID}`);
        const room = req.waitingRooms.get(roomUUID || '');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        return res.status(200).json({ waitRoom: room.toFrontend() });
    }

    /**
     * @method POST
     * @route /wait-rooms/:roomUUID/:userID/kick
     * @param req
     * @param res
     */
    public static async kickPlayer(req: MyRequest, res: MyResponse) {
        const { roomUUID, userID } = req.params;
        const { user } = req;
        if (user.type === 'guest') {
            return res.status(403).json({ message: 'Guest cannot make this request!' });
        }
        const room = req.waitingRooms.get(roomUUID);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        if (!room.isOwner(user.id)) {
            return res.status(403).json({ message: 'You are not the owner of this room' });
        }
        if (!room.userIsInRoom(userID)) {
            console.debug(`User ${userID} not in room`);
            return res.status(404).json({ message: 'User not in room' });
        }
        room.kickPlayer(userID);
        return res.status(200).json({ message: 'Player kicked' });
    }

    //******************//
    //Socket controllers//
    //******************//

    /**
     * @event create custom game
     * @param socket: socket
     * @param fieldID: number
     * @param isPrivate: boolean
     * @param friendIDs: number[]
     */
    public static async createCustomGame(socket: socket, fieldID: any, isPrivate: boolean, friendIDs?: number[]) {
        console.debug(friendIDs);
        console.debug(`User (${socket.decoded.name}) created a custom game.`);
        console.debug(`Field ID: ${fieldID}, type: ${typeof fieldID}`);
        fieldID = parseInt(fieldID);
        if (!Number.isInteger(fieldID)) {
            socket.emit('error', { message: 'Field is required', code: 400 });
            return;
        }
        const room = await new Promise<WaitingRoom>(resolve => {
            resolve(new WaitingRoom(socket.decoded, fieldID, socket, isPrivate));
        });
        RuntimeMaps.waitingRooms.set(room.UUID, room);
        RuntimeMaps.groupChats.set(
            room.ChatUUID,
            new GroupChat(room.ChatUUID, room.playersToUserInterface(), room.Sockets)
        );
        if (friendIDs) {
            await CustomGameController.sendInvites(socket, friendIDs);
        }
        socket.emit('waiting room created', { roomUUID: room.UUID, groupChatUUID: room.ChatUUID });
        console.debug(chalk.red('waiting room created'));
    }

    /**
     * @event join waiting room
     * @param socket: socket
     * @param roomUUID: string
     */
    public static async joinWaitingRoom(socket: socket, roomUUID: string) {
        const room = RuntimeMaps.waitingRooms.get(roomUUID);
        const user = socket.decoded;
        if (!room) {
            socket.emit('error', { message: 'Custom game not found.', code: 404 });
            console.debug('Custom game not found.');
            return;
        }
        if (room.userIsInRoom(user.id)) {
            socket.emit('waiting room joined');
            return;
        }
        if (room.isFull()) {
            socket.emit('error', { message: 'Custom game is full', code: 403 });
            console.debug('Custom game is full');
            return;
        }
        if (room.isPrivate && room.userIsNotInvited(user.id)) {
            socket.emit('error', { message: 'You are not invited!', code: 404 });
        }
        socket.join(room.UUID);
        room.join(user, socket);
        await GroupChatController.joinGroupChat(socket, room.ChatUUID);
        socket.to(room.UUID).emit('user joined waiting room');
        socket.emit('waiting room joined');
    }

    /**
     * @event leave waiting room
     * @param socket
     * @param owner
     */
    public static async leaveWaitingRoom(socket: socket) {
        const room = await CustomGameController.getWaitingRoomByUser(socket.decoded);
        const groupChat = RuntimeMaps.groupChats.get(room?.ChatUUID || '');
        const user = socket.decoded;
        if (!room) {
            console.error(`Room not found`);
            return;
        }
        socket.to(room.UUID).emit('user left wait room');
        room.leave(user.id);
        GroupChatController.leaveGroupChat(socket);
    }

    public static async ownerLeft(socket: socket) {
        const room = await this.getWaitingRoomByOwner(socket.decoded);
        const groupChat = RuntimeMaps.groupChats.get(room?.ChatUUID || '');
        if (!room) {
            return;
        }

        return !room.ownerIsOnline;
    }

    public static async deleteWaitingRoom(socket: socket) {
        const room = await this.getWaitingRoomByOwner(socket.decoded);
        if (!room) {
            console.error(`Wait room for user ${socket.decoded.name} not found`);
            return;
        }
        console.log(`Wait room (${room.UUID} deleted`);
        socket.to(room.UUID).emit('wait room owner left');
        room.destroy();

        await GroupChatController.deleteGroupChatByUUID(room.ChatUUID);
    }

    public static async startGame(socket: socket) {
        const room = await this.getWaitingRoomByOwner(socket.decoded);
        if (!room) {
            console.error(`Wait room for user ${socket.decoded.name} not found`);
            return;
        }
        await GameController.createGame(room.Sockets, room.FieldID);
    }

    private static async findWaitingRoom(where: (waitRoom: WaitingRoom) => boolean): Promise<WaitingRoom | null> {
        for await (const [key, waitRoom] of RuntimeMaps.waitingRooms.entries()) {
            if (where(waitRoom)) {
                return waitRoom;
            }
        }

        return null;
    }

    public static async getWaitingRoomByUser(user: DecodedToken) {
        return await CustomGameController.findWaitingRoom(room => room.userIsInRoom(user.id));
    }

    public static async getWaitingRoomByOwner(user: DecodedToken) {
        if (user.type === 'guest') return;

        return await CustomGameController.findWaitingRoom(room => room.isOwner(user.id));
    }

    private static async sendInvites(socket: socket, friendIDs: number[]) {
        const user = await User.findOne({ where: { id: socket.decoded.id } });
        const room = await this.getWaitingRoomByOwner(socket.decoded);

        if (!room) {
            console.error(`Wait room for user ${socket.decoded.name} not found`);
            return;
        }

        if (!user) {
            console.error(`User ${socket.decoded.name} not found`);
            return;
        }

        friendIDs.forEach(friendID => {
            if (user.isFriend(friendID)) {
                const friendSocket = RuntimeMaps.onlineUsers.get(friendID)?.socketID;
                if (friendSocket) {
                    RuntimeMaps.invites.add({ inviterID: user.id, invitedID: friendID });
                    socket
                        .to(friendSocket)
                        .emit('receive invite', { inviter: socket.decoded, customGameUUID: room.UUID });
                }
            }
        });
    }
}
