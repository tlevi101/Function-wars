import { MyRequest, MyResponse } from './Interfaces';
const { User, Friendship, Report, Chat } = require('../../models');

export class UsersController {
    /**
     * @method POST
     * @route /users/:id/report
     * @param req
     * @param res
     * @returns
     */
    public static async reportUSer(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        const { name } = req.user;
        const id = Number.parseInt(req.params.id);
        const { description } = req.body;
        if (!description) return res.status(400).json({ message: 'Description is required.' });
        const user = await User.findOne({ where: { name: name } });
        if (user.id === id) {
            return res.status(403).json({ message: "You can't report yourself." });
        }
        const reportedUser = await User.findByPk(id);
        if (!reportedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const report = await Report.create({
            reported_by: user.id,
            reported: id,
            description: description,
        });
        res.status(200).json({ message: 'Report sent.' });
    }

    /**
     * @method POST
     * @route /users/:id/block
     * @param req
     * @param res
     * @returns
     */
    public static async blockUser(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        const { email } = req.user;
        const id = Number.parseInt(req.params.id);
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const blockedUser = await User.findByPk(id);
        if (!blockedUser) {
            return res.status(404).json({ message: 'Other user not found.' });
        }
        if (user.id === id) {
            return res.status(403).json({ message: "You can't block yourself." });
        }
        await user.addBlocked(blockedUser);
        res.status(200).json({ message: 'User blocked.' });
    }

    /**
     *
     * @method DELETE
     * @route /users/:id/unblock
     * @param req
     * @param res
     * @returns
     */
    public static async unblockUser(req: MyRequest, res: MyResponse) {
        if (req.user.type === 'guest') return res.status(403).json({ message: 'Guest cannot make this request!' });
        const { email } = req.user;
        const id = Number.parseInt(req.params.id);
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const blockedUser = await User.findByPk(id);
        if (!blockedUser) {
            return res.status(404).json({ message: 'Other user not found.' });
        }
        if (!(await user.hasBlocked(blockedUser))) {
            return res.status(404).json({ message: 'User is not blocked.' });
        }
        await user.removeBlocked(blockedUser);
        res.status(200).json({ message: 'User unblocked.' });
    }
}
