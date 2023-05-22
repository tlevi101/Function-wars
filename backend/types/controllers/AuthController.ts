import { MyRequest, MyResponse, DecodedUser, GuestUser } from './Interfaces';
const { v4: uuidv4 } = require('uuid');
const jsonwebtoken = require('jsonwebtoken');
const { User, PasswordReset } = require('../../models');
const { Sequelize } = require('sequelize');
const forgotPasswordMailer = require('../../mail/forgotPasswordMail');

export class AuthController {
    /**
     * @method post
     * @route /register-guest
     * @param req
     * @param res
     * @returns
     */
    public static async registerAsGuest(req: MyRequest, res: MyResponse) {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (name.length > 20 || name.length < 3)
            return res.status(400).json({ message: 'Name is must be between 3 and 20 characters long' });
        const token = jsonwebtoken.sign(
            { type: 'guest', name: `Guest: ${name}`, guest: true, JWT_createdAt: new Date(), id: uuidv4() },
            process.env.JWT_SECRET,
            {
                algorithm: process.env.JWT_ALGO,
            }
        );
        return res.status(201).json({ message: 'Guest accepted', jwt: token });
    }

    /**
     * @method post
     * @route /register
     * @param req
     * @param res
     * @returns
     */
    public static async register(req: MyRequest, res: MyResponse) {
        const { name, email, password, passwordAgain } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        if (!passwordAgain) {
            return res.status(400).json({ message: 'Password confirmation is required (passwordAgain)' });
        }
        if (password !== passwordAgain) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        const user = await User.create({ name, email, password });
        const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET, {
            algorithm: process.env.JWT_ALGO,
        });
        return res.status(201).json({ message: 'User created', jwt: token });
    }

    /**
     * @method post
     * @route /login
     * @param req
     * @param res
     * @returns
     */
    public static async login(req: MyRequest, res: MyResponse) {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).send({ message: 'Email required' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).send({ message: 'Incorrect email' });
        }
        if (user.banned) {
            return res.status(403).send({ message: 'User banned', banned_reason: user.banned_reason });
        }
        if (!password) {
            return res.status(400).send({ message: 'Password required' });
        }
        if (!user.comparePassword(password)) {
            return res.status(400).send({ message: 'Incorrect password' });
        }
        const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET, {
            algorithm: process.env.JWT_ALGO,
        });
        return res.status(200).send({ message: 'Login successful', jwt: token });
    }

    /**
     * @method post
     * @route /forgot-password
     * @param req
     * @param res
     * @returns
     */
    public static async forgotPassword(req: MyRequest, res: MyResponse) {
        const { email } = req.body;
        if (!email) {
            return res.status(400).send({ message: 'Email required' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).send({ message: 'Incorrect email' });
        }
        if (user.banned) {
            return res.status(403).send({ message: 'User banned', banned_reason: user.banned_reason });
        }
        await user.createPasswordReset().catch(async (err: any) => {
            if (err instanceof Sequelize.UniqueConstraintError) {
                let passwordReset = await user.getPasswordReset();
                await passwordReset.destroy();
                await user.createPasswordReset();
            }
        });
        const passwordReset = await user.getPasswordReset();
        if (process.env.NODE_ENV === 'test') {
            return res.status(201).send({ message: 'Email sent', uuid: passwordReset.uuid });
        } else {
            forgotPasswordMailer(user, req.header('Referer') + passwordReset.link);
            return res.status(201).send({ message: 'Email sent' });
        }
    }

    /**
     * @method put
     * @route /reset-password/:uuid
     * @param req
     * @param res
     * @returns
     */
    public static async resetPassword(req: MyRequest, res: MyResponse) {
        const { uuid } = req.params;
        console.log(uuid);
        const passwordReset = await PasswordReset.findOne({
            where: { uuid: uuid },
        });
        if (!passwordReset) {
            return res.status(404).send({ message: 'Incorrect link' });
        }
        if (passwordReset.createdAt < new Date(Date.now() - 3600000)) {
            await passwordReset.destroy();
            return res.status(400).send({ message: 'Link expired' });
        }
        const { password, passwordAgain } = req.body;
        if (!password) {
            return res.status(400).send({ message: 'Password required' });
        }
        if (!passwordAgain) {
            return res.status(400).send({ message: 'Password confirmation required (passwordAgain)' });
        }
        if (password !== passwordAgain) {
            return res.status(400).send({ message: 'Passwords do not match' });
        }
        const user = await passwordReset.getUser();
        await user.update({ password });
        await passwordReset.destroy();
        return res.status(200).send({ message: 'Password updated' });
    }

    /**
     * @method get
     * @route /update-token
     * @param req
     * @param res
     * @returns
     */
    public static async updateToken(req: MyRequest, res: MyResponse) {
        const decoded = req.user;
        if (decoded.type === 'guest') {
            return res.status(403).send({ message: 'Guest cannot make this request!' });
        }
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET, {
            algorithm: process.env.JWT_ALGO,
        });
        return res.status(200).json({ message: 'Token updated', jwt: token });
    }
}
