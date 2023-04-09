import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldService } from '../services/field.service';
import { JwtService } from '../services/jwt.service';
import { ObjectInterface, PlayerInterface } from '../interfaces/backend-body.interfaces';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GameService } from '../services/game.service';

@Component({
	selector: 'app-game',
	templateUrl: './game.component.html',
	styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit {

	playersFieldParticles: PlayerInterface[] = [];
	players: {id: number, name: string, fieldParticle:PlayerInterface}[] = [];
	objects: ObjectInterface[] = [];
	fieldName: string = "";
	ratio: number = 35;
	functionForm: FormGroup;
	currentPlayer: {id: number, name: string, fieldParticle:PlayerInterface} | undefined;
	gameUUID: string = "";


	@ViewChild('field') field!:ElementRef<HTMLCanvasElement>;
	
	constructor(private router: Router, private gameService:GameService, private jwt:JwtService, private activatedRoute: ActivatedRoute) {
		this.functionForm = new FormGroup({
			function: new FormControl('',{
				validators: [
					Validators.required,
				]
			})
		});
	}

	ngOnInit() {
		this.activatedRoute.paramMap.subscribe(
			(params:any) => {
				let uuid:string = params.get('uuid');
				if(uuid){
					this.gameUUID = uuid;
					console.log(uuid);
				}
				else{
					//TODO 404
				}
			}
		);
		if(!this.jwt.isTokenValid()) {
			this.router.navigate(['/login']);
		}
		else{
			this.currentPlayer = this.players[0];

		}
	}

	ngAfterViewInit(){
		this.sendGetGameData(this.gameUUID);
		this.listenGetGameData();
	}

	submitFunction(){
		if(this.validFunction(this.function)){
			this.animate();
		}
	}

	sendGetGameData(gameUUID: string){
		this.gameService.getGameData(gameUUID);
	}
	listenGetGameData(){
		this.gameService.listenGameData().subscribe(
			(response: any) => {
				console.log(response);
				this.players = response.players.map((player: any, index:number) => {
					return {
						id: index,
						name: player.name,
						fieldParticle: response.field.field.players
					}
				});
				this.objects = response.field.field.objects;
				this.fieldName = response.field.field.name;
				this.playersFieldParticles = response.field.field.players;
				this.currentPlayer = this.players[0];
				this.draw();
			},
			(error: any) => {
				//TODO handle error
			}
		);
	}


	animate(){
		let tickCount = 0;
		let ticksPerSecond = 60;
		let tickRate = 1000/ticksPerSecond;
		let unitPerTick = 0.3;
		let timer = setInterval(() => {
			tickCount++;
			this.draw(tickCount*this.ratio*unitPerTick);
			if(tickCount*this.ratio*unitPerTick >= this.field.nativeElement.width){
				clearInterval(timer);
			}
		}, tickRate);
	}

	async drawFunction(xLimit: number){
		let func = this.function;
		if(func==''){
			return;
		}
		if(!this.currentPlayer){
			return;
		}
		let ctx = this.field.nativeElement.getContext('2d');
		let canvasWidth = this.field.nativeElement.width;
		let canvasHeight = this.field.nativeElement.height;
		if(ctx){
			ctx.strokeStyle = "red";
			ctx.fillStyle = "red";
			let playerX = this.currentPlayer.fieldParticle.location.x;
			let playerY = this.currentPlayer.fieldParticle.location.y;
			ctx.beginPath();
			let firstValidPoint = this.findFirstValidPoint(xLimit, func);
			if(!firstValidPoint){
				console.log("No valid point found");
				throw new Error("No valid point found");
			}
			let fn = this.replaceXWithValue(func, playerX-firstValidPoint.x);
			let x;
			ctx.moveTo(firstValidPoint.x, firstValidPoint.y);
			ctx.lineWidth = 2;
			for(x = firstValidPoint.x; x < firstValidPoint.x + xLimit && x < canvasWidth; x++){
				fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
				// if((x-playerX)%this.ratio == 0){
				// 	console.log(fn);
				// 	console.log(eval(fn));
				// 	console.log("line to x:", x);
				// 	console.log("line to y:", playerY-eval(fn)*this.ratio);
				// }
				if(Number.isInteger(Math.round(playerY - eval(fn)*this.ratio)) ){
					if(Math.round(playerY - eval(fn)*this.ratio) > 30_000 || Math.round(playerY - eval(fn)*this.ratio) < -30_000){
						break;
					}
					ctx.lineTo(x, Math.round(playerY - eval(fn)*this.ratio))
				}
				else{
					let toInfinity = this.leftSideInfinitiveSlope(xLimit, func);
					if(toInfinity == -Infinity){
						ctx.lineTo(x, 0);
						break;
					}
					else if(toInfinity == Infinity){
						ctx.lineTo(x, canvasHeight);
						break;
					}
				}
				ctx.moveTo(x, Math.round(playerY - eval(fn)*this.ratio))
			}
			ctx.arc(x, Math.round(playerY - eval(fn)*this.ratio), 5, 0, 2 * Math.PI);
			ctx.fill();
			fn = this.replaceXWithValue(func, playerX - firstValidPoint.x);
			ctx.moveTo(firstValidPoint.x, firstValidPoint.y);
			for(x = playerX; x > playerX-xLimit && x > 0; x--){
				fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
				// if((x-playerX)%this.ratio == 0){
				// 	console.log(fn);
				// 	console.log(eval(fn));
				// 	console.log(eval(fn)*this.ratio);
				// 	console.log("line to x:", x);
				// 	console.log("line to y:", playerY-eval(fn)*this.ratio);
				// }
				if(Number.isInteger(Math.round(playerY - eval(fn)*this.ratio)) ){
					if(Math.round(playerY - eval(fn)*this.ratio) > 30_000 || Math.round(playerY - eval(fn)*this.ratio) < -30_000){
						break;
					}
					ctx.lineTo(x, Math.round(playerY - eval(fn)*this.ratio))
				}
				else{
					let toInfinity = this.leftSideInfinitiveSlope(xLimit, func);
					if(toInfinity == -Infinity){
						ctx.lineTo(x, 0);
						break;
					}
					else if(toInfinity == Infinity){
						ctx.lineTo(x, canvasHeight);
						break;
					}
				}
				ctx.moveTo(x, Math.round(playerY - eval(fn)*this.ratio))
			}
			ctx.arc(x, Math.round(playerY - eval(fn)*this.ratio), 5, 0, 2 * Math.PI);
			ctx.fill();
			ctx.stroke();
		}
	}

	leftSideInfinitiveSlope(xLimit: number,func:string) : number{
		if(!this.currentPlayer){
			return 0;
		}
		let playerX = this.currentPlayer.fieldParticle.location.x;
		let playerY = this.currentPlayer.fieldParticle.location.y;
		let fn = this.replaceXWithValue(func, 0);
		for(let x = playerX; x > playerX-xLimit && x > 0; x--){
			fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
			if(Math.round(playerY - eval(fn)*this.ratio) == Infinity){
				return Infinity;
			}
			if(Math.round(playerY - eval(fn)*this.ratio) == -Infinity){
				return -Infinity;
			}
		}
		return 0;
	}

	rightSideInfinitiveSlope(xLimit: number,func:string) : number{
		if(!this.currentPlayer){
			return 0;
		}
		let playerX = this.currentPlayer.fieldParticle.location.x;
		let playerY = this.currentPlayer.fieldParticle.location.y;
		let fn = this.replaceXWithValue(func, 0);
		for(let x = playerX; x < playerX+xLimit && x > 0; x++){
			fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
			if(Math.round(playerY - eval(fn)*this.ratio) == Infinity){
				return Infinity;
			}
			else if(Math.round(playerY - eval(fn)*this.ratio) == -Infinity){
				return -Infinity;
			}
		}
		return 0;
	}

	findFirstValidPoint(xLimit: number, func:string) : {x: number, y: number} | undefined{
		if(!this.currentPlayer){
			return;
		}
		let playerX = this.currentPlayer.fieldParticle.location.x;
		let playerY = this.currentPlayer.fieldParticle.location.y;
		let fn = this.replaceXWithValue(func, 0);
		for(let x = playerX; x < playerX+xLimit && x > 0; x++){
			fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
			if(Number.isInteger(Math.round(playerY - eval(fn)*this.ratio)) ){
				return {x: x, y: Math.round(playerY - eval(fn)*this.ratio)};
			}
		}
		for(let x = playerX; x > playerX-xLimit && x > 0; x--){
			fn = this.replaceXWithValue(func, (x-playerX)/this.ratio);
			if(Number.isInteger(Math.round(playerY - eval(fn)*this.ratio)) ){
				return {x: x, y: Math.round(playerY - eval(fn)*this.ratio)};
			}
		}
		return undefined;
	}

	validFunction(func: string) : boolean{
		if(!this.currentPlayer){
			return false;
		}
		let playerX = this.currentPlayer.fieldParticle.location.x;
		let playerY = this.currentPlayer.fieldParticle.location.y;
		let fn = this.replaceXWithValue(func, 0);
		if(Number.isNaN(Math.round(playerY - eval(fn)*this.ratio)) ){
			return false;
		}
		return true;
	}

	replaceXWithValue(func: string, value:number) : string{
		let fn = func.replaceAll("X", value.toString());
		return fn;
	}






	drawObjects(){
		let ctx = this.field.nativeElement.getContext('2d');
		if(ctx){
			ctx.fillStyle = "blue";
			ctx.beginPath();
			for(let i = 0; i < this.objects.length; i++){
				if(this.objects[i].type == "Ellipse"){
					ctx.ellipse(this.objects[i].location.x, this.objects[i].location.y, this.objects[i].dimension.width/2, this.objects[i].dimension.height/2, 0, 0, 2 * Math.PI);
					ctx.fill();
				}
				else{
					ctx.fillRect(this.objects[i].location.x, this.objects[i].location.y, this.objects[i].dimension.width, this.objects[i].dimension.height);
				}

			}
			ctx.closePath();
		}
	}
	drawLines(){
		let ctx = this.field.nativeElement.getContext('2d');
		if(ctx){
			ctx.strokeStyle = "rgba(102, 102, 102, 0.3)";
			let canvasWidth = this.field.nativeElement.width;
			let canvasHeight = this.field.nativeElement.height;
			for(let i = 0; i < canvasWidth/this.ratio; i++){
				ctx.beginPath();
				ctx.moveTo(i*this.ratio, 0);
				ctx.lineTo(i*this.ratio, canvasHeight);
				ctx.stroke();
				ctx.closePath();
			}
			for(let i = 0; i < canvasHeight/this.ratio; i++){
				ctx.beginPath();
				ctx.moveTo(0, i*this.ratio);
				ctx.lineTo(canvasWidth, i*this.ratio);
				ctx.stroke();
				ctx.closePath();
			}
		}
	}
	drawPlayers(){
		let ctx = this.field.nativeElement.getContext('2d');
		if(ctx){
			ctx.fillStyle = "yellowgreen";
			ctx.beginPath();
			for(let i = 0; i < this.playersFieldParticles.length; i++){
				ctx.ellipse(this.playersFieldParticles[i].location.x, this.playersFieldParticles[i].location.y, this.playersFieldParticles[i].dimension.width, this.playersFieldParticles[i].dimension.height, 0, 0, 2 * Math.PI);
				ctx.fill();
			}
			ctx.closePath();
		}
	}
	draw(xLimit: number = this.ratio){
		let ctx = this.field.nativeElement.getContext('2d');
		if(ctx){
			ctx.clearRect(0, 0, this.field.nativeElement.width, this.field.nativeElement.height);
		}
		this.drawObjects();
		this.drawPlayers();
		this.drawLines();
		this.drawFunction(xLimit);
	}


	get function(): string{
		return this.functionForm.get('function')?.value;
	}
}