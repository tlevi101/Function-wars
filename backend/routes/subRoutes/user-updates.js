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

router.put('/:id/ban', auth, async (req, res) => {
    if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
    const { id } = req.params;
    const { banned_reason } = req.body;
    const user = await User.findOne({
        where: {
            id: id,
        },
    });
    if (!user) {
        return res.status(404).send({ message: 'User not found.' });
    }
    await user.update({ banned: true, banned_reason: banned_reason });
    setHandledTrue(user.id);
    res.status(200).send({ message: 'User banned.' });
});

router.put('/:id/unban', auth, async (req, res) => {
    if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
    const { id } = req.params;
    const user = await User.findOne({
        where: {
            id: id,
        },
    });
    if (!user) {
        return res.status(404).send({ message: 'User not found.' });
    }
    await user.update({ banned: false, banned_reason: null });
    res.status(200).send({ message: 'User unbanned.' });
});

router.put('/make-admin', auth, async (req, res) => {
    if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
    const { user_ids } = req.body;
    if (!user_ids || Array.isArray(user_ids)) {
        return res.status(400).send({ message: 'No user_ids provided or user_ids is not an array.' });
    }
    const users = await User.findAll({
        where: {
            id: {
                [Op.in]: user_ids,
            },
        },
    });
    if (!users) {
        return res.status(404).send({ message: 'Users not found.' });
    }
    let triedToChangeSuperAdmin = false;
    for (let user of users) {
        if (user.role === 'super_admin') {
            triedToChangeSuperAdmin = true;
            continue;
        }
        if (user.is_admin) continue;
        await user.update({ is_admin: true, role: 'admin' });
    }
    res.status(200).send({ message: 'Users are now admins.', triedToChangeSuperAdmin });
});

router.put('/remove-admin', auth, async (req, res) => {
    if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
    const { user_ids } = req.body;
    if (!user_ids || Array.isArray(user_ids)) {
        return res.status(400).send({ message: 'No user_ids provided or user_ids is not an array.' });
    }
    const users = await User.findAll({
        where: {
            id: {
                [Op.in]: user_ids,
            },
        },
    });
    if (!users) {
        return res.status(404).send({ message: 'Users not found.' });
    }
    let triedToChangeSuperAdmin = false;
    for (let user of users) {
        if (user.role === 'super_admin') {
            triedToChangeSuperAdmin = true;
            continue;
        }
        if (!user.is_admin) continue;
        await user.update({ is_admin: false });
    }
    res.status(200).send({ message: 'Users are no longer admins.', triedToChangeSuperAdmin });
});

router.put('/:id/add-remove-chat-restriction', auth, async (req, res) => {
    if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
        return res.status(404).send({ message: 'User not found.' });
    }
    if (user.chat_restriction) await user.update({ chat_restriction: false });
    else {
        await user.update({ chat_restriction: true });
        setHandledTrue(user.id);
    }
    res.status(200).send({ message: 'User is now chat restricted.' });
});

module.exports = router;
