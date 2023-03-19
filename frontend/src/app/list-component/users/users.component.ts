import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { Pagination } from '../pagination';

interface Header {
  label: string;
  key: string;
  type: DataType;
}
enum DataType {
  STRING,
  BOOLEAN,
  TEXT,
}
enum Actions {
  BAN_UNBAN,
  CHAT_RESTRICTION,
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  selectedUserForBan: any = null;
  pagination: Pagination;
  headers: Header[] = [];
  users: any[] = [];
  @ViewChildren('dataCheckBox') checkBoxes!: QueryList<ElementRef>;
  @ViewChild('reasonInput') reasonInput!: ElementRef;
  constructor(private adminService: AdminService, private router: Router) {
    this.pagination = new Pagination(0);
    this.headers = [
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
    this.adminService.getUsers().subscribe(
      (res: any) => {
        this.users = res.users;
        this.pagination = new Pagination(this.users.length);
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

  actionClicked(
    action: Actions,
    userId: number | undefined = undefined
  ): void {
    if (action === Actions.BAN_UNBAN) {
      if (userId) {
        const user =  this.users.find((user: any) => user.id === userId);
        if(user.banned) {
          this.sendUnbanRequest([userId]);
        }
        else {
          this.selectedUserForBan = user;
        }
      } else {
        const selectedUsersForBan = this.users
          .filter((user: any, index: number) => {
            return this.CheckBoxes.get(index)?.nativeElement.checked && !user.banned;
          })
          .map((user: any) => {
            return user.id;
          });
        const selectedUsersForUnban = this.users
          .filter((user: any, index: number) => {
            return this.CheckBoxes.get(index)?.nativeElement.checked && user.banned;
          })
          .map((user: any) => {
            return user.id;
          });
        this.sendBanRequest(selectedUsersForBan);
        this.sendUnbanRequest(selectedUsersForUnban);
      }
    }
    if(action === Actions.CHAT_RESTRICTION) {
      console.log('chat restriction');
      if (userId) {
        this.sendChatRestrictionRequest([userId]);
      } else {
        const selectedUsers = this.users
          .filter((user: any, index: number) => {
            return this.CheckBoxes.get(index)?.nativeElement.checked;
          })
          .map((user: any) => {
            return user.id;
          });
        this.sendChatRestrictionRequest(selectedUsers);
      }
    }
  }

  sendBanRequest(user_ids: number[], reason: string | undefined = undefined) {
    console.log(user_ids);
    user_ids.forEach((user_id) => {
      this.adminService.banUser(user_id, reason).subscribe(
        (res: any) => {
          this.users = this.users.map((user: any) => {
            if (user.id === user_id) {
              user.banned = true;
              user.banned_reason = reason;
            }
            return user;
          });
        },
        (err: any) => {
          // TODO handle error
          console.log(err);
        }
      );
    });
  }

  getDataField(user: any, header: Header) {
    if (header.type == DataType.BOOLEAN) {
      return user[header.key]
        ? `<i class="fs-5 bi bi-check-circle-fill text-success"></i>`
        : `<i class=" fs-5 bi bi-x-circle-fill text-danger"></i>`;
    }
    if (header.type == DataType.TEXT) {
      return user[header.key]
        ? `<div>${user[header.key]}</div>`
        : `<i class="fs-4 bi bi-dash-lg text-white fs-1"></i>`;
    }
    return user[header.key]
      ? user[header.key]
      : `<i class="fs-4 bi bi-dash-lg text-white"></i>`;
  }

  sendUnbanRequest(user_ids: number[]) {
    user_ids.forEach((user_id) => {
      this.adminService.unbanUser(user_id).subscribe(
        (res: any) => {
          this.users = this.users.map((user: any) => {
            if (user.id === user_id) {
              user.banned = false;
              user.banned_reason = '';
            }
            return user;
          });
        },
        (err: any) => {
          // TODO handle error
          console.log(err);
        }
      );
    });
  }
  modalSubmitted(): void {
    if (this.selectedUserForBan) {
      this.sendBanRequest([this.selectedUserForBan.id], this.reasonInputValue);
      this.reasonInputValue = '';
      this.selectedUserForBan = null;
    }
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
      },
      (err: any) => {
        // TODO handle error
        console.log(err);
      }
    );
  }
  selectAll(event: any) {
    this.checkBoxes.forEach((checkBox: ElementRef) => {
      checkBox.nativeElement.checked = event.target.checked;
    });
  }
  get CheckBoxes(): QueryList<ElementRef> {
    return this.checkBoxes;
  }
  get DataType() {
    return DataType;
  }
  get Actions() {
    return Actions;
  }
  get reasonInputValue() {
    return this.reasonInput.nativeElement.value;
  }
  set reasonInputValue(value: string) {
    this.reasonInput.nativeElement.value = value;
  }
}
