import { Component, ViewChild } from '@angular/core';
import { ConfirmComponent } from '../pop-up/confirm/confirm.component';
import { FriendsService } from '../services/friends.service';
import { myAnimations } from './animations';

interface Friend {
  id: number;
  name: string;
};
interface SelectedFriend{
  friend: Friend;
  index: number;
}
@Component({
  selector: 'app-side-bar',
  animations: myAnimations,
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
})
export class SideBarComponent {

  @ViewChild('confirm', { static: true }) confirm!: ConfirmComponent;
  myFriendsHovered = false;
  friends : Friend[];
  friendCurrentState: string[];
  selectedFriend: SelectedFriend;
  constructor(private friendsService: FriendsService) {
    this.friendCurrentState = [];
    this.friends = [];
    this.selectedFriend = {friend: {id: 0, name: ''}, index: 0};
    this.friendsService.getFriends().subscribe((res: any) => {
      this.friends = res.friends;
      if(this.friends === null) return;
      this.friendCurrentState = [...Array(this.friends.length).keys()].map(() => 'up');
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

  handleConfirm(){
    this.friendsService.deleteFriend(this.selectedFriend.friend.id).subscribe((res: any) => {
      this.friends = this.friends.filter((f) => f.id !== this.selectedFriend.friend.id);
      this.friendCurrentState = this.friendCurrentState.filter((f, i) => i !== this.selectedFriend.index); 
      console.log(this.friendCurrentState);
    },
    (err: any) => {
      console.log(err);
    });
  }     

  deleteFriend(friend: Friend, index: number) {
    this.confirm.description = `Are you sure you want to delete <strong class="text-primary">${friend.name}</strong>?`;
    this.selectedFriend = {friend, index};
  }

  get slideDirection(): string {
    return this.myFriendsHovered ? 'left' : 'right';
  }
  get friendSlideDirection(): string {
    return this.myFriendsHovered ? 'down' : 'up';
  }

}
