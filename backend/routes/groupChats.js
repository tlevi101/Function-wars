const express = require('express');
const router = express.Router();
const { User, Field } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');
const {GroupChatController} = require("../types/controllers/GroupChatController");

router.post('/:roomUUID/mute/:userID', auth, GroupChatController.muteUser);

router.post('/:roomUUID/unmute/:userID', auth, GroupChatController.unmuteUser);

router.get('/:roomUUID/messages', auth, GroupChatController.getMessages);

router.get('/:roomUUID/users-status', auth, GroupChatController.getUsersStatus);

module.exports = router;