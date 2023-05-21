import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FieldService } from '../services/field.service';
import { FieldResponseInterface } from '../interfaces/backend-body.interfaces';

@Component({
    selector: 'app-scale-able-field',
    templateUrl: './scale-able-field.component.html',
    styleUrls: ['./scale-able-field.component.scss'],
})
export class ScaleAbleFieldComponent implements OnInit, AfterViewInit {
    @Input() scale = 0.5;
    @Input() fieldId = 0;
    @ViewChild('field') fieldCanvas!: ElementRef<HTMLCanvasElement>;
    field: FieldResponseInterface | undefined;
    constructor(private fieldService: FieldService) {}

    ngOnInit(): void {
        this.sendGetFieldRequest();
    }

    ngAfterViewInit() {
        this.sendGetFieldRequest();
    }

    sendGetFieldRequest() {
        const subscription = this.fieldService.showField(this.fieldId).subscribe(
            (res: any) => {
                this.field = res.field;
                this.draw();
            },
            (err: any) => {
                console.log(err);
            },
            () => {
                subscription.unsubscribe();
            }
        );
    }

    drawObjects() {
        const ctx = this.fieldCanvas.nativeElement.getContext('2d');
        const objects = this.field?.field.objects;
        console.log(this.field);
        if (ctx && objects) {
            ctx.fillStyle = 'blue';
            for (let i = 0; i < objects.length; i++) {
                ctx.beginPath();
                if (objects[i].type == 'Ellipse') {
                    ctx.ellipse(
                        objects[i].location.x * this.scale,
                        objects[i].location.y * this.scale,
                        (objects[i].dimension.width / 2) * this.scale,
                        (objects[i].dimension.height / 2) * this.scale,
                        0,
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                } else {
                    ctx.fillRect(
                        objects[i].location.x * this.scale,
                        objects[i].location.y * this.scale,
                        objects[i].dimension.width * this.scale,
                        objects[i].dimension.height * this.scale
                    );
                }
                ctx.closePath();
            }
        }
    }

    drawPlayers() {
        const ctx = this.fieldCanvas.nativeElement.getContext('2d');
        const players = this.field?.field.players;
        if (ctx && players) {
            ctx.fillStyle = 'yellowgreen';
            for (let i = 0; i < players.length; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    players[i].location.x * this.scale,
                    players[i].location.y * this.scale,
                    players[i].dimension.width * this.scale,
                    players[i].dimension.height * this.scale,
                    0,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    draw() {
        this.drawObjects();
        this.drawPlayers();
    }
}
