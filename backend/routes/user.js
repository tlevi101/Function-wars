const express = require('express');
const router = express.Router();
const { User, Friendship, Report, Chat } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');

router.get('/friends', auth, async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ where: { email: email } });
    let friends = await user.getFriends();
    friends = await Promise.all(
        friends.map(async friend => {
            const chat = await friend.getChat(user.id);
            let unreadMessages = 0;
            if (chat) {
                unreadMessages = chat.messages.filter(
                    message => message.seen === false && message.from != user.id
                ).length;
            }
            return { name: friend.name, id: friend.id, unreadMessages: unreadMessages };
        })
    );
    res.status(200).json({ friends: friends });
});

router.get('/friends/requests', auth, async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    let requests = await user.getFriendRequests();
    requests = requests.map(request => {
        return { id: request.id, from: { id: request.from.id, name: request.from.name } };
    });
    res.status(200).json({ requests: requests });
});

router.get('/friends/:id/chat', auth, async (req, res) => {
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
        let messages = [];
        chat = await Chat.create({ friendship_id: friendship.id, messages: messages });
    }
    res.status(200).json({ chat: chat });
});

router.put('/friends/requests/:id/accept', auth, async (req, res) => {
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
    res.status(200).json({ message: 'Friendship accepted.' });
});

router.delete('/friends/requests/:id/reject', auth, async (req, res) => {
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
    res.status(200).json({ message: 'Friendship rejected.' });
});

router.delete('/friends/:id', auth, async (req, res) => {
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
    await friendship.destroy();
    res.status(200).json({ message: 'Friendship deleted.' });
});

router.post('/friends/:id', auth, async (req, res) => {
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
    res.status(200).json({ message: 'Friendship request sent.' });
});

router.post('/users/:id/report', auth, async (req, res) => {
    const { name } = req.user;
    const { id } = req.params;
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required.' });
    const user = await User.findOne({ where: { name: name } });
    if (user.id === id) {
        return res.status(403).json({ message: "You can't report yourself." });
    }
    const reportedUser = await User.findByPk(id);
    if (!reportedUser) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const report = await Report.create({
        reported_by: user.id,
        reported: id,
        description: description,
    });
    res.status(200).json({ message: 'Report sent.' });
});

router.post('/users/:id/block', auth, async (req, res) => {
    const { email } = req.user;
    const { id } = req.params;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const blockedUser = await User.findByPk(id);
    if (!blockedUser) {
        return res.status(404).json({ message: 'Blocked user not found.' });
    }
    if (user.id === id) {
        return res.status(403).json({ message: "You can't block yourself." });
    }
    await user.addBlocked(blockedUser);
    res.status(200).json({ message: 'User blocked.' });
});

module.exports = router;
