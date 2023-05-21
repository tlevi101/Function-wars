import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FieldService } from 'src/app/services/field.service';
import { JwtService } from 'src/app/services/jwt.service';
import { BaseListComponent } from '../base-list/base-list.component';
import { baseData } from './base-list.data';
import { adminBaseData } from './admin-base-list.data';
import { InfoComponent } from 'src/app/pop-up/info/info.component';

@Component({
    selector: 'app-field-list',
    templateUrl: './field-list.component.html',
    styleUrls: ['./field-list.component.scss'],
})
export class FieldListComponent implements OnInit {
    fields: any[] = [];
    @ViewChild('baseList') baseList!: BaseListComponent;
    @ViewChild('info') info!: InfoComponent;
    constructor(private router: Router, private fieldService: FieldService, private jwtService: JwtService) {
        this.sendGetFieldsRequest();
    }

    ngOnInit(): void {
        if (!this.jwtService.isTokenValid()) {
            this.router.navigate(['/login']);
        }
    }

    handleActionClicked(event: any) {
        const { action, data, confirmInput } = event;
        if (action.type === 'delete') {
            this.handleDeleteAction(data);
        }
        if (action.type === 'edit') {
            this.handleEditAction(data);
        }
        if (action.type === 'restore') {
            this.handleRestoreAction(data);
        }
    }

    handleRestoreAction(fields: any[]) {
        this.fieldService.restoreField(fields[0].id).subscribe(
            () => {
                this.sendGetFieldsRequest();
            },
            (err: any) => {
                this.info.description = err.error.message;
            }
        );
    }

    handleEditAction(fields: any[]) {
        this.router.navigate(['/field/edit', fields[0].id]);
    }

    async handleDeleteAction(fields: any[]) {
        await Promise.all(
            fields.map(async (field: any) => {
                await this.sendDeleteFieldRequest(field.id);
            })
        );
        this.sendGetFieldsRequest();
    }

    async sendDeleteFieldRequest(fieldId: number) {
        await this.fieldService
            .deleteField(fieldId)
            .toPromise()
            .then(
                (response: any) => {},
                (err: any) => {
                    this.info.description = err.error.message;
                }
            );
    }

    sendGetFieldsRequest() {
        this.fieldService.getFields().subscribe(
            (response: any) => {
                this.fields = response.fields;
                const decodedToken = this.jwtService.getDecodedAccessToken();
                if (decodedToken?.type === 'user' && decodedToken.is_admin) {
                    adminBaseData.collectionSize = this.fields.length;
                    adminBaseData.data = this.fields;
                    this.baseList.init(adminBaseData);
                } else {
                    baseData.collectionSize = this.fields.length;
                    baseData.data = this.fields;
                    this.baseList.init(baseData);
                }
            },
            (err: any) => {
                this.info.description = err.error.message;
                console.log(err);
            }
        );
    }
}
