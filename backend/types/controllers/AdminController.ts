import { RuntimeMaps } from '../RuntimeMaps';
import { GameController } from './GameController';
import { MyRequest, MyResponse } from './Interfaces';
import { ReportController } from './ReportController';
const { User } = require('../../models');
const { Op } = require('sequelize');

export class AdminController {



    /**
     * @method get
     * @route /admins
     * @param req
     * @param res
     */
    public static async getAdmins(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'You are not an admin.' });
        }
        return res.status(200).json({ admins: await User.findAll({ where: { is_admin: true } }) });
    }



    /**
     * @method get
     * @route /users
     * @param req
     * @param res
     */
    public static async getUsers(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'You are not an admin.' });
        }
        return res.status(200).json({ users: await User.findAll({ where: { is_admin: false } }) });
    }




    /**
     * @method put
     * @route /users/:id/ban
     * @param req
     * @param res
     */
    public static async banUser(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
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
        await ReportController.markUserReportsAsHandled(user.id);
        const socketID = RuntimeMaps.onlineUsers.get(user.id)?.socketID;
        if (socketID) {
            res.io.to(socketID).emit('banned', { message: 'You have been banned.' });
            GameController.userBanned(user.id);
        }
        return res.status(200).send({ message: 'User banned.' });
    }




    /**
     * @method put
     * @route /users/:id/unban
     * @param req
     * @param res
     */
    public static async unbanUser(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
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
        return res.status(200).send({ message: 'User unbanned.' });
    }




    /**
     * @method put
     * @route /users/:userID/make-admin
     * @param req
     * @param res
     */
    public static async makeAdmin(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
        const { userID } = req.params;
        const users = await User.findByPk(userID);
        if (!users) {
            return res.status(404).send({ message: 'Users not found.' });
        }
        if (users.role === 'super_admin') {
            return res.status(403).send({ message: 'You cannot change super admin.' });
        }
        await users.update({ is_admin: true, role: 'admin' });
        return res.status(200).send({ message: 'User is now admin.' });
    }




    /**
     * @method put
     * @route /users/:userID/remove-admin
     * @param req
     * @param res
     */
    public static async removeAdmin(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
        const { userID } = req.params;
        const users = await User.findByPk(userID);
        if (!users) {
            return res.status(404).send({ message: 'Users not found.' });
        }
        if (users.role === 'super_admin') {
            return res.status(403).send({ message: 'You cannot change super admin.' });
        }
        await users.update({ is_admin: false, role: 'user' });
        return res.status(200).send({ message: "User isn't an admin anymore." });
    }



	
    /**
     * @method put
     * @route /users/:id/add-remove-chat-restriction
     * @param req
     * @param res
     */
    public static async addOrRemoveChatRestriction(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }
        if (user.chat_restriction) await user.update({ chat_restriction: false });
        else {
            await user.update({ chat_restriction: true });
        }
        await ReportController.markUserReportsAsHandled(user.id);
        res.status(200).send({ message: 'User is now chat restricted.' });
    }
}
