const express = require('express');
const router = express.Router();
const { User, Field } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');
const {CustomGameController} = require("../types/controllers/CustomGameController");

router.get('/custom-games', auth, CustomGameController.getCustomGames);

router.get('/custom-games/:roomUUID', auth, CustomGameController.getWaitingRoom);

module.exports = router;