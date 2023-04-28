import { MyRequest, MyResponse } from './Interfaces';
const { User, Field } = require('../../models');
const Joi = require('joi');
const { Op } = require('sequelize');
export class FieldsController {
    /**
     * @method get
     * @route /fields
     * @param req
     * @param res
     */
    public static async getFields(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.is_admin) {
            const fields = await Field.findAll({
                where: { is_admin_field: true },
                attributes: { exclude: ['field'] },
                order: [
                    ['deletedAt', 'ASC'],
                    ['updatedAt', 'DESC'],
                ],
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            });
            return res.status(200).json({ fields: fields });
        }
        const fields = await user.getFields({
            attributes: { exclude: ['field'] },
            order: [
                ['deletedAt', 'ASC'],
                ['updatedAt', 'DESC'],
            ],
        });
        return res.status(200).json({ fields: fields });
    }

    /**
     * @method get
     * @route /fields/:id
     * @param req
     * @param res
     */
    public static async getField(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { id } = req.params;
        const field = await Field.findOne({ where: { id: id } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found.' });
        }
        if ((field.is_admin_field && !user.is_admin) || (!field.is_admin_field && field.user_id != user.id)) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        return res.status(200).json({ field: field });
    }

    /**
     * @method get
     * @route /fields/:id/show
     * @param req
     * @param res
     */
    public static async showFieldForAnyone(req: MyRequest, res: MyResponse) {
        const { id } = req.params;
        const field = await Field.findOne({ where: { id: id } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found.' });
        }
        return res.status(200).json({ field: field });
    }

    /**
     * @method post
     * @route /fields
     * @param req
     * @param res
     */
    public static async createField(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const validated = FieldsController.validateField(req.body);
        if (validated.error) {
            return res.status(400).json({ message: 'Invalid field.', detail: validated.error.details });
        }
        const field = await Field.create({
            name: validated.value.name,
            field: validated.value.field,
            user_id: user.id,
            is_admin_field: user.is_admin,
        });
        return res.status(201).json({ field: field });
    }

    /**
     * @method put
     * @route /fields/:id
     * @param req
     * @param res
     */
    public static async updateField(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { id } = req.params;
        const field = await Field.findOne({ where: { id: id } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found.' });
        }
        if ((field.is_admin_field && !user.is_admin) || (!field.is_admin_field && field.user_id != user.id)) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        const validated = FieldsController.validateField(req.body);
        if (validated.error) {
            return res.status(400).json({ message: 'Invalid field.', detail: validated.error.details });
        }
        await field.update({ name: validated.value.name, field: validated.value.field });
        return res.status(200).json({ field: field });
    }

    /**
     * @method delete
     * @route /fields/:id
     * @param req
     * @param res
     */
    public static async deleteField(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { id } = req.params;
        const field = await Field.findOne({ where: { id: id } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found.' });
        }
        if ((field.is_admin_field && !user.is_admin) || (!field.is_admin_field && field.user_id != user.id)) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        if (!field.deletedAt) {
            await field.update({ deletedAt: new Date() });
        } else {
            await field.destroy();
        }
        return res.status(200).json({ message: 'Field deleted.' });
    }

    /**
     * @method put
     * @route /fields/:id/restore
     * @param req : MyRequest
     * @param res : MyResponse
     * @private
     */
    public static async restoreField(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
        const { email } = req.user;
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { id } = req.params;
        const field = await Field.findOne({ where: { id: id } });
        if (!field) {
            return res.status(404).json({ message: 'Field not found.' });
        }
        if ((field.is_admin_field && !user.is_admin) || (!field.is_admin_field && field.user_id != user.id)) {
            return res.status(403).json({ message: 'Access denied.' });
        }
        if (field.deletedAt) {
            await field.update({ deletedAt: null });
        }
        return res.status(200).json({ message: 'Field restored.' });
    }

    //**********//
    //VALIDATORS//
    //*********//
    private static validateField(field: any) {
        const schema = Joi.object().keys({
            name: Joi.string().min(4).required(),
            field: Joi.object()
                .required()
                .keys({
                    dimension: Joi.object().required().keys({
                        width: Joi.number().required(),
                        height: Joi.number().required(),
                    }),
                    players: Joi.array()
                        .required()
                        .items(
                            Joi.object().keys({
                                location: Joi.object().required().keys({
                                    x: Joi.number().required(),
                                    y: Joi.number().required(),
                                }),
                                dimension: Joi.object().required().keys({
                                    width: Joi.number().required(),
                                    height: Joi.number().required(),
                                }),
                                avoidArea: Joi.object()
                                    .required()
                                    .keys({
                                        location: Joi.object().required().keys({
                                            x: Joi.number().required(),
                                            y: Joi.number().required(),
                                        }),
                                        radius: Joi.number().required(),
                                    }),
                            })
                        ),
                    objects: Joi.array()
                        .required()
                        .items(
                            Joi.object().keys({
                                type: Joi.string().required(),
                                location: Joi.object().required().keys({
                                    x: Joi.number().required(),
                                    y: Joi.number().required(),
                                }),
                                dimension: Joi.object().required().keys({
                                    width: Joi.number().required(),
                                    height: Joi.number().required(),
                                }),
                                avoidArea: Joi.object()
                                    .required()
                                    .keys({
                                        location: Joi.object().required().keys({
                                            x: Joi.number().required(),
                                            y: Joi.number().required(),
                                        }),
                                        radius: Joi.number().required(),
                                    }),
                            })
                        ),
                }),
        });
        return schema.validate(field);
    }
}
