import {MyRequest, MyResponse} from "./Interfaces";
import {Op} from "sequelize";
const {User, Chat, Friendship} = require("../../models");


export class FriendsController {

    /**
     * @method get
     * @route '/friends'
     * @param req
     * @param res
     */
    public static async getFriends(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const friends = await FriendsController.getUserFriends(req.user.id);
        return res.status(200).json({ friends: friends });
    }

    /**
     * @method get
     * @route /friends/online
     * @param req
     * @param res
     */
    public static async getOnlineFriends(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        let friends = await FriendsController.getUserFriends(req.user.id);
        friends = friends.filter((friend:any) => !!req.onlineUsers.get(friend.id));
        return res.status(200).json({ friends: friends });
    }

    /**
     * @method get
     * @route /friends/requests
     * @param req
     * @param res
     */
    public static async getFriendRequests(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        let requests = await user.getFriendRequests();
        requests = requests.map((request:any) => {
            return { id: request.id, from: { id: request.from.id, name: request.from.name } };
        });
        return res.status(200).json({ requests: requests });
    }

    /**
     * @method get
     * @route /friends/:id/chat
     * @param req
     * @param res
     */
    public static async getFriendChat(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const { id } = req.params;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const friend = await User.findOne({ where: { id: id } });
        if (!friend) {
            return res.status(404).json({ message: 'Friend not found.' });
        }
        const friendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { user_id: user.id, friend_id: friend.id },
                    { user_id: friend.id, friend_id: user.id },
                ],
                pending: false,
            },
        });
        if (!friendship) {
            return res.status(404).json({ message: 'Friendship not found.' });
        }
        let chat = await user.getChat(friend.id);
        if (!chat) {
            let messages:any[] = [];
            chat = await Chat.create({ friendship_id: friendship.id, messages: messages });
        }
        return res.status(200).json({ chat: chat });
    }

    /**
     * @method put
     * @route /friends/requests/:id/accept
     * @param req
     * @param res
     */
    public static async acceptFriendRequest(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const { id } = req.params;
        console.log(email);
        console.log(id);
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const friendship = await Friendship.findOne({
            where: {
                id: id,
            },
        });
        if (!friendship) {
            return res.status(404).json({ message: 'Friendship request not found.' });
        }
        if (friendship.friend_id !== user.id) {
            return res.status(403).json({
                message: 'You are not the recipient of this friendship request.',
            });
        }
        await friendship.update({ pending: false });
        return res.status(200).json({ message: 'Friendship accepted.' });
    }

    /**
     * @method delete
     * @route /friends/requests/:id/reject
     * @param req
     * @param res
     */
    public static async rejectFriendRequest(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const { id } = req.params;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const friendship = await Friendship.findOne({
            where: {
                id: id,
            },
        });
        if (!friendship) {
            return res.status(404).json({ message: 'Friendship request not found.' });
        }
        if (friendship.friend_id !== user.id) {
            return res.status(403).json({
                message: 'You are not the recipient of this friendship request.',
            });
        }
        await friendship.destroy();
        return res.status(200).json({ message: 'Friendship rejected.' });
    }

    /**
     * @method delete
     * @route /friends/:id
     * @param req
     * @param res
     */
    public static async deleteFriend(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const userJWT = req.user;
        const user = await User.findOne({ where: { email: userJWT.email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { id } = req.params;
        const friendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { friend_id: id, user_id: user.id },
                    { friend_id: user.id, user_id: id },
                ],
            },
        });
        if (!friendship) {
            return res.status(404).json({ message: 'Friendship not found.' });
        }
        if (friendship.pending) {
            return res.status(403).json({ message: "You can't delete a pending friendship." });
        }
        if (friendship.friend_id !== user.id && friendship.user_id !== user.id) {
            return res.status(403).json({
                message: 'You are not the recipient of this friendship request.',
            });
        }
        const chat = await friendship.getChat();
        if (chat) {
            await Chat.destroy({
                where: {
                    id: chat.id,
                },
            });
        }
        await Friendship.destroy({
            where: {
                id: friendship.id,
            },
        });
        return res.status(200).json({ message: 'Friend deleted.' });
    }

    /**
     * @method post
     * @route /friends/:id
     * @param req
     * @param res
     */
    public static async sendFriendRequest(req: MyRequest, res: MyResponse) {
        const { name } = req.user;
        const { id } = req.params;
        const user = await User.findOne({ where: { name: name } });
        if (user.id === id) {
            return res.status(403).json({ message: "You can't add yourself as a friend." });
        }
        const friendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { friend_id: id, user_id: user.id },
                    { friend_id: user.id, user_id: id },
                ],
            },
        });
        if (friendship) {
            return res.status(403).json({ message: 'Friendship already exists.' });
        }
        const newFriendship = await Friendship.create({
            user_id: user.id,
            friend_id: id,
            pending: true,
        });
        return res.status(200).json({ message: 'Friendship request sent.' });
    }



    private static async getUserFriends(userID:number){
        const user = await User.findByPk(userID);
        let friends = await user.getFriends();
        friends = await Promise.all(
            friends.map(async (friend:any) => {
                const chat = await friend.getChat(user.id);
                let unreadMessages = 0;
                if (chat) {
                    unreadMessages = chat.messages.filter(
                        (message:any) => message.seen === false && message.from != user.id
                    ).length;
                }
                return { name: friend.name, id: friend.id, unreadMessages: unreadMessages };
            })
        );
        return friends.sort((a:any, b:any) => {
            if (a.unreadMessages > b.unreadMessages) {
                return -1;
            }
            if (a.unreadMessages < b.unreadMessages) {
                return 1;
            }
            return 0;
        });
    }
}