import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FieldService } from 'src/app/services/field.service';
import { JwtService } from 'src/app/services/jwt.service';
import { BaseListComponent } from '../base-list/base-list.component';
import { baseData } from './base-list.data';
import { Pagination } from '../pagination';
import { adminBaseData } from './admin-base-list.data';

@Component({
  selector: 'app-field-list',
  templateUrl: './field-list.component.html',
  styleUrls: ['./field-list.component.scss']
})
export class FieldListComponent implements OnInit {

	fields: any[] = [];
	@ViewChild('baseList') baseList!: BaseListComponent;
	constructor(private router: Router, private fieldService:FieldService, private jwtService:JwtService) { 
		this.sendGetFieldsRequest();
	}

	ngOnInit(): void {
		if(!this.jwtService.isTokenValid()){
			this.router.navigate(['/login']);
		}
	}


	handleActionClicked(event:any){
        const { action, data, confirmInput } = event;
		if (action.type === 'delete') {
			this.handleDeleteAction(data);
		}
		if(action.type === 'edit'){
			this.handleEditAction(data);
		}
	}

	handleEditAction(fields: any[]){
		this.router.navigate(['/field/edit', fields[0].id]);
	}


	async handleDeleteAction(fields: any[]) {
		await Promise.all(fields.map( async (field: any) => {
			await this.sendDeleteFieldRequest(field.id);
		}));
		this.sendGetFieldsRequest();
	}

	async sendDeleteFieldRequest(fieldId: number) {
		await this.fieldService.deleteField(fieldId).toPromise().then(
			(response: any) => {
			},
			(error: any) => {
				//TODO handle error
			}
		);
	}


	sendGetFieldsRequest() {
		this.fieldService.getFields().subscribe(
			(response: any) => {
				this.fields = response.fields;
				if(this.jwtService.getDecodedAccessToken()?.is_admin){
					adminBaseData.pagination = new Pagination(this.fields.length);
					adminBaseData.data = this.fields;
					this.baseList.init(adminBaseData);
				}
				else{
					baseData.pagination = new Pagination(this.fields.length);
					baseData.data = this.fields;
					this.baseList.init(baseData);
				}
			},
			(error: any) => {
				// TODO: Handle error
				console.log(error);
			}
		);
	}
}
