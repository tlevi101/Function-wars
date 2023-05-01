const express = require('express');
const router = express.Router();
const { User, Friendship, Report, Chat } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');
const { FriendsController } = require('../types/controllers/FriendsController');
const { UsersController } = require('../types/controllers/UsersController');

router.get('/friends', auth, FriendsController.getFriends);

router.get('/friends/online', auth, FriendsController.getOnlineFriends);

router.get('/friends/requests', auth, FriendsController.getFriendRequests);

router.get('/friends/:id/chat', auth, FriendsController.getFriendChat);

router.put('/friends/requests/:id/accept', auth, FriendsController.acceptFriendRequest);

router.delete('/friends/requests/:id/reject', auth, FriendsController.rejectFriendRequest);

router.delete('/friends/:id', auth, FriendsController.deleteFriend);

router.post('/friends/:id', auth, FriendsController.sendFriendRequest);

router.post('/users/:id/report', auth, UsersController.reportUSer);

router.post('/users/:id/block', auth, UsersController.blockUser);

router.delete('/users/:id/unblock', auth, UsersController.unblockUser);

module.exports = router;
