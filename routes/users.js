const express = require('express');
const router = express.Router();
const {User} = require('../models');



router.post('/register', async function(req, res, next) {
  const { name, email, password, passwordAgain } = req.body;
  if(!password){
    return res.status(400).json({message: 'Password is required'});
  }
  if (!passwordAgain) {
    return res.status(400).json({message: 'Password confirmation is required (passwordAgain)'});
  }
  if (password !== passwordAgain) {
    return res.status(400).json({message: 'Passwords do not match'});
  }
  const user = await User.create({name, email, password});
  res.status(201).json({message: 'User created', user});
});

module.exports = router;
