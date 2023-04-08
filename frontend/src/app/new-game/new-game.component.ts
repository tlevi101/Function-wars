import { Component, OnInit } from '@angular/core';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { FieldService } from '../services/field.service';

@Component({
  selector: 'app-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss']
})
export class NewGameComponent implements OnInit {

	canCreateGame = false;
  	constructor(private jwtService:JwtService, private router:Router, private fieldService:FieldService) { }

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
	}

}
