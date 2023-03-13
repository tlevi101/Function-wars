import { Component, EventEmitter, Input, Output } from '@angular/core';

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

}
