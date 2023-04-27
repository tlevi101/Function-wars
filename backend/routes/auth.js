const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { AuthController } = require('../types/controllers/AuthController');

router.post('/register-guest', AuthController.registerAsGuest);

router.post('/register', AuthController.register);

router.post('/login', AuthController.login);

router.post('/forgot-password', AuthController.forgotPassword);

router.put('/reset-password/:uuid', AuthController.resetPassword);

router.get('/update-token', auth, AuthController.updateToken);

module.exports = router;
