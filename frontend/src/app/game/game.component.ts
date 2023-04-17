import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldService } from '../services/field.service';
import { JwtService } from '../services/jwt.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GameService } from '../services/game.service';
import { FunctionCalculator, Point } from './utils/FunctionCalculator';
import { ValidationService } from '../services/validation.service';
import { InfoComponent } from '../pop-up/info/info.component';
import {GameInterface, ObjectInterface, PlayerInterface} from "./utils/Interfaces";
@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
    players: PlayerInterface[] = [];
    objects: ObjectInterface[] = [];
    fieldName = '';
    ratio = 35;
    functionForm: FormGroup;
    currentPlayer: PlayerInterface | undefined;
    gameUUID = '';
    lastFunctionPoints: {leftSide: Point[], rightSide: Point[]} | undefined;
    myLocation: Point | undefined;

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

    ngOnDestroy(): void {
        this.gameService.leaveGame();
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
            const res = response as { points: { leftSide: Point[], rightSide: Point[] }};
            this.lastFunctionPoints = res.points;
            this.animate();
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
                // this.initGameDataFromResponse(response.game);
            },
            (error: any) => {
                console.log(error);
                this.infoComponent.description = error.error.message;
                this.infoComponent.buttonText = 'Ok';
                if (error.status === 403 || error.status === 404) {
                    this.infoComponent.buttonLink = '/';
                } else {
                    this.infoComponent.buttonLink = '#';
                }
            }
        );
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
        this.functionDefControl?.markAsTouched();
    }

    sendGetGameData(gameUUID: string) {
        this.gameService.getGameData(gameUUID).subscribe(
            async (response :any ) => {
                const game =  response as GameInterface;
                console.log(game);
                this.initGameDataFromResponse(game);
                this.draw();
            },
            (error: any) => {
                console.log(error);
                this.infoComponent.description = error.error.message;
                this.infoComponent.buttonText = 'Ok';
                if (error.status === 403 || error.status === 404) {
                    this.infoComponent.buttonLink = '/';
                } else {
                    this.infoComponent.buttonLink = '#';
                }
            }
        );
    }

    initGameDataFromResponse(game : GameInterface) {
        this.players = game.players;
        this.objects = game.objects;
        this.fieldName = game.field.name;
        this.currentPlayer = game.currentPlayer;
        this.myLocation = game.players.find((player : PlayerInterface) => player.id === this.jwt.getDecodedAccessToken()?.id)?.location;
        if (this.itsMyTurn) {
            this.functionDefControl?.enable();
        } else {
            this.functionDefControl?.disable();
            this.functionDefControl?.markAsUntouched();
        }
    }

    animate() {
        let tickCount = 0;
        const ticksPerSecond = 60;
        const tickRate = 1000 / ticksPerSecond;
        const unitPerTick = 0.3;
        const timer = setInterval(() => {
            tickCount++;
            this.draw(tickCount * this.ratio * unitPerTick);
            if (tickCount * this.ratio * unitPerTick >= this.field.nativeElement.width) {
                console.log('clearInterval')
                this.sendGetGameData(this.gameUUID);
                clearInterval(timer);
            }
        }, tickRate);
    }

    drawFunction(xLimit: number) {
        if (!this.lastFunctionPoints) {
            return;
        }
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = 'red';
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(this.lastFunctionPoints.rightSide[0].x, this.lastFunctionPoints.rightSide[0].y);
            ctx.lineWidth = 2;
            const rightSidePoints = this.lastFunctionPoints.rightSide;
            // console.log(rightSidePoints);
            let i = 0;
            for (const point of rightSidePoints) {
                if(point.x > this.lastFunctionPoints.rightSide[0].x + xLimit) {
                    break;
                }
                ctx.lineTo(point.x, point.y);
                ctx.moveTo(point.x, point.y);
                i++;
            }
            if (rightSidePoints.length > 0) {
                ctx.arc(
                    rightSidePoints[i-1].x,
                    rightSidePoints[i-1].y,
                    2,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
            ctx.moveTo(this.lastFunctionPoints.rightSide[0].x, this.lastFunctionPoints.rightSide[0].y);
            const leftSidePoints = this.lastFunctionPoints.leftSide;
            i = 0;
            for (const point of leftSidePoints) {
                if(point.x < this.lastFunctionPoints.rightSide[0].x - xLimit) {
                    break;
                }
                i++;
                ctx.lineTo(point.x, point.y);
                ctx.moveTo(point.x, point.y);
            }
            if (leftSidePoints.length > 0) {
                ctx.arc(
                    leftSidePoints[i-1].x,
                    leftSidePoints[i-1].y,
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
            const playerX = this.myLocation ? this.myLocation.x / this.ratio : this.currentPlayer.location.x / this.ratio;
            const playerY = this.myLocation ? this.myLocation.y / this.ratio : this.currentPlayer.location.y / this.ratio;
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
            for (let i = 0; i < this.players.length; i++) {
                ctx.ellipse(
                    this.players[i].location.x,
                    this.players[i].location.y,
                    this.players[i].dimension.width,
                    this.players[i].dimension.height,
                    0,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            }
            ctx.closePath();
        }
    }
    draw(xLimit: number = this.field.nativeElement.width) {
        const ctx = this.field.nativeElement.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, this.field.nativeElement.width, this.field.nativeElement.height);
        }
        this.drawObjects();
        this.drawPlayers();
        this.drawLines();
        this.drawFunction(xLimit);
    }

    get functionDefState(): string {
        if (!this.functionDefControl?.touched) return '';
        return this.functionDefControl?.valid ? 'is-valid' : 'is-invalid';
    }
    getFunctionDefError(): string {
        // console.log(this.functionDefControl?.errors);
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
