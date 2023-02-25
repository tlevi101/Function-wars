const express = require("express");
const router = express.Router();
const { User } = require("../models");
const auth = require("../middlewares/auth");
const { Op } = require("sequelize");

router.get("/users", auth,async (req, res) => {
	if(!req.user.is_admin) 
		return res.status(403).json({message: "You are not an admin."});
	res.status(200).json({ users: await User.findAll() });
});

router.put('/users/ban', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	for(let user of users){
		await user.update({banned: true})
	}
	res.status(200).send({message: 'Users banned.'})
})


router.put('/users/unban', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	for(let user of users){
		await user.update({banned: false})
	}
	res.status(200).send({message: 'Users unbanned.'})
});

router.put('/users/make-admin', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	let triedToChangeSuperAdmin = false;
	for(let user of users){
		if(user.role === 'super_admin') {
			triedToChangeSuperAdmin = true;
			continue;
		};
		if(user.is_admin) continue;
		await user.update({is_admin: true, role: 'admin'})
	}
	res.status(200).send({message: 'Users are now admins.', triedToChangeSuperAdmin})
});

router.put('/users/remove-admin', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	let triedToChangeSuperAdmin = false;
	for(let user of users){
		if(user.role === 'super_admin') {
			triedToChangeSuperAdmin = true;
			continue;
		};
		if(!user.is_admin) continue;
		await user.update({is_admin: false})
	}
	res.status(200).send({message: 'Users are no longer admins.', triedToChangeSuperAdmin})
});

router.put('/users/chat-restriction', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	for(let user of users){
		if(user.is_admin) continue;
		if(user.chat_restriction) continue;
		await user.update({chat_restriction: true})
	}
	res.status(200).send({message: 'Users are now chat restricted.'})
});

router.put('/users/remove-chat-restriction', auth, async(req,res) =>{
	if(!req.user.is_admin) 
	return res.status(403).json({message: "You are not an admin."});
	const {user_ids} =  req.body;
	if(!user_ids || Array.isArray(user_ids)){
		return res.status(400).send({message: 'No user_ids provided or user_ids is not an array.'})
	}
	const users = await User.findAll({
		where: {
			id: {
				[Op.in]: user_ids
			}
		}
	})
	if(!users){
		return res.status(404).send({message: 'Users not found.'})
	}
	for(let user of users){
		if(user.is_admin) continue;
		if(!user.chat_restriction) continue;
		await user.update({chat_restriction: false})
	}
	res.status(200).send({message: 'Users are no longer chat restricted.'})
});
module.exports = router;