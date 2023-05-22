import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { JwtService } from '../../services/jwt.service';
import { DecodedToken } from '../../interfaces/token.interface';
import { GroupChatService } from '../../services/group-chat.service';
import { Router } from '@angular/router';
import { InfoComponent } from '../../pop-up/info/info.component';
import { OtherUsersStatusInterface } from '../../interfaces/backend-body.interfaces';
import { UsersService } from '../../services/users.service';
import { FriendsService } from '../../services/friends.service';
import {
    ConfirmWithInputComponent,
    ConfirmWithInputData,
} from '../../pop-up/confirm-with-input/confirm-with-input.component';

export interface MessageInterface {
    from: {
        id: number | string;
        name: string;
    };
    message: string;
}
@Component({
    selector: 'app-group-chat',
    templateUrl: './group-chat.component.html',
    styleUrls: ['./group-chat.component.scss'],
})
export class GroupChatComponent implements OnInit, AfterViewInit {
    @Input() chatMessagesMaxHeight = 300;
    @Input() roomUUID = '';
    messages: MessageInterface[] = [];
    user: DecodedToken | undefined;
    otherUsersStatus: OtherUsersStatusInterface[] = [];

    @ViewChild('chatContainer') chatContainer!: ElementRef;
    @ViewChild('infoComponent') infoComponent!: InfoComponent;
    @ViewChild('sendInput') sendInput!: ElementRef;
    @ViewChild('confirmWithInputComponent') confirmWithInputComponent!: ConfirmWithInputComponent;
    constructor(
        private jwt: JwtService,
        private groupChat: GroupChatService,
        private router: Router,
        private userServices: UsersService,
        private friendsService: FriendsService
    ) {
        this.user = this.jwt.getDecodedAccessToken();
        if (!this.user) {
            this.router.navigate(['/login']);
        }
        this.friendsService.friendDeleted.subscribe((friendID: number) => {
            this.otherUsersStatus = this.otherUsersStatus.map(user => {
                if (user.id === friendID) {
                    user.isFriend = false;
                }
                return user;
            });
        });
        this.groupChat.newUserJoinedGroupChat().subscribe(() => {
            this.getOtherUsersStatus();
        });
    }

    ngOnInit(): void {
        this.groupChat.receiveMessage().subscribe((message: MessageInterface) => {
            console.log(message);
            this.messages.push(message);
            this.scrollToBottom();
        });
    }

    ngAfterViewInit(): void {
        console.log(this.chatContainer);
        this.getAllMessages();
        this.getOtherUsersStatus();
    }

    sendMessage(message: string) {
        if (!this.user) {
            console.log('User not logged in');
            return;
        }
        if (this.user.type === 'user' && this.user.chat_restriction) {
            return;
        }
        this.messages.push({ from: { id: this.user!.id, name: this.user!.name }, message: message });
        this.scrollToBottom();
        this.sendInput.nativeElement.value = '';
        this.groupChat.sendMessage(message);
    }

    getAllMessages() {
        this.groupChat.getMessages(this.roomUUID).subscribe(async ({ messages }) => {
            this.messages = messages;
            this.scrollToBottom();
        });
    }

    getOtherUsersStatus() {
        this.groupChat.getOtherUsersStatus(this.roomUUID).subscribe(async ({ users }) => {
            console.log(users);
            this.otherUsersStatus = users;
        });
    }
    getUser(otherUserID: number | string) {
        return this.otherUsersStatus.find(user => user.id === otherUserID);
    }

    addFriend(otherUserID: number) {
        this.friendsService.addFriend(otherUserID).subscribe(({ message }) => {
            this.infoComponent.description = message;
            this.otherUsersStatus = this.otherUsersStatus.map(user => {
                if (user.id == otherUserID) {
                    user.isFriend = true;
                }
                return user;
            });
        });
    }

    blockUser(otherUserID: number) {
        this.userServices.blockUser(otherUserID).subscribe(
            (res: any) => {
                this.infoComponent.description = res.message;
                this.otherUsersStatus = this.otherUsersStatus.map(user => {
                    if (user.id == otherUserID) {
                        user.blocked = true;
                    }
                    return user;
                });
            },
            err => {
                this.infoComponent.description = err.error.message;
            }
        );
    }

    unblockUser(otherUserID: number) {
        this.userServices.unblockUser(otherUserID).subscribe(
            ({ message }) => {
                this.infoComponent.description = message;
                this.otherUsersStatus = this.otherUsersStatus.map(user => {
                    if (user.id == otherUserID) {
                        user.blocked = false;
                    }
                    return user;
                });
            },
            err => {
                this.infoComponent.description = err.error.message;
            }
        );
    }

    reportUser(otherUserID: number) {
        const data: ConfirmWithInputData = {
            myName: 'ConfirmWithInputData',
            title: `Report ${this.getUser(otherUserID)?.name}`,
            message: 'Please enter the reason for reporting this user!',
            inputPlaceHolder: 'Reason',
            inputType: 'text',
            confirmButtonText: 'Report',
            cancelButtonText: 'Cancel',
            inputRequired: true,
        };
        this.confirmWithInputComponent.show(data);
        const subscription = this.confirmWithInputComponent.confirmEvent.subscribe(
            (reason: string) => {
                const otherSubscription = this.userServices.reportUser(otherUserID, reason).subscribe(
                    ({ message }) => {
                        this.infoComponent.description = message;
                    },
                    err => {
                        this.infoComponent.description = err.error.message;
                    },
                    () => {
                        otherSubscription.unsubscribe();
                    }
                );
            },
            err => {
                console.log(err);
            },
            () => {
                subscription.unsubscribe();
            }
        );
    }

    muteUser(otherUserID: number | string) {
        this.groupChat.muteUser(this.roomUUID, otherUserID).subscribe(
            ({ message }) => {
                this.infoComponent.description = message;
                this.otherUsersStatus = this.otherUsersStatus.map(user => {
                    if (user.id == otherUserID) {
                        user.muted = true;
                    }
                    return user;
                });
            },
            err => {
                this.infoComponent.description = err.error.message;
            }
        );
    }

    unmuteUser(otherUserID: number | string) {
        this.groupChat.unmuteUser(this.roomUUID, otherUserID).subscribe(
            ({ message }) => {
                this.infoComponent.description = message;
                this.otherUsersStatus = this.otherUsersStatus.map(user => {
                    if (user.id == otherUserID) {
                        user.muted = false;
                    }
                    return user;
                });
            },
            err => {
                this.infoComponent.description = err.error.message;
            }
        );
    }

    get chatRestricted() {
        return this.user?.type === 'user' && this.user?.chat_restriction;
    }

    isUser() {
        return this.user?.type === 'user';
    }

    scrollToBottom(): void {
        try {
            setTimeout(() => {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }, 100);
        } catch (err) {
            console.log(err);
        }
    }

    getType(type: any) {
        return typeof type;
    }
    isNumber(value: any): value is number {
        return typeof value === 'number';
    }
}
