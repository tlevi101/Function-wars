import {UserInterface} from "../utils/interfaces";
import {MyRequest, MyResponse, socket} from "./Interfaces";
const chalk = require('chalk');
import {RuntimeMaps} from "../RuntimeMaps";
import {GroupChat} from "../utils/GroupChat";


export class GroupChatController{
    //*****************//
    //Route controllers//
    //*****************//

    /**
     * @method POST
     * @route /group-chats/:roomUUID/mute/:userID
     * @param req
     * @param res
     */
    public static async muteUser(req: MyRequest, res: MyResponse){
        const {roomUUID, userID} = req.params;
        const { user } = req;
        const groupChat = RuntimeMaps.groupChats.get(roomUUID);
        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found.' });
        }
        if (!groupChat.userIsInChat(user.id)) {
            return res.status(403).json({ message: 'You are not in this group chat.' });
        }
        if(Number.isNaN(parseInt(userID))){
            return res.status(400).json({ message: 'Invalid user ID.' });
        }
        if (!groupChat.userIsInChat(parseInt(userID))) {
            return res.status(404).json({ message: 'User not found.' });
        }
        try {
            groupChat.muteUser(user.id, parseInt(userID));

        }catch (e:any) {
            return res.status(400).json({ message: e.message });
        }
        return res.status(200).json({ message: 'User muted.' });
    }

    /**
     * @method POST
     * @route /group-chats/:roomUUID/unmute/:userID
     * @param req
     * @param res
     */
    public static async unmuteUser(req: MyRequest, res: MyResponse){
        const { roomUUID, userID } = req.params;
        const { user } = req;
        const groupChat = RuntimeMaps.groupChats.get(roomUUID);
        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found.' });
        }
        if (!groupChat.userIsInChat(user.id)) {
            return res.status(403).json({ message: 'You are not in this group chat.' });
        }
        if (!groupChat.userIsInChat(parseInt(userID))) {
            return res.status(404).json({ message: 'User not found.' });
        }
        try {
            groupChat.unmuteUser(user.id, parseInt(userID));
        } catch (e:any) {
            return res.status(400).json({ message: e.message });
        }
        return res.status(200).json({ message: 'User unmuted.' });
    }

    /**
     * @method GET
     * @route /group-chats/:roomUUID/messages
     */
    public static async getMessages(req: MyRequest, res: MyResponse){
        const { roomUUID } = req.params;
        const { user } = req;
        const groupChat = req.groupChats.get(roomUUID);
        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found.' });
        }
        if (!groupChat.userIsInChat(user.id)) {
            return res.status(403).json({ message: 'You are not in this group chat.' });
        }
        //TODO reconnect user here if they are not connected
        return res.status(200).json({ messages: groupChat.getMessagesForUser(user.id) });
    }

    /**
     * @method GET
     * @route /group-chats/:roomUUID/users-status
     */
    public static async getUsersStatus(req: MyRequest, res: MyResponse){
        const { roomUUID } = req.params;
        const { user } = req;
        const groupChat = RuntimeMaps.groupChats.get(roomUUID);
        if (!groupChat) {
            return res.status(404).json({ message: 'Group chat not found.' });
        }
        console.debug(!groupChat.userIsInChat(user.id));
        if (!groupChat.userIsInChat(user.id)) {
            return res.status(403).json({ message: 'You are not in this group chat.' });
        }
        return res.status(200).json({ users: await groupChat.getOtherUsersStatusForUser(user.id) });
    }


    //******************//
    //Socket controllers//
    //******************//

    /**
     * Create a group chat with the given sockets and users + roomUUID, and place sockets in the room
     * @param sockets
     * @param users
     * @param roomUUID
     */
    public static async createGroupChat(sockets: socket[], users: UserInterface[], roomUUID: string){
        console.log(chalk.green('group chat created, uuid: chat-' + roomUUID));
        RuntimeMaps.groupChats.set('chat-' + roomUUID, new GroupChat('chat-' + roomUUID, users, sockets));
        sockets.forEach(s => {
            s.join('chat-' + roomUUID);
        });
    }

    public static async leaveGroupChat(socket: socket){
        const groupChat = await GroupChatController.getGroupChatByUser(socket.decoded.id);
        if(groupChat){
            groupChat.leave(socket.decoded.id, socket);
            if(groupChat.Users.length === 0){
                groupChat.destroy();
            }
        }
    }

    public static async deleteGameGroupChat(gameChatUUID: string){
        const groupChat = RuntimeMaps.groupChats.get(gameChatUUID);
        if(groupChat){
            groupChat.destroy();
        }
    }

    public static async joinGroupChat(socket: socket, roomUUID: string){
        console.log(`User (${socket.decoded.name}) joined group chat ${roomUUID}`);
        const groupChat = RuntimeMaps.groupChats.get(roomUUID);
        if(groupChat){
            groupChat.join(socket.decoded, socket);
        }
    }

    public static async sendMessage(socket: socket, message: string){
        const groupChat = await GroupChatController.getGroupChatByUser(socket.decoded.id);
        if (!groupChat) {
            console.debug('chat not found');
            return;
        }
        if(!await groupChat.userCanSendMessage(socket.decoded.id)){
            console.debug('user cannot send message');
            return;
        }
        groupChat.sendMessage({from:{id: socket.decoded.id, name: socket.decoded.name}, message: message});
    }

    public static async getGroupChatByUser(userID:number) {
        for await (const groupChat of RuntimeMaps.groupChats.values()) {
            if (groupChat.Users.find(user => user.id === userID)) {
                return groupChat;
            }
        }
        return null;
    }


}