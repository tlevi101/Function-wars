const express = require("express");
const router = express.Router();
const { User } = require("../models");
const auth = require("../middlewares/auth");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

router.get("/users", auth,async (req, res) => {
	console.log(req.user);
	if(!req.user.is_admin) return res.status(403).json({message: "You are not an admin"});
	res.status(200).json({ users: await User.findAll() });
});

module.exports = router;