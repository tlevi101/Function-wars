import { MyRequest, MyResponse } from "./Interfaces";
const { User, Report } = require('../../models');
const { Op } = require('sequelize');

export class ReportController{


	/**
	 * @method get
	 * @route /reports
	 * @param req 
	 * @param res 
	 * @returns 
	 */
	public static async getReports(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
		if (!req.user.is_admin) return res.status(403).json({ message: 'You are not an admin.' });
		const reports = await Report.findAll({
			attributes: { exclude: ['reported_by', 'reported'] },
			include: [
				{
					model: User,
					as: 'reportedBy',
					attributes: ['id', 'name', 'email'],
				},
				{
					model: User,
					as: 'reportedUser',
					attributes: ['id', 'name', 'email', 'chat_restriction', 'banned', 'banned_reason'],
				},
			],
			order: [
				['handled', 'ASC'],
				['deletedAt', 'ASC'],
				['createdAt', 'ASC'],
			],
		});
		res.status(200).json({ reports: reports });
	
	}


	/**
	 * @method delete
	 * @route reports/:id
	 * @param req 
	 * @param res 
	 * @returns 
	 */
	public static async deleteReport(req: MyRequest, res: MyResponse) {
		if(req.user.type==='guest') return res.status(403).json({message:'Guest cannot make this request!'});
		if (!req.user.is_admin)
		 	return res.status(403).json({ message: 'You are not an admin.' });
		const report = await Report.findByPk(req.params.id);
		if (!report) 
			return res.status(404).json({ message: 'Report not found.' });
		if (!report.deletedAt) 
			await report.update({ handled: true, deletedAt: new Date() });
		else await report.destroy();
		await ReportController.markUserReportsAsHandled(report.reported);
		res.status(200).json({ message: 'Report deleted.' });
	
	}

	public static async markUserReportsAsHandled(userId: number) {
		const reports = await Report.findAll({
			where: { reported: userId },
		});
		for (let i = 0; i < reports.length; i++) {
			await reports[i].update({ handled: true });
		}
	}

}