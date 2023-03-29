import { Component, OnInit,  ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DecodedTokenInterface } from 'src/app/interfaces/token.interface';
import { AdminService } from 'src/app/services/admin.service';
import {  BaseListComponent } from '../base-list/base-list.component';
import jwt_decode from 'jwt-decode';
import { Pagination } from '../pagination';
import { baseData} from './base-list.data';

@Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
    reports: any[] = [];
    @ViewChild('baseList') baseList!: BaseListComponent;
    constructor(private adminService: AdminService, private router: Router) {
       this.sendGetReportsRequest();
    }

    ngOnInit(): void {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const decodedToken: DecodedTokenInterface = jwt_decode(token || '');
        if (!token) {
            this.router.navigate(['/login']);
        }
        if (!decodedToken.is_admin) {
            this.router.navigate(['/']);
        }
    }

    handleActionClickedEvent($event: any) {
        const { action, data, confirmInput } = $event;
        if (action.type === 'banUnban') {
            this.handleBanUnbanAction(data, confirmInput);
        } else if (action.type === 'chatRestriction') {
            this.handleChatRestrictionAction(data);
        } else if (action.type === 'delete') {
            console.log(data);
            this.handleDeleteAction(data);
        }
    }

    handleBanUnbanAction(reports: any[], confirmInput: string | undefined) {
        const handledUsers: any[] = [];
        reports.forEach((report: any) => {
            if (!handledUsers.includes(report.reportedUser.id)) {
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
        const handledUsers: any[] = [];
        reports.forEach((report: any) => {
            if (!handledUsers.includes(report.reportedUser.id)) {
                this.adminService.addRemoveChatRestrictionUsers(report.reportedUser.id).subscribe(
                    (res: any) => {
                        handledUsers.push(report.reportedUser.id);
                        this.adminService.getReports().subscribe(
                            (res: any) => {
                                this.reports = res.reports;
                                // this.baseList.updateData(this.reports);
                            },
                            (err: any) => {
                                // TODO handle error
                                console.log(err);
                            },
                            () => this.baseList.updateData(this.reports)
                        );
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
                    this.sendGetReportsRequest();
                },
                (err: any) => {
                    // TODO handle error
                    console.log(err);
                }
            );
        });
    }

	sendGetReportsRequest() {
		this.adminService.getReports().subscribe(
			(res: any) => {
				this.reports = res.reports;
				this.reports = res.reports;
				baseData.pagination = new Pagination(this.reports.length);
				baseData.data = this.reports;
                this.baseList.init(baseData);
			},
			(err: any) => {
				// TODO handle error
				console.log(err);
			}
		);
	}

    getDecodedAccessToken(token: string): DecodedTokenInterface | null {
        try {
            return jwt_decode(token);
        } catch (Error) {
            return null;
        }
    }
}
