import { Component, Input } from '@angular/core';
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
    constructor(private currentRoute: ActivatedRoute, private router: Router) {}
    close() {
        this.description = '';
        this.buttonLink = '#';
    }
}
