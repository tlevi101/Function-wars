const { Friendship, User, Chat, Field } = require('../models');
const { Op } = require('sequelize');
const express = require('express');
const auth = require('../middlewares/auth');
const groupChatRouter = express.Router();

groupChatRouter.get('/:roomUUID', auth, async (req, res) => {
    const { roomUUID } = req.params;
    const { user } = req;
});