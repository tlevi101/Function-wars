import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { BaseListComponent } from '../base-list/base-list.component';
import { AdminService } from 'src/app/services/admin.service';
import { Router } from '@angular/router';
import { baseData } from './base-list.data';

@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss']
})
export class AdminsComponent implements AfterViewInit, OnInit {
	admins: any[] = [];

	@ViewChild('baseList') baseList!: BaseListComponent;
    constructor(private adminService: AdminService, private router: Router) {
    }

	ngOnInit(): void {		
	}

	ngAfterViewInit(): void {
        this.sendGetAdminsRequest();
	}

	handleActionClicked(event:any){
        const { action, data, confirmInput } = event;
		if(action.type === 'removeAdmin'){
			this.sendRemoveAdminRequest(data[0].id);
		}
	}

	sendRemoveAdminRequest(userID:number){
		this.adminService.removeAdmin(userID).subscribe(
			(res:any) =>{
				this.sendGetAdminsRequest();
			},
			(err:any)=>{
				console.log(err);
			}
		);
	}

	sendGetAdminsRequest() {
		this.adminService.getAdmins().subscribe(
			(res:any) => {
				console.log(res.admins.length);
				this.admins = res.admins;
				baseData.data = res.admins;
				baseData.collectionSize = res.admins.length;
				this.baseList.init(baseData);
			},
			(err:any)=>{
				console.error(err);
			}
		);
	}
}
