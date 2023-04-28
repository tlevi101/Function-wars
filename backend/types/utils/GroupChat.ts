import { MessageInterface, MutesInterface, UserInterface } from './interfaces';
import {RuntimeMaps} from "../RuntimeMaps";
const { User } = require('../../models');

export class GroupChat {
    private messages: MessageInterface[] = [];
    private users: UserInterface[] = [];
    private mutes: MutesInterface[] = [];
    private sockets: any[] = [];
    private roomUUID: string = '';
    constructor(roomUUID: string, users: UserInterface[], sockets: any[]) {
        this.roomUUID = roomUUID;
        this.users = users;
        this.sockets = sockets;
        sockets.forEach(s => s.join(roomUUID));
    }

    get Messages(): MessageInterface[] {
        return this.messages;
    }
    get Users(): UserInterface[] {
        return this.users;
    }
    get Sockets(): any[] {
        return this.sockets;
    }
    get chatUUID(): string {
        return this.roomUUID;
    }
    public sendMessage(message: MessageInterface) {
        this.messages.push(message);
        this.sockets.forEach(async s => {
            if(s.decoded.id !== message.from.id && await this.userWantToReceiveMessagesFrom(s.decoded.id, message.from.id) ){
                s.emit('receive group message',
                    message
                );
            }
        });
    }

    public destroy() {
        this.sockets.forEach(s => {
            s.leave(this.roomUUID);
        });
        RuntimeMaps.groupChats.delete(this.roomUUID);
    }

    async getOtherUsersStatusForUser(userID: number | string) {
        const otherUsersID = new Set<UserInterface>();
        await Promise.all(this.messages.filter(m => m.from.id !== userID).map(m => otherUsersID.add(m.from)));
        await Promise.all(this.users.filter(u => u.id !== userID).map(u => otherUsersID.add(u)));
        const otherUsersStatus = await Promise.all(
            Array.from(otherUsersID.values()).map(async u => {
                return {
                    id: u.id,
                    name: u.name,
                    blocked: await this.userBlockedOther(userID, u.id),
                    muted: this.isMuted(userID, u.id),
                    isFriend: await this.usersAreFriends(userID, u.id),
                };
            })
        );
        console.table(otherUsersStatus);
        return otherUsersStatus;
    }

    private updatePlayerSocket(userID: number | string, socket: any) {
        this.sockets = this.sockets.map(s => {
            if (s.decoded.id === userID) {
                s = socket;
            }
            return s;
        });
    }

    public reconnect(userID: number | string, socket: any) {
        this.updatePlayerSocket(userID, socket);
        socket.join(this.roomUUID);
    }

    public join(user: UserInterface, socket: any) {
        if(this.users.find(u => u.id === user.id)){
            this.updatePlayerSocket(user.id, socket);
            return;
        }
        this.sockets.push(socket);
        socket.join(this.roomUUID);
        this.users.push(user);
    }

    public leave(user: UserInterface | number | string, socket: any) {
        this.sockets = this.sockets.filter(s => s.id !== socket.id);
        socket.leave(this.roomUUID);
        if (typeof user === 'number' || typeof user ==='string') {
            this.users = this.users.filter(u => u.id !== user);
            return;
        }
        this.users = this.users.filter(u => u.id !== user.id);
    }

    public muteUser(mutedByID: number | string, mutedUserID: number | string) {
        const mutedBy = this.users.find(u => u.id == mutedByID);
        const mutedUser = this.users.find(u => u.id == mutedUserID);
        if (!mutedBy || !mutedUser) {
            throw new Error('A user is not found');
        }
        this.mutes.push({ mutedBy: mutedBy, mutedUser: mutedUser });
    }
    public unmuteUser(mutedBy: number | string, mutedUser: number | string) {
        this.mutes = this.mutes.filter(m => m.mutedBy.id !== mutedBy && m.mutedUser.id !== mutedUser);
    }
    private isMuted(mutedByID: number | string, mutedUserID: number | string): boolean {
        return this.mutes.some(m => m.mutedBy.id === mutedByID && m.mutedUser.id === mutedUserID);
    }
    private async userBlockedOther(userID: number | string, otherUserID: number | string): Promise<boolean | undefined> {
		if(typeof userID ==='string' || typeof otherUserID ==='string') return undefined
        return (await User.findByPk(userID)).isBlocked(otherUserID);
    }
    public async userCanSendMessage(userID: number): Promise<boolean> {
        return !(await User.findByPk(userID)).chat_restriction;
    }

    public async userWantToReceiveMessagesFrom(userID: number | string, otherUserID: number | string): Promise<boolean> {
        return !this.isMuted(userID, otherUserID) && !(await this.userBlockedOther(userID, otherUserID));
    }
    public getMessagesForUser(userID: number | string): MessageInterface[] {
        return this.messages.filter(
            async m => await this.userWantToReceiveMessagesFrom(userID, m.from.id)
        );
    }

    private async usersAreFriends(user1ID: number | string, user2ID: number | string): Promise<boolean | undefined> {
		if(typeof user1ID ==='string' || typeof user2ID ==='string') return undefined;
        const user1 = await User.findByPk(user1ID);
        return await user1.isFriend(user2ID);
    }

    public userIsInChat(userID: number | string): boolean {
        return this.users.some(u => u.id === userID);
    }
}
