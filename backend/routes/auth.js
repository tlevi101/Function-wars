const express = require("express");
const router = express.Router();
const { User, PasswordReset } = require("../models");
const jsonwebtoken = require("jsonwebtoken");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const forgotPasswordMailer = require("../mail/forgotPasswordMail");
const auth = require("../middlewares/auth");

router.post("/register-guest", function (req, res, next) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (name.length > 20 || name.length < 3)
    return res
      .status(400)
      .json({ message: "Name is must be between 3 and 20 characters long" });
  const token = jsonwebtoken.sign(
    { name, guest: true, JWT_createdAt: new Date(), uuid: uuidv4() },
    process.env.JWT_SECRET,
    {
      algorithm: process.env.JWT_ALGO,
    }
  );
  res.status(201).json({ message: "Guest accepted", jwt: token });
});

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
  const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET, {
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
  if (!user) {
    return res.status(404).send({ message: "Incorrect email" });
  }
  if (user.banned) {
    return res
      .status(403)
      .send({ message: "User is banned", banned_reason: user.banned_reason });
  }
  if (!password) {
    return res.status(400).send({ message: "Password required" });
  }
  if (!user.comparePassword(password)) {
    return res.status(400).send({ message: "Incorrect password" });
  }
  const token = jsonwebtoken.sign(user.toJSONForJWT(), process.env.JWT_SECRET, {
    algorithm: process.env.JWT_ALGO,
  });
  return res.status(200).send({ message: "Login successful", jwt: token });
});

router.post("/forgot-password", async (req, res) => {
  console.log(req.header("Referer"));
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({ message: "Email required" });
  }
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).send({ message: "Incorrect email" });
  }
  if (user.banned) {
    return res
      .status(403)
      .send({ message: "User is banned", banned_reason: user.banned_reason });
  }
  await user.createPasswordReset().catch(async (err) => {
    if (err instanceof Sequelize.UniqueConstraintError) {
      let passwordReset = await user.getPasswordReset();
      await passwordReset.destroy();
      await user.createPasswordReset();
    }
  });
  const passwordReset = await user.getPasswordReset();
  if (process.env.NODE_ENV === "test") {
    return res
      .status(201)
      .send({ message: "Email sent", uuid: passwordReset.uuid });
  } else {
    forgotPasswordMailer(user, req.header("Referer") + passwordReset.link);
    return res.status(201).send({ message: "Email sent" });
  }
});

router.put("/reset-password/:uuid", async (req, res) => {
  const { uuid } = req.params;
  const passwordReset = await PasswordReset.findOne({
    where: { uuid: uuid },
  });
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
    return res
      .status(400)
      .send({ message: "Password confirmation required (passwordAgain)" });
  }
  if (password !== passwordAgain) {
    return res.status(400).send({ message: "Passwords do not match" });
  }
  const user = await passwordReset.getUser();
  await user.update({ password });
  await passwordReset.destroy();
  res.status(200).send({ message: "Password updated" });
});

router.get("/validate-token", auth, (req, res) => {
  res.status(200).send({ message: "Token valid" });
});
module.exports = router;
