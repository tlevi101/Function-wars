const express = require('express');
const router = express.Router();
const { User, Field } = require('../models');
const auth = require('../middlewares/auth');
const Joi = require('joi');
const { Op } = require('sequelize');
const {FieldsController} = require("../types/controllers/FieldsController");

router.get('/fields', auth, FieldsController.getFields);

router.get('/fields/:id', auth, FieldsController.getField);

router.get('/fields/:id/show', auth, FieldsController.showFieldForAnyone);

router.post('/fields', auth, FieldsController.createField);

router.put('/fields/:id', auth, FieldsController.updateField);

router.delete('/fields/:id', auth, FieldsController.deleteField);

router.put('/fields/:id/restore', auth, FieldsController.restoreField);

module.exports = router;
