const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const chalk = require('chalk');
const { GameController } = require('../types/controllers/GameController');

router.post('/:gameUUID/function', auth, GameController.functionSubmitRequest);

router.get('/:gameUUID', auth, GameController.getGameRequest);

module.exports = router;
