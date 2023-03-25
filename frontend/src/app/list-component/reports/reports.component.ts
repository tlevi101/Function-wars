import { Component, ElementRef, QueryList, ViewChild } from '@angular/core';
import { ConfirmWithInputData } from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';
import { ConfirmData } from 'src/app/pop-up/confirm/confirm.component';
import { AdminService } from 'src/app/services/admin.service';
import { Action, BaseListComponent, ConfirmType, DataType } from '../base-list/base-list.component';
import { Pagination } from '../pagination';


@Component({
	selector: 'app-reports',
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
	reports: any[] = [];
	@ViewChild('baseList') baseList!: BaseListComponent;
	constructor(private adminService: AdminService) {
		let pagination = new Pagination(0);
		const headers = [
			{ label: 'ID', key: 'id', type: DataType.STRING },
			{ label: 'Handled', key: 'handled', type: DataType.BOOLEAN },
			{ label: 'Reported by', key: 'reportedBy.name', type: DataType.STRING },
			{ label: 'Description', key: 'description', type: DataType.TEXT },
			{ label: 'Reported user', key: 'reportedUser.name', type: DataType.STRING },
			{ label: 'Banned', key: 'reportedUser.banned', type: DataType.BOOLEAN },
			{ label: 'Banned reason', key: 'reportedUser.banned_reason', type: DataType.TEXT },
			{
				label: 'Chat restricted',
				key: 'reportedUser.chat_restriction',
				type: DataType.BOOLEAN,
			},
			{ label: 'Deleted at', key: 'deletedAt', type: DataType.DATE }
		];
		const confirmWithInputData: ConfirmWithInputData = {
			myName: 'ConfirmWithInputData',
			title: 'Ban user',
			message: 'Are you sure you want to ban this user? <br> Provide a reason if you want.',
			inputPlaceHolder: 'Reason',
			inputType: 'text',
			confirmButtonText: 'Ban',
			cancelButtonText: 'Cancel'
		};
		const confirmData: ConfirmData = {
			myName: 'ConfirmData',
			description: 'Are you sure you want to delete this report?',
		};
		const banHTML = `<i class="bi bi-exclamation-octagon-fill me-2 text-danger fs-4 "></i>`;
		const slashedChatHTML = `
	<div class="slashedChat position-relative me-2">
		<i class=" fs-4 bi bi-chat position-absolute" ></i>
		<div class="slashRotate position-absolute">
			<i class="fs-2 bi bi-slash-lg"></i>
		</div>	
	</div>
	`;
		const deleteHTML = `<i class="fs-4 bi bi-trash3-fill text-danger"></i>`;
		const singularActions: Action[] = [
			{
				type: 'banUnban',
				HTML: banHTML,
				tooltip: 'Ban/Unban user',
				confirmRequired: (report) => {return !report.reportedUser.banned;},
				confirmType: ConfirmType.WITH_INPUT,
				confirmData: confirmWithInputData,
			},
			{
				type: 'chatRestriction',
				HTML: slashedChatHTML,
				tooltip: 'Add/Remove chat restriction to/from user',
				confirmRequired: () => false,
			},
			{
				type: 'delete',
				HTML: deleteHTML,
				tooltip: 'Delete report',
				confirmRequired: () => true,
				confirmType: ConfirmType.DEFAULT,
				confirmData: confirmData,
			}
		];
		const pluralActions: Action[] = [
			{
				type: 'banUnban',
				HTML: banHTML,
				tooltip: 'Ban/Unban selected users',
				confirmRequired: () => false,
			},
			{
				type: 'chatRestriction',
				HTML: slashedChatHTML,
				tooltip: 'Add/Remove chat restriction to/from selected users',
				confirmRequired: () => false,
			},
			{
				type: 'delete',
				HTML: deleteHTML,
				tooltip: 'Delete selected reports',
				confirmRequired: ()=> true,
				confirmType: ConfirmType.DEFAULT,
				confirmData: confirmData,
			}
		];
		this.adminService.getReports().subscribe(
			(res: any) => {
				this.reports = res.reports;
				pagination = new Pagination(this.reports.length);
				this.baseList.init({
					headers: headers,
					data: this.reports,
					pagination: pagination,
					singularActions: singularActions,
					pluralActions: pluralActions,
				});

			},
			(err: any) => {
				// TODO handle error
				console.log(err);
			},
		);

	}

	handleActionClickedEvent($event: any) {
		const { action, data, confirmInput } = $event;
		if (action.type === 'banUnban') {
			this.handleBanUnbanAction(data, confirmInput);
		} 
		else if (action.type === 'chatRestriction') {
			this.handleChatRestrictionAction(data);
		}
		else if (action.type === 'delete') {
			console.log(data);
			this.handleDeleteAction(data);
		}
	}

	handleBanUnbanAction(reports: any[], confirmInput: string | undefined) {
		let handledUsers:any[] = [];
		reports.forEach((report: any) => {
			if(!handledUsers.includes(report.reportedUser.id)){
				handledUsers.push(report.reportedUser.id);
				if (report.reportedUser.banned) {
					this.sendUnbanRequest(report.reportedUser.id);
				} else {
					this.sendBanRequest(report.reportedUser.id, confirmInput);
				}
			}
		});
	}

	sendBanRequest(userId: number, reason: string | undefined = undefined) {
		this.adminService.banUser(userId, reason).subscribe(
			(res: any) => {
				this.reports = this.reports.map((report: any) => {
					if (report.reportedUser.id === userId) {
						report.reportedUser.banned = true;
						report.reportedUser.banned_reason = reason;
						report.handled = true;
					}
					return report;
				});
				this.baseList.updateData(this.reports);
			},
			(err: any) => {
				// TODO handle error
				console.log(err);
			}
		);
	}

	sendUnbanRequest(userId: number) {
		this.adminService.unbanUser(userId).subscribe(
			(res: any) => {
				this.reports = this.reports.map((report: any) => {
					if (report.reportedUser.id === userId) {
						report.reportedUser.banned = false;
						report.reportedUser.banned_reason = null;
						report.handled = true;
					}
					return report;
				});
				this.baseList.updateData(this.reports);
			},
			(err: any) => {
				// TODO handle error
				console.log(err);
			}
		);
	}

	handleChatRestrictionAction(reports: any[]) {
		let handledUsers: any[] = [];
		reports.forEach((report: any) => {
			if (!handledUsers.includes(report.reportedUser.id)) {
				this.adminService.addRemoveChatRestrictionUsers(report.reportedUser.id).subscribe(
					(res: any) => {
						handledUsers.push(report.reportedUser.id);
						this.adminService.getReports().subscribe((res: any) => {
							this.reports = res.reports;
							// this.baseList.updateData(this.reports);
						},
							(err: any) => {
								// TODO handle error
								console.log(err);
							}, () => this.baseList.updateData(this.reports));
					},
					(err: any) => {
						// TODO handle error
						console.log(err);
					}
				);
			}
		});

	}

	handleDeleteAction(reports: any[]) {
		console.log(reports);
		reports.forEach((report: any) => {
			this.adminService.deleteReport(report.id).subscribe(
				(res: any) => {
					this.adminService.getReports().subscribe(
						(res: any) => {
							this.reports = res.reports;
							this.baseList.updateData(this.reports);
						},
						(err: any) => {
							// TODO handle error
							console.log(err);
						}
					);
				},
				(err: any) => {
					// TODO handle error
					console.log(err);
				}
			);
		});
	}
}
