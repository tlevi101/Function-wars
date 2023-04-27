const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { AdminController } = require('../types/controllers/AdminController');
const { ReportController } = require('../types/controllers/ReportController');

router.get('/admins', auth, AdminController.getAdmins);

router.get('/users', auth, AdminController.getUsers);

router.get('/reports', auth, ReportController.getReports);

router.delete('/reports/:id', auth, ReportController.deleteReport);

router.put('/users/:id/ban', auth, AdminController.banUser);

router.put('/users/:id/unban', auth, AdminController.unbanUser);

router.put('/users/:userID/make-admin', auth, AdminController.makeAdmin);

router.put('/users/:userID/remove-admin', auth, AdminController.removeAdmin);

router.put('/users/:id/add-remove-chat-restriction', auth, AdminController.addOrRemoveChatRestriction);

module.exports = router;
