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
    attributes: { exclude: ["reported_by", "reported"] },
    include: [
      {
        model: User,
        as: "reportedBy",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "reportedUser",
        attributes: ["id", "name", "email", "chat_restriction","banned","banned_reason"],
      },
    ],
    order: [["handled", "ASC"], ["deletedAt", "ASC"], ["createdAt", "ASC"]],
  });
  res.status(200).json({ reports: reports });
});

router.delete("/reports/:id", auth, async (req, res) => {
  if (!req.user.is_admin)
    return res.status(403).json({ message: "You are not an admin." });
  const report = await Report.findByPk(req.params.id);
  if (!report) return res.status(404).json({ message: "Report not found." });
  if(!report.deletedAt)
    await report.update({ deletedAt: new Date() });
  else
    await report.destroy();
  res.status(200).json({ message: "Report deleted." });
});
router.use("/users", require("./subRoutes/user-updates"));

router.use("/reports", require("./subRoutes/user-updates"));

module.exports = router;
