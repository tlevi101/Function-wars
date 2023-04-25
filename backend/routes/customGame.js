const express = require('express');
const router = express.Router();
const { User, Field } = require('../models');
const auth = require('../middlewares/auth');
const { Op } = require('sequelize');
const {CustomGameController} = require("../types/controllers/CustomGameController");

router.get('/custom-games', auth, CustomGameController.getCustomGames);

router.get('/wait-rooms/:roomUUID', auth, CustomGameController.getWaitingRoom);
//TODO kick user from waiting room
module.exports = router;