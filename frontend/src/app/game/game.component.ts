import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldService } from '../services/field.service';
import { JwtService } from '../services/jwt.service';
import { ObjectInterface, PlayerInterface } from '../interfaces/backend-body.interfaces';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GameService } from '../services/game.service';
import { FunctionCalculator, Point } from './FunctionCalculator';
import { ValidationService } from '../services/validation.service';
import {InfoComponent} from "../pop-up/info/info.component";
@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit, AfterViewInit {
    playersFieldParticles: PlayerInterface[] = [];
    players: { id: number; name: string; fieldParticle: PlayerInterface }[] = [];
    objects: ObjectInterface[] = [];
    fieldName = '';
    ratio = 20;
    functionForm: FormGroup;
    currentPlayer: { id: number; name: string; fieldParticle: PlayerInterface } | undefined;
    gameUUID = '';


    @ViewChild('field') field!: ElementRef<HTMLCanvasElement>;
    @ViewChild('functionDef') functionDefInput!: ElementRef<HTMLInputElement>;
    @ViewChild('infoComponent') infoComponent!: InfoComponent;
    constructor(
        private router: Router,
        private gameService: GameService,
        private jwt: JwtService,
        private activatedRoute: ActivatedRoute,
        private validationService: ValidationService
    ) {
        this.functionForm = new FormGroup(
            {
                functionDef: new FormControl('', {
                    validators: [Validators.required],
                }),
            },
            {
                validators: [this.validationService.mathFunctionValidator('functionDef')],
            }
        );

    }

    ngOnInit() {
        this.activatedRoute.paramMap.subscribe((params: any) => {
            const uuid: string = params.get('uuid');
            if (uuid) {
                this.gameUUID = uuid;
                console.log(uuid);
            } else {
                //TODO 404
            }
        });
        if (!this.jwt.isTokenValid()) {
            this.router.navigate(['/login']);
        } else {
            this.currentPlayer = this.players[0];
        }
        this.gameService.receiveFunction().subscribe((response: any) => {
            this.initGameDataFromResponse(response.game);
            this.animate(response.function);
        });
        this.gameService.gameEnded().subscribe((response: any) => {
            this.infoComponent.description = response.message;
            this.infoComponent.buttonText = 'Quit';
            this.infoComponent.buttonLink = '/';
        });
    }

    ngAfterViewInit() {
        this.sendGetGameData(this.gameUUID);
    }

    submitFunction() {
        if (this.functionForm.invalid || !this.itsMyTurn) {
            return;
        }
        this.gameService.submitFunction(this.gameUUID, this.functionDef).subscribe(
            (response: any) => {
                this.initGameDataFromResponse(response.game);
                // this.animate();
            },
            (error: any) => {
                console.log(error);
                this.infoComponent.description = error.error.message;
                this.infoComponent.buttonText = 'Ok';
                if(error.status===403 || error.status===404){
                    this.infoComponent.buttonLink = '/';
                }
                else{
                    this.infoComponent.buttonLink = '#';
                }

            }
        );
        // this.animate();
    }
    overrideInput(event: any) {
        if (event.key === 'x') {
            event.preventDefault();
            const start = this.functionDefInput.nativeElement.selectionStart;
            if (start === null) {
                return;
            }
            let value = this.functionDef;
            value = value.substring(0, start) + 'X' + value.substring(start);
            this.functionDefControl?.setValue(value);
        }
    }
    insertFunction(functionDef: string) {
        const start = this.functionDefInput.nativeElement.selectionStart;
        if (start === null) {
            return;
        }
        let value = this.functionDef;
        value = value.substring(0, start) + functionDef + value.substring(start);
        this.functionDefControl?.setValue(value);
    }
    initFunction(xLimit: number | undefined = undefined, fn?:string): FunctionCalculator {
        console.log('initFunction');
        console.log(fn? fn : this.functionDef);
        return new FunctionCalculator(
            fn? fn : this.functionDef,
            this.currentPlayer!.fieldParticle.location.x,
            this.currentPlayer!.fieldParticle.location.y,
            this.field.nativeElement.width,

            this.field.nativeElement.height,
            this.ratio,
            xLimit
        );
    }

    sendGetGameData(gameUUID: string) {
        this.gameService.getGameData(gameUUID).subscribe(
            (response: any) => {
                this.initGameDataFromResponse(response);
                this.draw();
            },
            (error: any) => {
                console.log(this.infoComponent);
                console.log(error);
                this.infoComponent.description = error.error.message;
                this.infoComponent.buttonText = 'Ok';
                if(error.status===403 || error.status===404){
                    this.infoComponent.buttonLink = '/';
                }
                else{
                    this.infoComponent.buttonLink = '#';
                }
            }
        );
    }

    initGameDataFromResponse(res: any) {
        this.players = res.players;
        this.objects = res.field.field.objects;
        this.fieldName = res.field.field.name;
        this.playersFieldParticles = res.field.field.players;
        this.currentPlayer = res.currentPlayer;
        if(this.itsMyTurn){
            this.functionDefControl?.enable();
        }
        else{
            this.functionDefControl?.disable();
        }
    }

    animate(fn?:string) {
        console.log('animate');
        console.log(fn);
        let tickCount = 0;
        const ticksPerSecond = 60;
        const tickRate = 1000 / ticksPerSecond;
        const unitPerTick = 0.3;
        const timer = setInterval(() => {
            tickCount++;
            this.draw(tickCount * this.ratio * unitPerTick, fn);
            if (tickCount * this.ratio * unitPerTick >= this.field.nativeElement.width) {
                clearInterval(timer);
            }
        }, tickRate);
    }

    drawFunction(xLimit: number, func?: string) {
        console.log('drawFunction');
        console.log(func);
        //if func is undefined, then we are drawing the function of the current player
        if ((this.functionDef === '' || !this.currentPlayer) && !func){
            return;
        }
        const fn = this.initFunction(xLimit, func);
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = 'red';
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(fn.firstValidPoint()!.x, fn.firstValidPoint()!.y); //firstValidPoint is already validated
            console.log(fn.firstValidPoint());
            ctx.lineWidth = 2;
            const rightSidePoints = fn.calculateRightSidePoints();
            console.log(rightSidePoints);
            for (const point of rightSidePoints) {
                ctx.lineTo(point.x, point.y);
                ctx.moveTo(point.x, point.y);
            }
            if (rightSidePoints.length > 0) {
                ctx.arc(
                    rightSidePoints[rightSidePoints.length - 1].x,
                    rightSidePoints[rightSidePoints.length - 1].y,
                    2,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
            ctx.moveTo(fn.firstValidPoint()!.x, fn.firstValidPoint()!.y); //firstValidPoint is already validated
            const leftSidePoints = fn.calculateLeftSidePoints();
            console.log(leftSidePoints);
            for (const point of leftSidePoints) {
                ctx.lineTo(point.x, point.y);
                ctx.moveTo(point.x, point.y);
            }
            if (leftSidePoints.length > 0) {
                ctx.arc(
                    leftSidePoints[leftSidePoints.length - 1].x,
                    leftSidePoints[leftSidePoints.length - 1].y,
                    2,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
            ctx.stroke();
        }
    }

    drawObjects() {
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            for (let i = 0; i < this.objects.length; i++) {
                if (this.objects[i].type == 'Ellipse') {
                    ctx.ellipse(
                        this.objects[i].location.x,
                        this.objects[i].location.y,
                        this.objects[i].dimension.width / 2,
                        this.objects[i].dimension.height / 2,
                        0,
                        0,
                        2 * Math.PI
                    );
                    ctx.fill();
                } else {
                    ctx.fillRect(
                        this.objects[i].location.x,
                        this.objects[i].location.y,
                        this.objects[i].dimension.width,
                        this.objects[i].dimension.height
                    );
                }
            }
            ctx.closePath();
        }
    }
    drawLines() {
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx && this.currentPlayer) {
            const canvasWidth = this.field.nativeElement.width;
            const canvasHeight = this.field.nativeElement.height;
            const playerX = this.currentPlayer.fieldParticle.location.x / this.ratio;
            const playerY = this.currentPlayer.fieldParticle.location.y / this.ratio;
            for (let i = playerX; i < canvasWidth / this.ratio; i++) {
                if (Math.round(i) == Math.round(playerX)) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
                } else {
                    ctx.strokeStyle = 'rgba(102, 102, 102, 0.2)';
                }
                ctx.beginPath();
                ctx.moveTo(i * this.ratio, 0);
                ctx.lineTo(i * this.ratio, canvasHeight);
                ctx.stroke();
                ctx.closePath();
            }
            for (let i = playerX; i > 0; i--) {
                ctx.beginPath();
                ctx.moveTo(i * this.ratio, 0);
                ctx.lineTo(i * this.ratio, canvasHeight);
                ctx.stroke();
                ctx.closePath();
            }
            for (let i = playerY; i < canvasHeight / this.ratio; i++) {
                if (Math.round(i) == Math.round(playerY)) {
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
                } else {
                    ctx.strokeStyle = 'rgba(102, 102, 102, 0.2)';
                }
                ctx.beginPath();
                ctx.moveTo(0, i * this.ratio);
                ctx.lineTo(canvasWidth, i * this.ratio);
                ctx.stroke();
                ctx.closePath();
            }
            for (let i = playerY; i > 0; i--) {
                ctx.beginPath();
                ctx.moveTo(0, i * this.ratio);
                ctx.lineTo(canvasWidth, i * this.ratio);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
    drawPlayers() {
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'yellowgreen';
            ctx.beginPath();
            for (let i = 0; i < this.playersFieldParticles.length; i++) {
                ctx.ellipse(
                    this.playersFieldParticles[i].location.x,
                    this.playersFieldParticles[i].location.y,
                    this.playersFieldParticles[i].dimension.width,
                    this.playersFieldParticles[i].dimension.height,
                    0,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
            ctx.closePath();
        }
    }
    draw(xLimit: number = this.ratio, fn?:string) {
        console.log('draw');
        console.log(fn);
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, this.field.nativeElement.width, this.field.nativeElement.height);
        }
        this.drawObjects();
        this.drawPlayers();
        this.drawLines();
        this.drawFunction(xLimit, fn);
    }

    get functionDefState(): string {
        if (!this.functionDefControl?.touched) return '';
        return this.functionDefControl?.valid ? 'is-valid' : 'is-invalid';
    }
    getFunctionDefError(): string {
        console.log(this.functionDefControl?.errors);
        if (this.functionDefControl?.hasError('required')) return 'Function definition is required';
        if (this.functionDefControl?.hasError('invalidMathFunction')) {
            return this.functionDefControl?.getError('invalidMathFunction');
        }
        return '';
    }
    get functionDef(): string {
        return this.functionForm.get('functionDef')?.value;
    }
    get functionDefControl() {
        return this.functionForm.get('functionDef');
    }
    get validFunctions() {
        return FunctionCalculator.ValidFunctions;
    }

    get itsMyTurn() {
        return this.currentPlayer?.id === this.jwt.getDecodedAccessToken()?.id;
    }
}
