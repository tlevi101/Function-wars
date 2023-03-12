import { AfterViewInit, Component} from '@angular/core';
import { myAnimations } from './animations';
@Component({
  selector: 'app-side-bar',
  animations: myAnimations,
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent {

  myFriendsHovered= false;
  friends =  [...Array(20).keys()];
  friendCurrentState = [...Array(20).keys()].map(() => 'up');
  constructor() { }
  myFriendsMouseIn(): void{
    this.myFriendsHovered = true;
  }
  myFriendsMouseLeave(){
    this.myFriendsHovered = false;
  }
  get slideDirection() : string {
    return this.myFriendsHovered ? 'left' : 'right';
  }
  get friendSlideDirection() : string {
    return this.myFriendsHovered ? 'down' : 'up';
  }
  friendClicked(index : number){
    this.friendCurrentState[index] === 'up' ? 
      this.friendCurrentState[index] = 'down' : 
      this.friendCurrentState[index] = 'up';
  }

}
