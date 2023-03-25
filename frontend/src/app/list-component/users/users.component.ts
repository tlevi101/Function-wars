import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmWithInputData } from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';
import { AdminService } from 'src/app/services/admin.service';
import { Action, BaseListComponent, ConfirmType, DataType, Header } from '../base-list/base-list.component';
import { Pagination } from '../pagination';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  users: any[] = [];
  @ViewChild('baseList') baseList!: BaseListComponent;
  constructor(private adminService: AdminService, private router: Router) {
	this.baseList = new BaseListComponent(this.router);
    let pagination = new Pagination(0);
    const header = [
      { label: 'ID', key: 'id', type: DataType.STRING },
      { label: 'Name', key: 'name', type: DataType.STRING },
      { label: 'Email', key: 'email', type: DataType.STRING },
      { label: 'Role', key: 'role', type: DataType.STRING },
      { label: 'Banned', key: 'banned', type: DataType.BOOLEAN },
      { label: 'Banned reason', key: 'banned_reason', type: DataType.TEXT },
      {
        label: 'Chat restricted',
        key: 'chat_restriction',
        type: DataType.BOOLEAN,
      },
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
	const slashedChatHTML = `
	<div class="slashedChat position-relative">
		<i class=" fs-4 bi bi-chat position-absolute" ></i>
		<div class="slashRotate position-absolute">
			<i class="fs-2 bi bi-slash-lg"></i>
		</div>	
	</div>
	`;
	const singularActions:Action[] =[
		{
			type: 'banUnban',
			HTML:`<i class="bi bi-exclamation-octagon-fill me-2 text-danger fs-4 "></i>`,
			tooltip: 'Ban/Unban user',
			confirmRequired: () => false,
			confirmType: ConfirmType.WITH_INPUT,
			confirmData: confirmWithInputData,
		},
		{
			type: 'chatRestriction',
			HTML: slashedChatHTML,
			tooltip: 'Add/Remove chat restriction to/from user',
			confirmRequired: () => false,
		}
	] ;
	const pluralActions:Action[] =[
		{
			type: 'banUnban',
			HTML:`<i class="bi bi-exclamation-octagon-fill me-2 text-danger fs-4 "></i>`,
			tooltip: 'Ban/Unban selected users',
			confirmRequired: (user:any) => { return !user?.banned; },			
		},
		{
			type: 'chatRestriction',
			HTML: slashedChatHTML,
			tooltip: 'Add/Remove chat restriction to/from selected users',
			confirmRequired: () => false,
		}
	];

    this.adminService.getUsers().subscribe(
      (res: any) => {
        this.users = res.users;
        pagination = new Pagination(this.users.length);
		this.baseList.init({
			headers: header,
			data: this.users,
			pagination: pagination,
			singularActions: singularActions,
			pluralActions: pluralActions,
		})
      },
      (err: any) => {
        // TODO handle error
        console.log(err);
      }
    );
  }

  ngOnInit(): void {
    if (sessionStorage.getItem('token') && !localStorage.getItem('token')) {
      this.router.navigate(['/login']);
    }
  }

  handleActionClicked($event:any) {
	const {action, data, confirmInput} = $event;
	if(action.type === 'banUnban'){
		this.handleBanUnbanAction(data, confirmInput);
	}
	else if(action.type === 'chatRestriction'){
		this.handleChatRestrictionAction(data);
	}
  }
	handleBanUnbanAction(users:any[], reason: string | undefined = undefined) {
		console.log(users);
		users.map((user: any) => {
			if(user.banned){
				this.sendUnbanRequest(user.id);
			}
			else{
				this.sendBanRequest(user.id, reason);
			}
		});
	}

  sendBanRequest(userId:number, reason: string | undefined = undefined) {
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

  handleChatRestrictionAction(users:any[]) {
	const user_ids = users.map((user:any) => user.id);
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

}
