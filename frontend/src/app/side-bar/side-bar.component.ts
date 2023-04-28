import { Component, ViewChild } from '@angular/core';
import { FriendChatComponent } from '../chats/friend-chat/friend-chat.component';
import { ConfirmComponent } from '../pop-up/confirm/confirm.component';
import { ChatService } from '../services/chat.service';
import { FriendsService } from '../services/friends.service';
import { UsersService } from '../services/users.service';
import { myAnimations } from './animations';
import { InfoComponent } from '../pop-up/info/info.component';
import {DecodedToken} from "../interfaces/token.interface";
import {CustomGameService} from "../services/custom-game.service";
import {Router} from "@angular/router";
import {JwtService} from "../services/jwt.service";

interface Friend {
    id: number;
    name: string;
    unreadMessages: number;
}
enum Actions {
    Undefine,
    Delete,
    Block,
}
interface SelectedFriend {
    friend: Friend;
    index: number;
    action: Actions;
}
interface FriendRequest {
    id: number;
    from: Friend;
}
@Component({
    selector: 'app-side-bar',
    animations: myAnimations,
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent {
    @ViewChild('confirm', { static: true }) confirm!: ConfirmComponent;
    @ViewChild('friendChat', { static: true }) friendChat!: FriendChatComponent;
    @ViewChild('infoComponent') infoComponent!: InfoComponent;
    myFriendsHovered = false;
    friends: Friend[];
    friendCurrentState: string[];
    friendRequests: FriendRequest[];
    selectedFriend: SelectedFriend;
    activeTitle = 'Friends';
    activeFriend: Friend | undefined;
    invites: Set<{inviter:DecodedToken, customGameUUID:string}> = new Set()
    user: DecodedToken | undefined;
    constructor(
        private friendsService: FriendsService,
        private usersService: UsersService,
        private chatService: ChatService,
        private customGameService: CustomGameService,
        private router:Router,
        private jwt:JwtService
    ) {
        this.user = jwt.getDecodedAccessToken();
        this.friendCurrentState = [];
        this.friends = [];
        this.friendRequests = [];
        this.selectedFriend = {
            friend: { id: 0, name: '', unreadMessages: 0 },
            index: 0,
            action: Actions.Undefine,
        };
        this.friendsService.getFriends().subscribe(
            (res: any) => {
                this.friends = res.friends;
                if (this.friends === null) return;
                this.friendCurrentState = [...Array(this.friends.length).keys()].map(() => 'up');
            },
            (err: any) => {
                console.log(err);
                //TODO Create an error message component
            }
        );
        this.friendsService.getFriendRequests().subscribe(
            (res: any) => {
                this.friendRequests = res.requests;
            },
            (err: any) => {
                console.log(err);
                //TODO Create an error message component
            }
        );
        this.chatService.receiveMessage().subscribe((message: any) => {
            if (message.from !== this.activeFriend?.id) {
                const index = this.friends.findIndex(f => f.id === message.from);
                this.friends[index].unreadMessages++;
            }
        });
        this.friendsService.receiveInvite().subscribe(({inviter,customGameUUID}) => {
            this.invites.add({inviter,customGameUUID});
        });
    }
    myFriendsMouseIn(): void {
        this.myFriendsHovered = true;
    }
    myFriendsMouseLeave() {
        this.myFriendsHovered = false;
    }

    friendClicked(index: number) {
        this.friendCurrentState[index] === 'up'
            ? (this.friendCurrentState[index] = 'down')
            : (this.friendCurrentState[index] = 'up');
    }

    handleConfirm() {
        if (this.selectedFriend.action === Actions.Undefine) console.error('Error: Action is undefined');
        else if (this.selectedFriend.action === Actions.Delete) this.deleteFriendRequest();
        else if (this.selectedFriend.action === Actions.Block) this.blockFriendRequest();
    }

    deleteFriendRequest() {
        this.friendsService.deleteFriend(this.selectedFriend.friend.id).subscribe(
            (res: any) => {
                this.friends = this.friends.filter(f => f.id !== this.selectedFriend.friend.id);
                this.friendCurrentState = this.friendCurrentState.filter((f, i) => i !== this.selectedFriend.index);
                this.infoComponent.description = res.message;
            },
            (err: any) => {
                console.log(err);
                this.infoComponent.description = err.error.message;
                //TODO Create an error message component
            }
        );
    }

    deleteFriend(friend: Friend, index: number) {
        this.confirm.description = `Are you sure you want to delete <strong class="text-primary">${friend.name}</strong>?`;
        this.selectedFriend = { friend, index, action: Actions.Delete };
    }

    blockFriend(friend: Friend, index: number) {
        this.confirm.description = `Are you sure you want to block <strong class="text-primary">${friend.name}</strong>? <br> You will not be able to see their messages.`;
        this.selectedFriend = { friend, index, action: Actions.Block };
    }

    blockFriendRequest() {
        this.usersService.blockUser(this.selectedFriend.friend.id).subscribe(
            (res: any) => {
                this.deleteFriendRequest();
            },
            (err: any) => {
                console.log(err);
                //TODO Create an error message component
            }
        );
    }
    changeMenuPoint(event: any) {
        this.activeTitle = event.target.innerText;
    }
    myStatus(title: string): string {
        return this.activeTitle === title ? 'active' : '';
    }

    accept(friendRequest: FriendRequest, index: number) {
        this.friendsService.acceptFriendRequest(friendRequest.id).subscribe(
            (res: any) => {
                this.friendRequests = this.friendRequests.filter(f => f.id !== friendRequest.id);
                this.friends.push(friendRequest.from);
                this.friendCurrentState.push('up');
            },
            (err: any) => {
                console.log(err);
                //TODO Create an error message component
            }
        );
    }
    reject(friendRequest: FriendRequest, index: number) {
        this.friendsService.rejectFriendRequest(friendRequest.id).subscribe(
            (res: any) => {
                this.friendRequests = this.friendRequests.filter(f => f.id !== friendRequest.id);
            },
            (err: any) => {
                console.log(err);
                //TODO Create an error message component
            }
        );
    }
    openChat(friend: Friend) {
        this.activeFriend = friend;
        this.friendChat.friendId = friend.id;
        this.friendChat.friendName = friend.name;
        this.friendChat.loadChat(friend.id);
        const index = this.friends.findIndex(f => f.id === friend.id);
        this.friends[index].unreadMessages = 0;
    }
    handleChatClosed() {
        this.activeFriend = undefined;
    }
    hasUnreadMessages(): boolean {
        return this.friends.some(f => f.unreadMessages > 0);
    }
    rejectInvite(invite:{inviter:DecodedToken, customGameUUID:string}) {
        if(!this.user){
            console.error('User is not defined');
            return;
        }
		if(typeof invite.inviter.id === 'string' || typeof this.user.id === 'string'){
			console.error('User id is not a number');
			return;
		}
        this.friendsService.inviteRejected({inviterID:invite.inviter.id,invitedID:this.user.id} );
        this.invites.delete(invite);
    }
    acceptInvite(invite:{inviter:DecodedToken, customGameUUID:string}) {
        this.customGameService.joinCustomGame(invite.customGameUUID);
        this.invites.delete(invite);
        this.customGameService.customGameJoined().subscribe((res: any) => {
            this.router.navigate(['/wait-rooms', invite.customGameUUID]);
        });
    }
    get slideDirection(): string {
        return this.myFriendsHovered ? 'left' : 'right';
    }
    get friendSlideDirection(): string {
        return this.myFriendsHovered ? 'down' : 'up';
    }

    get Invites():{inviter:DecodedToken, customGameUUID:string}[] {
        return Array.from(this.invites.values());
    }
}
