import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export interface ConfirmWithInputData {
    readonly myName: 'ConfirmWithInputData';
    title: string;
    message: string;
    inputPlaceHolder: string;
    inputType: string;
    inputRequired?: boolean;
    confirmButtonText: string;
    cancelButtonText: string;
}

@Component({
    selector: 'app-confirm-with-input',
    templateUrl: './confirm-with-input.component.html',
    styleUrls: ['./confirm-with-input.component.scss'],
})
export class ConfirmWithInputComponent {
    @Input() showME = false;
    @Input() title = 'Confirm';
    @Input() message = 'Are you sure?';
    @Input() inputPlaceHolder = 'Description';
    @Input() inputType = 'text';
    @Input() confirmButtonText = 'Confirm';
    @Input() cancelButtonText = 'Cancel';
    @Input() inputRequired = false;
    @Output() confirmEvent: EventEmitter<string> = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();
    @ViewChild('confirmInput') input!: ElementRef;
    valid = false;
    constructor() {}

    confirm() {
        this.showME = false;
        this.confirmEvent.emit(this.input.nativeElement.value);
    }

    cancel() {
        this.showME = false;
        this.cancelEvent.emit();
    }

    public show(data: ConfirmWithInputData) {
        this.showME = true;
        this.title = data.title;
        this.message = data.message;
        this.inputPlaceHolder = data.inputPlaceHolder;
        this.inputType = data.inputType;
        this.confirmButtonText = data.confirmButtonText;
        this.cancelButtonText = data.cancelButtonText;
        this.inputRequired = data.inputRequired || false;
    }
}
