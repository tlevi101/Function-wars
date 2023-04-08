const express = require('express');
const router = express.Router();
const { User, Field } = require('../models');
const auth = require('../middlewares/auth');
const Joi = require('joi');
const { Op } = require('sequelize');


router.get('/fields', auth, async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    if (user.is_admin) {
        const fields = await Field.findAll({where:{ is_admin_field: true }, attributes:{ exclude: ['field'] }});
        return res.status(200).json({ fields: fields });
    }
    const fields = await user.getFields({ attributes: { exclude: ['field'] } });
    res.status(200).json({ fields: fields });
});

router.get('/fields/:id', auth, async (req, res) => {
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
    res.status(200).json({ field: field });
});

router.post('/fields', auth, async (req, res) => {
    const { email } = req.user;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
	const validated = validateField(req.body);
	if(validated.error) {
		return res.status(400).json({ message: 'Invalid field.' , detail: validated.error.details });
	}
	const field = await Field.create({name:validated.value.name, field:validated.value.field, user_id: user.id, is_admin_field: false});
    res.status(201).json({ field: field });
});
 
router.put('/fields/:id', auth, async (req, res) => {
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
	const validated = validateField(req.body);
	if(validated.error) {
		return res.status(400).json({ message: 'Invalid field.' , detail: validated.error.details });
	}
	await field.update({name:validated.value.name, field:validated.value.field});
	res.status(200).json({ field: field });
});


module.exports = router;


function validateField(field) {
	const schema = Joi.object().keys({
		name: Joi.string().min(4).required(),
		field: Joi.object().required().keys({
			dimensions: Joi.object().required().keys({
				width: Joi.number().required(),
				height: Joi.number().required(),
			}),
			players: Joi.array().required().items(
				Joi.object().keys({
					location: Joi.object().required().keys({
						x: Joi.number().required(),
						y: Joi.number().required(),
					}),
					dimensions: Joi.object().required().keys({
						width: Joi.number().required(),
						height: Joi.number().required(),
					}),
					avoidArea: Joi.object().required().keys({
						location: Joi.object().required().keys({
							x: Joi.number().required(),
							y: Joi.number().required(),
						}),
						radius: Joi.number().required(),
					}),
				})
			),
			objects: Joi.array().required().items(
				Joi.object().keys({
					location: Joi.object().required().keys({
						x: Joi.number().required(),
						y: Joi.number().required(),
					}),
					dimensions: Joi.object().required().keys({
						width: Joi.number().required(),
						height: Joi.number().required(),
					}),
					avoidArea: Joi.object().required().keys({
						location: Joi.object().required().keys({
							x: Joi.number().required(),
							y: Joi.number().required(),
						}),
						radius: Joi.number().required(),
					}),
				})
			)
		}),
	});
	return schema.validate(field);
}