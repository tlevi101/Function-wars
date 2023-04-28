import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Dimension, Ellipse, Shape, Point, Rectangle } from './Shape';
import { Player } from './Player';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FieldService } from '../services/field.service';
import { FieldBodyInterface, ObjectInterface, PlayerInterface } from '../interfaces/backend-body.interfaces';
import { JwtService } from '../services/jwt.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-field-editor',
    templateUrl: './field-editor.component.html',
    styleUrls: ['./field-editor.component.scss'],
})
export class FieldEditorComponent implements OnInit {
    fieldParticles = new Map<number, Shape | Player>();
    mouseOnHold = false;
    fieldSubmitForm: FormGroup;

    @ViewChild('field') field!: ElementRef<HTMLCanvasElement>;
    @ViewChild('widthRange') widthRange!: ElementRef<HTMLInputElement>;
    @ViewChild('heightRange') heightRange!: ElementRef<HTMLInputElement>;
    @ViewChild('playerCountRange') playerCountRange!: ElementRef<HTMLInputElement>;

    constructor(
        private fieldService: FieldService,
        private jwt: JwtService,
        private router: Router,
        private activeRoute: ActivatedRoute
    ) {
        this.fieldSubmitForm = new FormGroup({
            fieldName: new FormControl('', [Validators.required, Validators.minLength(4)]),
        });
    }

    ngOnInit(): void {
        if (!this.jwt.isTokenValid()) {
            this.router.navigate(['/login']);
        }
		if(this.jwt.isGuestToken()) {
            this.router.navigate(['/']);
		}
        if (this.router.url !== '/field/new') {
            this.activeRoute.paramMap.subscribe(async params => {
                const id = params.get('id');
                if (id !== null) {
                    await this.sendGetFieldRequest(parseInt(id));
                    this.drawObjects();
                } else {
                    //TODO 404
                }
            });
        }
    }

    async sendGetFieldRequest(id: number) {
        await this.fieldService
            .getField(id)
            .toPromise()
            .then(
                (res: any) => {
                    this.fieldName = res.field.name;
                    this.setFieldNameTouched();
                    this.loadFieldParticlesFromJSON(res.field.field.players, res.field.field.objects);
                },
                err => {
                    //TODO handle error
                    console.log(err);
                }
            );
    }

    async saveField() {
        if (!(await this.validateField)) {
            return;
        }
        const fieldParticlesAsJson = await this.fieldParticlesToJSON();
        const body: FieldBodyInterface = {
            name: this.fieldName!.value,
            field: {
                dimension: { width: this.field.nativeElement.width, height: this.field.nativeElement.height },
                players: fieldParticlesAsJson.players,
                objects: fieldParticlesAsJson.objects,
            },
        };
        if (this.router.url === '/field/new') {
            this.fieldService.postField(body).subscribe(
                res => {
                    this.router.navigate(['/my-fields']);
                },
                err => {
                    //TODO handle error
                    console.log(err);
                }
            );
        } else {
            const id = this.activeRoute.snapshot.paramMap.get('id');
            if (id === null) {
                this.router.navigate(['/my-fields']);
                return;
            }
            this.fieldService.putField(parseInt(id), body).subscribe(
                res => {
                    this.router.navigate(['/my-fields']);
                },
                err => {
                    //TODO handle error
                    console.log(err);
                }
            );
        }
    }

    widthChange() {
        const size = this.fieldParticles.size;
        const particle = this.fieldParticles.get(size);
        if (!particle || particle instanceof Player) {
            return;
        }
        particle.width = parseInt(this.widthRange.nativeElement.value);
        this.drawObjects();
    }

    heightChange() {
        const size = this.fieldParticles.size;
        const particle = this.fieldParticles.get(size);
        if (!particle || particle instanceof Player) return;
        particle.height = parseInt(this.heightRange.nativeElement.value);
        this.drawObjects();
    }

    addPlayer() {
        const loc: Point = new Point(450, 300);
        const size = this.fieldParticles.size;
        this.fieldParticles.set(size + 1, new Player(loc));
        this.drawObjects();
    }

    addCircle() {
        const loc: Point = new Point(450, 300);
        const dim: Dimension = { width: 110, height: 110 };
        const size = this.fieldParticles.size;
        this.fieldParticles.set(size + 1, new Ellipse(loc, dim));
        this.modifyObjectControls();
        this.drawObjects();
    }

    addRectangle() {
        const loc: Point = new Point(450, 300);
        const dim: Dimension = { width: 110, height: 110 };
        const size = this.fieldParticles.size;
        this.fieldParticles.set(size + 1, new Rectangle(loc, dim));
        this.modifyObjectControls();
        this.drawObjects();
    }

