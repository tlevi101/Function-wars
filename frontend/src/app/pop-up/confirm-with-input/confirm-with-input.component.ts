import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';


export interface ConfirmWithInputData {
	readonly myName :'ConfirmWithInputData';
	title: string;
	message: string;
	inputPlaceHolder: string;
	inputType: string ;
	confirmButtonText: string;
	cancelButtonText: string;
}

@Component({
  selector: 'app-confirm-with-input',
  templateUrl: './confirm-with-input.component.html',
  styleUrls: ['./confirm-with-input.component.scss']
})
export class ConfirmWithInputComponent {
	  
	@Input() showME: boolean = false;
	@Input() title: string = 'Confirm';
	@Input() message: string = 'Are you sure?';
	@Input() inputPlaceHolder: string = 'Description';
	@Input() inputType: string = 'text';
	@Input() confirmButtonText: string = 'Confirm';
	@Input() cancelButtonText: string = 'Cancel';
	@Output() confirmEvent: EventEmitter<string> = new EventEmitter();
	@Output() cancelEvent = new EventEmitter();
	@ViewChild('confirmInput') input!: ElementRef;
	constructor() {

	}

	confirm(){
		this.showME = false;
		this.confirmEvent.emit(this.input.nativeElement.value);
	}

	cancel(){
		this.showME = false;
		this.cancelEvent.emit();
	}

	public show(data: ConfirmWithInputData){
		this.showME= true;
		this.title = data.title;
		this.message = data.message;
		this.inputPlaceHolder = data.inputPlaceHolder;
		this.inputType = data.inputType;
		this.confirmButtonText = data.confirmButtonText;
		this.cancelButtonText = data.cancelButtonText;
	}
}
