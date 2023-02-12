const express = require("express");
const router = express.Router();
const { User, PasswordReset } = require("../models");
const jsonwebtoken = require("jsonwebtoken");
const { Sequelize, Op } = require("sequelize");

router.post("/register", async function (req, res, next) {
  const { name, email, password, passwordAgain } = req.body;
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  if (!passwordAgain) {
    return res
      .status(400)
      .json({ message: "Password confirmation is required (passwordAgain)" });
  }
  if (password !== passwordAgain) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  const user = await User.create({ name, email, password });
  const token = jsonwebtoken.sign(user.toJSON(), process.env.JWT_SECRET, {
    algorithm: process.env.JWT_ALGO,
  });
  res.status(201).json({ message: "User created", jwt: token });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).send({ message: "Email required" });
  }
  const user = await User.findOne({ where: { email } });
  console.log(user);
  if (!user) {
    return res.status(404).send({ message: "Incorrect email" });
  }
  if(user.banned) {
    return res.status(403).send({ message: "User is banned", banned_reason: user.banned_reason });
  }
  if (!password) {
    return res.status(400).send({ message: "Password required" });
  }
  if (!user.comparePassword(password)) {
    return res.status(400).send({ message: "Incorrect password" });
  }
  const token = jsonwebtoken.sign(user.toJSON(), process.env.JWT_SECRET, {
    algorithm: process.env.JWT_ALGO,
  });
  return res.status(200).send({ token });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ message: "Email required" });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).send({ message: "Incorrect email" });
  }
  await user.createPasswordReset().catch(async (err) => {
    if (err instanceof Sequelize.UniqueConstraintError) {
      let passwordReset = await user.getPasswordReset();
      await passwordReset.destroy();
      await user.createPasswordReset();
    }
  });
  const PasswordReset = await user.getPasswordReset();
  res.status(201).send(PasswordReset);
});

router.put("/password-reset/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const passwordReset = await PasswordReset.findOne({ where: { unique_id: uuid } });
  if (!passwordReset) {
    return res.status(404).send({ message: "Incorrect link" });
  }
  if (passwordReset.createdAt < new Date(Date.now() - 3600000)) {
    await passwordReset.destroy();
    return res.status(400).send({ message: "Link expired" });
  }
  const { password, passwordAgain } = req.body;
  if (!password) {
    return res.status(400).send({ message: "Password required" });
  }
  if (!passwordAgain) {
    return res.status(400).send({ message: "Password confirmation required (passwordAgain)" });
  }
  if (password !== passwordAgain) {
    return res.status(400).send({ message: "Passwords do not match" });
  }
  const user = await passwordReset.getUser();
  await user.update({ password });
  await passwordReset.destroy();
  res.status(200).send({ message: "Password updated" });
});
module.exports = router;