    removeSelected() {
        const size = this.fieldParticles.size;
        this.fieldParticles.delete(size);
        this.drawObjects();
    }

    async mouseMoved(event: any) {
        if (!this.mouseOnHold) return;
        const size = this.fieldParticles.size;
        if (!this.fieldParticles.get(size)) return;
        this.fieldParticles.get(size)!.Location = new Point(event.offsetX, event.offsetY);
        await this.validateField();
        this.drawObjects();
    }

    async mouseDown(event: any) {
        const size = this.fieldParticles.size;
        if (!this.fieldParticles.get(size)) return;
        this.mouseOnHold = true;
        const clickPos = new Point(event.offsetX, event.offsetY);
        await this.switchParticleAtPoint(clickPos);
        if (this.fieldParticles.get(size) instanceof Ellipse) {
            this.modifyObjectControls();
        }
        if (this.fieldParticles.get(size) instanceof Rectangle) {
            this.modifyObjectControls();
        }
        await this.mouseMoved(event);
    }

    modifyObjectControls() {
        if (!this.lastParticle) return;
        if (this.lastParticle instanceof Ellipse) {
            this.heightRange.nativeElement.value = (this.lastParticle.Dimension.height * 2).toString();
            this.widthRange.nativeElement.value = (this.lastParticle.Dimension.width * 2).toString();
        }
        if (this.lastParticle instanceof Rectangle) {
            this.heightRange.nativeElement.value = this.lastParticle.Dimension.height.toString();
            this.widthRange.nativeElement.value = this.lastParticle.Dimension.width.toString();
        }
    }
    drawObjects() {
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx === null) return;
        ctx.clearRect(0, 0, this.field.nativeElement.width, this.field.nativeElement.height);
        const iter = this.fieldParticles.values();
        if (iter === null) return;
        const size = this.fieldParticles.size;
        let i = 0;
        for (let current = iter.next(); !current.done; current = iter.next()) {
            console.log(current);
            const particle = current.value;
            const done = i === size - 1;
            const loc = particle.Location;
            const dim = particle.Dimension;
            ctx.beginPath();
            const avoidLoc = new Point(particle.AvoidArea.Location.x, particle.AvoidArea.Location.y);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.arc(avoidLoc.x, avoidLoc.y, particle.AvoidArea.Radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            ctx.beginPath();
            if (particle instanceof Player) {
                if (done) {
                    ctx.strokeStyle = 'greenyellow';
                    ctx.fillStyle = 'greenyellow';
                } else {
                    ctx.strokeStyle = 'green';
                    ctx.fillStyle = 'green';
                }
            } else if (done) {
                ctx.strokeStyle = 'red';
                ctx.fillStyle = 'red';
            } else {
                ctx.strokeStyle = 'black';
                ctx.fillStyle = 'black';
            }
            if (particle instanceof Ellipse || particle instanceof Player) {
                ctx.ellipse(loc.x, loc.y, dim.width, dim.height, 0, 0, 2 * Math.PI);
            } else if (particle instanceof Rectangle) ctx.rect(loc.x, loc.y, dim.width, dim.height);
            ctx.fill();
            ctx.closePath();
            i++;
        }
    }

    get playerCount() {
        const iter = this.fieldParticles.values();
        if (!iter) return 0;
        let count = 0;
        for (let current = iter.next(); !current.done; current = iter.next()) {
            if (current.value instanceof Player) count++;
        }
        return count;
    }

    get objectsCount() {
        const iter = this.fieldParticles.values();
        if (!iter) return 0;
        let count = 0;
        for (let current = iter.next(); !current.done; current = iter.next()) {
            if (current.value instanceof Shape) count++;
        }
        return count;
    }

    get fieldNameError() {
        if (this.fieldName?.hasError('required')) return 'You must enter a field name';
        if (this.fieldName?.hasError('minlength')) return 'Field name must be at least 4 characters long';
        return '';
    }

    get fieldNameState() {
        if (!this.fieldName?.touched) return '';
        if (this.fieldName?.invalid) return 'is-invalid';
        return 'is-valid';
    }
    get fieldSubmitFormErrors() {
        if (this.fieldSubmitForm.hasError('noIntersections'))
            return 'Players must not intersect with each other or with objects';
        if (this.fieldSubmitForm.hasError('playerCount')) return 'Player count must be equal to the number of players';
        return '';
    }
    get fieldSubmitFormValid() {
        if (!this.fieldSubmitForm.touched) return false;
        if (this.fieldSubmitForm.invalid) return false;
        return true;
    }

    get fieldName() {
        return this.fieldSubmitForm.get('fieldName');
    }
    set fieldName(value) {
        this.fieldSubmitForm.get('fieldName')?.setValue(value);
    }

