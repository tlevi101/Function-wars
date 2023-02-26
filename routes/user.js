const express = require("express");
const router = express.Router();
const { User, Friendship } = require("../models");
const auth = require("../middlewares/auth");
const { Op } = require("sequelize");

router.get("/friends", auth, async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ where: { email: email } });
  res.status(200).json({ friends: await user.getFriends() });
});

router.get("/friends/requests", auth, async (req, res) => {
  const { email } = req.user;
  const user = await User.findOne({ where: { email: email } });
  res.status(200).json({ friends: user.getFriendRequests() });
});

router.put("/friends/requests/accept/:id", auth, async (req, res) => {
  const { name } = req.user;
  const { id } = req.params;
  const user = await User.findOne({ where: { name: name } });
  const friendship = await Friendship.findOne({
    where: {
      user_id: id,
    },
  });
  if (!friendship) {
    return res.status(404).json({ message: "Friendship request not found." });
  }
  if (friendship.friend_id !== user.id) {
    return res
      .status(403)
      .json({
        message: "You are not the recipient of this friendship request.",
      });
  }
  await friendship.update({ pending: false });
  res.status(200).json({ message: "Friendship accepted." });
});

router.delete("/friends/requests/reject/:id", auth, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const friendship = await Friendship.findOne({
    where: {
      id: id,
    },
  });
  if (!friendship) {
    return res.status(404).json({ message: "Friendship request not found." });
  }
  if (friendship.friend_id !== user.id) {
    return res
      .status(403)
      .json({
        message: "You are not the recipient of this friendship request.",
      });
  }
  await friendship.destroy();
  res.status(200).json({ message: "Friendship rejected." });
});

router.delete("/friends/:id", auth, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const friendship = await Friendship.findOne({
    where: {
      [Op.or]: [
        { friend_id: id, user_id: user.id },
        { friend_id: user.id, user_id: id },
      ],
    },
  });
  if (!friendship) {
    return res.status(404).json({ message: "Friendship not found." });
  }
  if (friendship.pending) {
    return res
      .status(403)
      .json({ message: "You can't delete a pending friendship." });
  }
  if (friendship.friend_id !== user.id && friendship.user_id !== user.id) {
    return res
      .status(403)
      .json({
        message: "You are not the recipient of this friendship request.",
      });
  }
  await friendship.destroy();
  res.status(200).json({ message: "Friendship deleted." });
});

router.post("/friends/:id", auth, async (req, res) => {
  const { name } = req.user;
  const { id } = req.params;
  const user = await User.findOne({ where: { name: name } });
  if (user.id === id) {
    return res
      .status(403)
      .json({ message: "You can't add yourself as a friend." });
  }
  const friendship = await Friendship.findOne({
    where: {
      [Op.or]: [
        { friend_id: id, user_id: user.id },
        { friend_id: user.id, user_id: id },
      ],
    },
  });
  if (friendship) {
    return res.status(403).json({ message: "Friendship already exists." });
  }
  const newFriendship = await Friendship.create({
    user_id: user.id,
    friend_id: id,
    pending: true,
  });
  res.status(200).json({ message: "Friendship request sent." });
});

module.exports = router;
