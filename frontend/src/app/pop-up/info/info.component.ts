import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.scss'],
})
export class InfoComponent {
    @Input() description = '';
    @Input() buttonText = 'Ok';
    @Input() buttonLink = '#';
    @Output() closeEvent = new EventEmitter();
    constructor(private currentRoute: ActivatedRoute, private router: Router) {}
    close() {
        this.description = '';
        this.buttonLink = '#';
        this.closeEvent.emit();
    }
}
