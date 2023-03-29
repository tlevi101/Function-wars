import {
    Component,
    ComponentRef,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';

import { Router } from '@angular/router';
import {
    ConfirmWithInputComponent,
    ConfirmWithInputData,
} from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';

import { ConfirmComponent, ConfirmData } from 'src/app/pop-up/confirm/confirm.component';
import { Pagination } from '../pagination';

export interface Header {
    label: string;
    key: string;
    type: DataType;
}
export enum DataType {
    STRING,
    BOOLEAN,
    TEXT,
    DATE,
}
export enum ConfirmType {
    DEFAULT,
    WITH_INPUT,
}

export interface Action {
    type: string;
    HTML: string;
    tooltip: string;
    confirmRequired: (data?: any) => boolean;
    confirmType?: ConfirmType;
    confirmData?: ConfirmWithInputData | ConfirmData;
}

export interface BaseData {
    pagination: Pagination;
    headers: Header[];
    data: any[];
    singularActions: Action[];
    pluralActions: Action[];
}

@Component({
    selector: 'app-base-list',
    templateUrl: './base-list.component.html',
    styleUrls: ['./base-list.component.scss'],
})
export class BaseListComponent {
    selectedDataForAction: any = null;
    lastAction: Action | null = null;
    @Input() pagination: Pagination;
    @Input() headers: Header[] = [];
    @Input() data: any[] = [];
    @Input() singularActions: Action[] = [];
    @Input() pluralActions: Action[] = [];
    @ViewChildren('dataCheckBox') checkBoxes!: QueryList<ElementRef>;
    @ViewChild('confirmWithInput') confirmWithInput!: ConfirmWithInputComponent;
    @ViewChild('confirm') confirm!: ConfirmComponent;
    @Output() actionClickedEvent: EventEmitter<{
        action: Action;
        data: any[];
        confirmInput?: string;
    }> = new EventEmitter();
    constructor() {
        this.pagination = new Pagination(0);
    }

    actionClicked(action: Action, dataId: number | undefined = undefined): void {
        this.lastAction = action;
        const singularData = this.data.find((data: any) => data.id === dataId);
        if (singularData && action.confirmRequired(singularData)) {
            if (action.confirmType === ConfirmType.DEFAULT && action.confirmData?.myName === 'ConfirmData') {
                this.selectedDataForAction = [this.data.find((data: any) => data.id === dataId)];
                this.confirm.show(action.confirmData);
            } else if (
                action.confirmType === ConfirmType.WITH_INPUT &&
                action.confirmData?.myName === 'ConfirmWithInputData'
            ) {
                this.selectedDataForAction = [this.data.find((data: any) => data.id === dataId)];
                this.confirmWithInput.show(action.confirmData);
            }
        } else if (action.confirmRequired() && !dataId) {
            this.selectedDataForAction = this.checkBoxes
                .filter((checkBox: ElementRef) => checkBox.nativeElement.checked)
                .map((checkBox: ElementRef) => {
                    return this.data.find((data: any) => data.id == checkBox.nativeElement.id.split('_')[1]);
                });
            if (action.confirmType === ConfirmType.DEFAULT && action.confirmData?.myName === 'ConfirmData') {
                this.confirm.show(action.confirmData);
            } else if (
                action.confirmType === ConfirmType.WITH_INPUT &&
                action.confirmData?.myName === 'ConfirmWithInputData'
            ) {
                this.confirmWithInput.show(action.confirmData);
            }
        } else {
            if (dataId) {
                this.selectedDataForAction = [this.data.find((data: any) => data.id === dataId)];
                this.handleConfirmEvent();
                return;
            }
            this.selectedDataForAction = this.CheckBoxes.filter(
                (checkBox: ElementRef) => checkBox.nativeElement.checked
            ).map((checkBox: ElementRef) => {
                if (checkBox.nativeElement.checked) {
                    const singData = this.data.find((data: any) => data.id == checkBox.nativeElement.id.split('_')[1]);
                    return singData;
                }
            });
            this.handleConfirmEvent();
        }
    }

    handleConfirmEvent($event: any | undefined = undefined): void {
        const confirmInput = $event;
        if (!this.lastAction) return;
        this.actionClickedEvent.emit({
            action: this.lastAction,
            data: this.selectedDataForAction,
            confirmInput,
        });
    }

    getDataField(data: any, header: Header) {
        if (header.type == DataType.BOOLEAN) {
            return this.getDataWithKeys(data, header.key)
                ? `<i class="fs-5 bi bi-check-circle-fill text-success"></i>`
                : `<i class=" fs-5 bi bi-x-circle-fill text-danger"></i>`;
        }
        if (header.type == DataType.TEXT) {
            return this.getDataWithKeys(data, header.key)
                ? `<div>${this.getDataWithKeys(data, header.key)}</div>`
                : `<i class="fs-4 bi bi-dash-lg text-white fs-1"></i>`;
        }
        if (header.type == DataType.DATE) {
            return this.getDataWithKeys(data, header.key)
                ? `<div>${new Date(this.getDataWithKeys(data, header.key)).toLocaleDateString()}</div>`
                : `<i class="fs-4 bi bi-dash-lg text-white fs-1"></i>`;
        }
        return this.getDataWithKeys(data, header.key)
            ? this.getDataWithKeys(data, header.key)
            : `<i class="fs-4 bi bi-dash-lg text-white"></i>`;
    }

    selectAll(event: any) {
        this.checkBoxes.forEach((checkBox: ElementRef) => {
            checkBox.nativeElement.checked = event.target.checked;
        });
    }

    init(baseData: BaseData) {
        this.pagination = baseData.pagination;
        this.headers = baseData.headers;
        this.data = baseData.data;
        this.singularActions = baseData.singularActions;
        this.pluralActions = baseData.pluralActions;
    }

    getDataWithKeys(data: any, multiDepthKey: string) {
        const keys = multiDepthKey.split('.');
        let result = data;
        keys.forEach(key => {
            result = result[key];
        });
        return result;
    }

    updateData(data: any) {
        this.data = data;
    }

    get CheckBoxes(): QueryList<ElementRef> {
        return this.checkBoxes;
    }
    get DataType() {
        return DataType;
    }
}
