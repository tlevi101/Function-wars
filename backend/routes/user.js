const express = require('express');
const router = express.Router();
const { User, Friendship, Report, Chat } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');
const { FriendsController } = require('../types/controllers/FriendsController');

router.get('/friends', auth, FriendsController.getFriends);

router.get('/friends/online', auth, FriendsController.getOnlineFriends);

router.get('/friends/requests', auth, FriendsController.getFriendRequests);

router.get('/friends/:id/chat', auth, FriendsController.getFriendChat);

router.put('/friends/requests/:id/accept', auth, FriendsController.acceptFriendRequest);

router.delete('/friends/requests/:id/reject', auth, FriendsController.rejectFriendRequest);

router.delete('/friends/:id', auth, FriendsController.deleteFriend);

router.post('/friends/:id', auth, FriendsController.sendFriendRequest);

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

router.delete('/users/:id/unblock', auth, async (req, res) => {
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
    if (!(await user.hasBlocked(blockedUser))) {
        return res.status(404).json({ message: 'User is not blocked.' });
    }
    await user.removeBlocked(blockedUser);
    res.status(200).json({ message: 'User unblocked.' });
});

module.exports = router;
