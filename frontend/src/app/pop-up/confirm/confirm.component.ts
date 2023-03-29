import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ConfirmData {
    readonly myName: 'ConfirmData';
    description: string;
}
@Component({
    selector: 'app-confirm',
    templateUrl: './confirm.component.html',
    styleUrls: ['./confirm.component.scss'],
})
export class ConfirmComponent {
    @Input() description: string;
    @Output() confirmEvent = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();
    constructor() {
        this.description = '';
    }

    confirm() {
        this.confirmEvent.emit();
        this.description = '';
    }

    cancel() {
        this.cancelEvent.emit();
        this.description = '';
    }

    public show(data: ConfirmData) {
        this.description = data.description;
    }
}
