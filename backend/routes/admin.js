const express = require("express");
const router = express.Router();
const { User, Report } = require("../models");
const auth = require("../middlewares/auth");
const { Op } = require("sequelize");

router.get("/users", auth, async (req, res) => {
  if (!req.user.is_admin)
    return res.status(403).json({ message: "You are not an admin." });
  res.status(200).json({ users: await User.findAll() });
});

router.get("/reports", auth, async (req, res) => {
	if (!req.user.is_admin)
	return res.status(403).json({ message: "You are not an admin." });
	const reports = await Report.findAll({
		attributes: { exclude: ["reported_by", "reported"]},
		include: [
			{
				model: User,
				as: "reportedBy",
				attributes: ["id", "name", "email"],
			},
			{
				model: User,
				as: "reportedUser",
				attributes: ["id", "name", "email"],
			},
		],
	});
	res.status(200).json({ reports: reports });
});

router.use("/users", require("./subRoutes/user-updates"));

router.use("/reports", require("./subRoutes/user-updates"));



module.exports = router;
