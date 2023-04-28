import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DecodedToken } from 'src/app/interfaces/token.interface';
import { AdminService } from 'src/app/services/admin.service';
import { Action, BaseListComponent, ConfirmType, DataType, Header } from '../base-list/base-list.component';
import { baseData } from './base-list.data';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, AfterViewInit {
    users: any[] = [];
	user: DecodedToken | undefined;
    @ViewChild('baseList') baseList!: BaseListComponent;
    constructor(private adminService: AdminService, private router: Router, private jwt:JwtService) {
		this.user = jwt.getDecodedAccessToken();
    }

    ngOnInit(): void {
        if (!this.user) {
            this.router.navigate(['/login']);
        }
        if ((this.user?.type === 'user' && !this.user?.is_admin) || this.user?.type === 'guest') {
            this.router.navigate(['/']);
        }
    }

	ngAfterViewInit(): void {
        this.sendGetUsersRequest();
	}

    handleActionClicked($event: any) {
        const { action, data, confirmInput } = $event;
        if (action.type === 'banUnban') {
            this.handleBanUnbanAction(data, confirmInput);
        } else if (action.type === 'chatRestriction') {
            this.handleChatRestrictionAction(data);
        }
		if(action.type === 'makeAdmin'){
			this.handleMakeAdminAction(data[0].id);
		}
    }
    handleBanUnbanAction(users: any[], reason: string | undefined = undefined) {
        console.log(users);
        users.map((user: any) => {
            if (user.banned) {
                this.sendUnbanRequest(user.id);
            } else {
                this.sendBanRequest(user.id, reason);
            }
        });
    }

    sendBanRequest(userId: number, reason: string | undefined = undefined) {
        this.adminService.banUser(userId, reason).subscribe(
            (res: any) => {
                this.users = this.users.map((user: any) => {
                    if (user.id === userId) {
                        user.banned = true;
                        user.banned_reason = reason;
                    }
                    return user;
                });
                this.baseList.updateData(this.users);
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
                this.users = this.users.map((user: any) => {
                    if (user.id === userId) {
                        user.banned = false;
                        user.banned_reason = '';
                    }
                    return user;
                });
                this.baseList.updateData(this.users);
            },
            (err: any) => {
                // TODO handle error
                console.log(err);
            }
        );
    }

	handleMakeAdminAction(userID:number) {
		this.adminService.makeAdmin(userID).subscribe(
			(res: any) => {
				this.sendGetUsersRequest();
			},
			(err: any) => {
				// TODO handle error
				console.log(err);
			}
		);

	}

    handleChatRestrictionAction(users: any[]) {
        const user_ids = users.map((user: any) => user.id);
        this.sendChatRestrictionRequest(user_ids);
    }
    sendChatRestrictionRequest(user_ids: number[]) {
        this.adminService.addRemoveChatRestrictionUsers(user_ids).subscribe(
            (res: any) => {
                this.users = this.users.map((user: any) => {
                    if (user_ids.includes(user.id)) {
                        user.chat_restriction = !user.chat_restriction;
                    }
                    return user;
                });
                this.baseList.updateData(this.users);
            },
            (err: any) => {
                // TODO handle error
                console.log(err);
            }
        );
    }

    sendGetUsersRequest() {
        this.adminService.getUsers().subscribe(
            (res: any) => {
                this.users = res.users;
                baseData.collectionSize = this.users.length;
                baseData.data = this.users;
                this.baseList.init(baseData);
            },
            (err: any) => {
                // TODO handle error
                console.log(err);
            }
        );
    }
}