    setFieldNameTouched() {
        this.fieldName?.markAsTouched();
    }

    private async fieldParticlesToJSON(): Promise<{ players: PlayerInterface[]; objects: ObjectInterface[] }> {
        const players: PlayerInterface[] = (
            await this.filterParticles((object: Shape | Player) => {
                return object instanceof Player;
            })
        ).map((player: Player | Shape) => {
            const result: PlayerInterface = {
                location: { x: player.Location.x, y: player.Location.y },
                dimension: { width: player.Dimension.width, height: player.Dimension.height },
                avoidArea: {
                    location: { x: player.AvoidArea.Location.x, y: player.AvoidArea.Location.y },
                    radius: player.AvoidArea.Radius,
                },
            };
            return result;
        });
        const objects: ObjectInterface[] = (
            await this.filterParticles((object: Shape | Player) => {
                return object instanceof Shape;
            })
        ).map((object: Shape | Player) => {
            const type = object instanceof Rectangle ? 'Rectangle' : 'Ellipse';
            const dimension =
                object instanceof Rectangle
                    ? object.Dimension
                    : { width: object.Dimension.width * 2, height: object.Dimension.height * 2 };
            const result: ObjectInterface = {
                type: type,
                location: { x: object.Location.x, y: object.Location.y },
                dimension: dimension,
                avoidArea: {
                    location: { x: object.AvoidArea.Location.x, y: object.AvoidArea.Location.y },
                    radius: object.AvoidArea.Radius,
                },
            };
            return result;
        });
        return {
            players: players,
            objects: objects,
        };
    }

    private loadFieldParticlesFromJSON(players: PlayerInterface[], objects: ObjectInterface[]) {
        let key = 1;
        for (const object of objects) {
            if (object.type == 'Rectangle') {
                this.fieldParticles.set(
                    key,
                    new Rectangle(new Point(object.location.x, object.location.y), {
                        width: object.dimension.width,
                        height: object.dimension.height,
                    })
                );
            } else {
                this.fieldParticles.set(
                    key,
                    new Ellipse(new Point(object.location.x, object.location.y), {
                        width: object.dimension.width,
                        height: object.dimension.height,
                    })
                );
            }
            key++;
        }
        for (const player of players) {
            this.fieldParticles.set(key, new Player(new Point(player.location.x, player.location.y)));
            key++;
        }
    }
    async validateField(): Promise<boolean> {
        const players = await this.filterParticles((object: Shape | Player) => {
            return object instanceof Player;
        });
        const objects = await this.filterParticles((object: Shape | Player) => {
            return object instanceof Shape;
        });
        let noIntersections = true;
        for (const player of players) {
            for (const object of objects) {
                if (player.AvoidArea.intersectsWith(object.AvoidArea)) {
                    noIntersections = false;
                    break;
                }
            }
            for (const player2 of players) {
                if (!Object.is(player, player2) && player.AvoidArea.intersectsWith(player2.AvoidArea)) {
                    noIntersections = false;
                    break;
                }
            }
        }
        const valid = this.playerCount == this.playerCountRange.nativeElement.valueAsNumber && noIntersections;
        if (!valid) {
            if (!noIntersections) this.fieldSubmitForm.setErrors({ noIntersections: true });
            if (this.playerCount != this.playerCountRange.nativeElement.valueAsNumber)
                this.fieldSubmitForm.setErrors({ playerCount: true });
        } else {
            this.fieldSubmitForm.setErrors(null);
        }
        return valid;
    }

    async findParticleAtPoint(point: Point): Promise<{ index: number; particle: Shape | Player } | null> {
        if (this.fieldParticles.size == 0) return null;
        const iter = this.fieldParticles.values();
        let index = 0;
        do {
            const particle = iter.next().value;
            index++;
            if (await particle.pointInside(point)) return { index: index, particle };
        } while (index < this.fieldParticles.size);
        return null;
    }

    async switchParticleAtPoint(point: Point) {
        const particle = await this.findParticleAtPoint(point);
        console.log('found particle:');
        console.log(particle);
        const size = this.fieldParticles.size;
        if (particle === null) return;
        const tmp = this.fieldParticles.get(size)!;
        this.fieldParticles.set(size, particle.particle);
        this.fieldParticles.set(particle.index, tmp);
    }

    get lastParticle() {
        return this.fieldParticles.get(this.fieldParticles.size);
    }

    async filterParticles(where: (particle: Shape | Player) => boolean) {
        const iter = this.fieldParticles.values();
        const result: (Shape | Player)[] = [];
        for (let current = iter.next(); !current.done; current = iter.next()) {
            if (where(current.value)) {
                result.push(current.value);
            }
        }
        return result;
    }
}
