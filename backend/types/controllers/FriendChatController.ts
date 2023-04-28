import {socket} from "./Interfaces";
const {User, Chat} =  require("../../models");
import {RuntimeMaps} from "../RuntimeMaps";

export class FriendChatController {
    //*****************//
    //Route controllers//
    //*****************//

    //******************//
    //Socket controllers//
    //******************//


    public static async sendMessage(socket: socket,message: string, friendID: number) {
		if(socket.decoded.type === 'guest'){
			socket.emit('error', 'Guests cannot send messages.');
		}
        const user = await User.findByPk(socket.decoded.id);
        let chat = await user.getChat(friendID);
        if (!chat) {
            const friendship = await user.getFriendShip(friendID);
            if (!friendship) {
                console.error('Message not sent. Friendship not found.');
                return;
            }
            let newMessages = [];
            newMessages.push({from: user.id, message: message, seen: false});
            chat = await Chat.create({friendship_id: friendship.id, messages: newMessages});
        }
        chat.messages.push({from: user.id, message: message, seen: false});
        await Chat.update({messages: chat.messages}, {where: {id: chat.id}});
        const friendSocket = RuntimeMaps.onlineUsers.get(friendID);
        if (friendSocket) {
            console.log('Friend is online.');
            socket
                .to(friendSocket.socketID)
                .emit('receive message', {from: user.id, message: message, seen: false});
        } else {
            console.log('Friend is offline.');
        }
    }

    public static async setSeen(socket: socket, friendID: number) {
		if(socket.decoded.type === 'guest'){
			socket.emit('error', 'Guests cannot send messages.');
		}
        const user = await User.findByPk(socket.decoded.id);
        const chat = await user.getChat(friendID);
        if (!chat) {
            console.error('Chat not found.');
            return;
        }
        chat.messages.forEach((m:any) => {
            if (m.from !== user.id) {
                m.seen = true;
            }
        });
        await Chat.update({messages: chat.messages}, {where: {id: chat.id}});
    }

}
