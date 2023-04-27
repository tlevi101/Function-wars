const express = require('express');
const router = express.Router();
const { User, Report } = require('../../models');
const auth = require('../../middlewares/auth');
const { Op } = require('sequelize');

const setHandledTrue = async user_id => {
    const report = await Report.findOne({ where: { reported: user_id, handled: false } });
    if (report) {
        await report.update({
            where: {
                reported: user_id,
            },
            handled: true,
        });
    }
};

router.put('/:id/ban', auth, );

router.put('/:id/unban', auth );

router.put('/make-admin/userID', auth, );

router.put('/remove-admin/userID', auth, );

router.put('/:id/add-remove-chat-restriction', auth, );

module.exports = router;
