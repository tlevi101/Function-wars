import { socket } from './Interfaces';
import { RuntimeMaps } from '../RuntimeMaps';
import { GameController } from './GameController';
const { Field } = require('../../models');

export class WaitListController {
    //*****************//
    //Route controllers//
    //*****************//

    //******************//
    //Socket controllers//
    //******************//

    /**
     * Joint to the wait list
     */
    public static async joinWaitList(socket: socket) {
        const adminFieldCount = await Field.count({
            where: { is_admin_field: true, deletedAt: null },
        });
        if (adminFieldCount === 0) {
            socket.emit('error', { message: 'There is no playable field at the moment!', code: 404 });
        }

        socket.join('wait-list');
        RuntimeMaps.waitList.set(socket.decoded.id, socket);
        console.log(`User (${socket.decoded.name}) joined wait list`);
        if (RuntimeMaps.waitList.size >= 4) {
            await WaitListController.createGame(4);
        }
        if (RuntimeMaps.waitList.size >= 3) {
            await WaitListController.createGame(3);
        }
        if (RuntimeMaps.waitList.size >= 2) {
            await WaitListController.createGame(2);
        }
    }

    public static leaveWaitList(socket: socket) {
        socket.leave('wait-list');
        console.log(`User (${socket.decoded.name}) left wait list`);
        RuntimeMaps.waitList.delete(socket.decoded.id);
    }

    private static async createGame(size: number) {
        const sockets = Array.from(RuntimeMaps.waitList.values()).slice(0, size);
        await Promise.all(
            sockets.map(socket => {
                WaitListController.leaveWaitList(socket);
            })
        );
        await GameController.createGame(sockets);
    }
}
