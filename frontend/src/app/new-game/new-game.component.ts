import { Component, OnInit, ViewChild } from '@angular/core';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { FieldService } from '../services/field.service';
import { WaitListService } from '../services/wait-list.service';
import { OnWaitingComponent } from '../on-waiting/on-waiting.component';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss']
})
export class NewGameComponent implements OnInit {

	canCreateGame = false;
	showWaiting = false;
	@ViewChild('onWaiting') onWaiting!: OnWaitingComponent;
  	constructor(private jwtService:JwtService, private router:Router, private fieldService:FieldService, private waitListService:WaitListService) {

	}

  	ngOnInit(): void {
		if(!this.jwtService.isTokenValid()){
			this.router.navigate(['/login']);
		}
		this.fieldService.getFields().subscribe(
			(response: any) => {
				this.canCreateGame = response.fields.length > 0;
			},
			(error: any) => {
				//TODO handle error
			}
		);
		this.waitListService.joinedGame().subscribe(
			(response: any) => {
				console.log(response);
				// this.router.navigate(['/game']);
			}
		);
	}

	newGame(){
		this.showWaiting = true;
		this.waitListService.joinWaitList();
	}

	cancelWaiting(){
		this.showWaiting = false;
	}

}
