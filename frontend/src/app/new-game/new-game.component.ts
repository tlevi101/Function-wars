import { Component, OnInit, ViewChild } from '@angular/core';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { FieldService } from '../services/field.service';
import { WaitListService } from '../services/wait-list.service';
import { OnWaitingComponent } from '../on-waiting/on-waiting.component';
import { DecodedToken } from '../interfaces/token.interface';

@Component({
    selector: 'app-new-game',
    templateUrl: './new-game.component.html',
    styleUrls: ['./new-game.component.scss'],
})
export class NewGameComponent implements OnInit {
    canCreateGame = false;
    showWaiting = false;
    showCreateCustomGame = false;
	user : DecodedToken | undefined;
    @ViewChild('onWaiting') onWaiting!: OnWaitingComponent;
    constructor(
        private jwtService: JwtService,
        private router: Router,
        private fieldService: FieldService,
        private waitListService: WaitListService
    ) {
		this.user = jwtService.getDecodedAccessToken();
	}

    ngOnInit(): void {
        if (!this.jwtService.isTokenValid()) {
            this.router.navigate(['/login']);
        }
		if(this.user && this.user.type === 'user'){
			this.fieldService.getFields().subscribe(
				(response: any) => {
					this.canCreateGame = response.fields.length > 0;
				},
				(error: any) => {
					//TODO handle error
				}
			);
		}
        this.waitListService.joinedGame().subscribe((response: any) => {
            console.log(response);
            this.showWaiting = false;
            this.router.navigate(['/games', response.room]);
        });
    }

    newGame() {
        this.showWaiting = true;
        this.waitListService.joinWaitList();
    }

    cancelWaiting() {
        this.showWaiting = false;
    }

	get isGuest(): boolean {
		return this.user?.type === 'guest';
	}

    protected readonly onpageshow = onpageshow;
}
