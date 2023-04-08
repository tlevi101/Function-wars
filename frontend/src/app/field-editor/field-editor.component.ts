import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LinkedList } from './LinkedList';
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
  styleUrls: ['./field-editor.component.scss']
})
export class FieldEditorComponent implements OnInit {
	fieldParticles= new LinkedList<Shape | Player>();
	mouseOnHold = false;
	fieldSubmitForm: FormGroup;

	@ViewChild('field') field!: ElementRef<HTMLCanvasElement>;
	@ViewChild('widthRange') widthRange!: ElementRef<HTMLInputElement>;
	@ViewChild('heightRange') heightRange!: ElementRef<HTMLInputElement>;
	@ViewChild('playerCountRange') playerCountRange!: ElementRef<HTMLInputElement>;

	constructor(private fieldService: FieldService, private jwt: JwtService, private router: Router, private activeRoute: ActivatedRoute) {
		this.fieldSubmitForm = new FormGroup({
			fieldName: new FormControl('', [
				Validators.required, 
				Validators.minLength(4)
			]),
		});
	}

	ngOnInit(): void {
		if(!this.jwt.isTokenValid()){
			this.router.navigate(['/login']);
		}
		if(this.router.url !== '/field/new'){
			this.activeRoute.paramMap.subscribe(
				async (params) => {
					let id = params.get('id');
					if(id !== null){
						await this.sendGetFieldRequest(parseInt(id));
						this.drawObjects();
					}
					else{
						//TODO 404
					}
				}
			);

		}
	}

	async sendGetFieldRequest(id: number) {
		await this.fieldService.getField(id).toPromise().then(
			(res:any) => {
				this.fieldName= res.field.name;
				this.setFieldNameTouched();
				this.loadFieldParticlesFromJSON(res.field.field.players, res.field.field.objects);
			},
			(err) => {
				//TODO handle error
				console.log(err);
			}
		);
	}


	saveField() {
		if(!this.validateField){
			return;
		}
		let fieldParticlesAsJson = this.fieldParticlesToJSON();
		let body: FieldBodyInterface ={
			name: this.fieldName!.value,
			field: {
				dimension: {width: this.field.nativeElement.width, height: this.field.nativeElement.height},
				players: fieldParticlesAsJson.players,
				objects: fieldParticlesAsJson.objects
			}
		}
		if(this.router.url === '/field/new'){
			this.fieldService.postField(body).subscribe(
				(res) => {
					this.router.navigate(['/my-fields']);
				},
				(err) => {
					//TODO handle error
					console.log(err);
				}
			);
		}
		else{
			let id = this.activeRoute.snapshot.paramMap.get('id');
			if(id === null){
				this.router.navigate(['/my-fields']);
				return;
			}
			this.fieldService.putField(parseInt(id),body).subscribe(
				(res) => {
					this.router.navigate(['/my-fields']);
				},
				(err) => {
					//TODO handle error
					console.log(err);
				}
			);
		}
	}

	widthChange() {
		if(this.fieldParticles.Tail === null || this.fieldParticles.Tail instanceof Player) return;
		this.fieldParticles.Tail.width = parseInt(this.widthRange.nativeElement.value);
		this.drawObjects();
	}


	heightChange() {
		if(this.fieldParticles.Tail === null || this.fieldParticles.Tail instanceof Player) return;
		this.fieldParticles.Tail.height = parseInt(this.heightRange.nativeElement.value);
		this.drawObjects();
	}


	addPlayer() {
		const loc: Point = new Point(450, 300);
		this.fieldParticles.add(new Player(loc));
		this.drawObjects();
	}


	addCircle() {
		const loc: Point = new Point(450, 300);
		const dim: Dimension = {width: 110, height: 110 };
		this.fieldParticles.add(new Ellipse(loc, dim));
		this.modifyObjectControls();
		this.drawObjects();
	}


	addRectangle() {
		const loc: Point = new Point(450, 300);
		const dim: Dimension = {width: 110, height:110};
		this.fieldParticles.add(new Rectangle(loc, dim));
		this.modifyObjectControls();
		this.drawObjects();
	}

	removeSelected() {
		if(this.fieldParticles.Tail === null) return;
		this.fieldParticles.removeTail();
		this.drawObjects();
	}

	mouseMoved(event:any) {
		if(!this.mouseOnHold) return;
		if(this.fieldParticles.Tail === null) return;
		this.fieldParticles.Tail.Location = new Point(event.offsetX, event.offsetY);
		this.validateField();
		this.drawObjects();
	}

	mouseDown(event:any) {
		if(this.fieldParticles.Tail === null) return;
		this.mouseOnHold = true;
		let clickPos = new Point(event.offsetX, event.offsetY)
		let where = (shape: Shape | Player) => {
			if(shape instanceof Player)
				return shape.Shape.pointInside(clickPos);
			else
				return shape.pointInside(clickPos);
		}
		this.fieldParticles.toTailFirst(where);
		if(this.fieldParticles.Tail instanceof Ellipse){
			this.modifyObjectControls();
		}
		if(this.fieldParticles.Tail instanceof Rectangle){
			this.modifyObjectControls();
		}
		this.mouseMoved(event);
	}


	modifyObjectControls() {
		if(this.fieldParticles.Tail === null) return;
		if(this.fieldParticles.Tail instanceof Ellipse){
				this.heightRange.nativeElement.value = (this.fieldParticles.Tail.Dimension.height*2).toString();
				this.widthRange.nativeElement.value = (this.fieldParticles.Tail.Dimension.width*2).toString();
		}
		if(this.fieldParticles.Tail instanceof Rectangle){
				this.heightRange.nativeElement.value = this.fieldParticles.Tail.Dimension.height.toString();
				this.widthRange.nativeElement.value = this.fieldParticles.Tail.Dimension.width.toString();
		}
	}
	drawObjects() {
		let ctx = this.field.nativeElement.getContext("2d");
		if(ctx === null) return;
		ctx.clearRect(0, 0, this.field.nativeElement.width, this.field.nativeElement.height);
		let iter = this.fieldParticles.iterator();
		if(iter === null) return;
		do{
			const loc = iter.value!.Location;
			const dim = iter.value!.Dimension;
			ctx.beginPath();
			let avoidLoc = new Point(iter.value!.AvoidArea.Location.x, iter.value!.AvoidArea.Location.y);
			ctx.fillStyle =  "rgba(255, 0, 0, 0.1)"
			ctx.arc(avoidLoc.x, avoidLoc.y, iter.value!.AvoidArea.Radius, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			if(iter.value instanceof Player){
				if(!iter.hasNext()){
					ctx.strokeStyle = "greenyellow";
					ctx.fillStyle = "greenyellow";
				}
				else{
					ctx.strokeStyle = "green";
					ctx.fillStyle = "green";
				}
			}
			else if(!iter.hasNext()){
				ctx.strokeStyle = "red";
				ctx.fillStyle = "red";
			}
			else{
				ctx.strokeStyle = "black";
				ctx.fillStyle = "black";
			}
			if(iter.value instanceof Ellipse || iter.value instanceof Player){
				ctx.ellipse(loc.x, loc.y, dim.width, dim.height, 0, 0, 2 * Math.PI);
			}
			else if(iter.value instanceof Rectangle)
				ctx.rect(loc.x, loc.y, dim.width, dim.height);
			ctx.fill();
			ctx.closePath();
		} while(iter.next())
	}

	get playerCount(){
		let iter  = this.fieldParticles.iterator();
		if(iter === null) return 0;
		let count = 0;
		do{
			if(iter.value instanceof Player)
				count++;
		}while(iter.next());
		return count;
	}

	get objectsCount(){
		let iter  = this.fieldParticles.iterator();
		if(iter === null) return 0;
		let count = 0;
		do{
			if(iter.value instanceof Shape)
				count++;
		} while(iter.next());
		return count;
	}

	get fieldNameError(){
		if(this.fieldName?.hasError('required'))
			return 'You must enter a field name';
		if(this.fieldName?.hasError('minlength'))
			return 'Field name must be at least 4 characters long';
		return '';
	}

	get fieldNameState(){
		if(!this.fieldName?.touched)
			return '';
		if(this.fieldName?.invalid)
			return 'is-invalid';
		return 'is-valid';
	}
	get fieldSubmitFormErrors(){
		if(this.fieldSubmitForm.hasError('noIntersections'))
			return 'Players must not intersect with each other or with objects';
		if(this.fieldSubmitForm.hasError('playerCount'))
			return 'Player count must be equal to the number of players';
		return '';
	}
	get fieldSubmitFormValid(){
		if(!this.fieldSubmitForm.touched)
			return false;
		if(this.fieldSubmitForm.invalid)
			return false;
		return true;
	}

	get fieldName(){
		return this.fieldSubmitForm.get('fieldName');
	}
	set fieldName(value){
		this.fieldSubmitForm.get('fieldName')?.setValue(value);
	}

	setFieldNameTouched(){
		this.fieldName?.markAsTouched();
	}

	private fieldParticlesToJSON():{players: PlayerInterface[], objects: ObjectInterface[]}{
		let players: PlayerInterface[] = this.fieldParticles.filter((object: Shape | Player) => {return object instanceof Player}).map((player: Player | Shape) => {
			let result: PlayerInterface =  {
				location: {x: player.Location.x, y: player.Location.y},
				dimension: {width: player.Dimension.width, height: player.Dimension.height},
				avoidArea: {location: {x: player.AvoidArea.Location.x, y: player.AvoidArea.Location.y}, radius: player.AvoidArea.Radius}
			}
			return result;
		});
		let objects:ObjectInterface[] = this.fieldParticles.filter((object: Shape | Player) => {return object instanceof Shape}).map((object: Shape | Player ) => {
			let type = object instanceof Rectangle ? "Rectangle" : "Ellipse";
			let dimension = object instanceof Rectangle ? object.Dimension : {width: object.Dimension.width*2, height: object.Dimension.height*2};
			let result: ObjectInterface = {
				type: type,
				location: {x: object.Location.x, y: object.Location.y},
				dimension: dimension,
				avoidArea: {location: {x: object.AvoidArea.Location.x, y: object.AvoidArea.Location.y}, radius: object.AvoidArea.Radius}
			}
			return result;
		});
		return{
			players: players,
			objects: objects
		}
	}

	private loadFieldParticlesFromJSON(players: PlayerInterface[], objects: ObjectInterface[]){
		for (const player of players) {
			this.fieldParticles.add(new Player(new Point(player.location.x, player.location.y)));
		}
		for (const object of objects) {
			if(object.type == "Rectangle")
				this.fieldParticles.add(new Rectangle(new Point(object.location.x, object.location.y), {width:object.dimension.width, height:object.dimension.height}));
			else
				this.fieldParticles.add(new Ellipse(new Point(object.location.x, object.location.y), {width:object.dimension.width, height:object.dimension.height}));
		}
	}
	validateField(): boolean {
		let players = this.fieldParticles.filter((object: Shape | Player) => {return object instanceof Player});
		let objects = this.fieldParticles.filter((object: Shape | Player) => {return object instanceof Shape});
		let noIntersections = true;
		for (const player of players) {
			for (const object of objects) {
				if(player.AvoidArea.intersectsWith(object.AvoidArea)){
					noIntersections = false;
					break;
				}
			}
			for (const player2 of players) {
				if(!Object.is(player, player2) && player.AvoidArea.intersectsWith(player2.AvoidArea)){
					noIntersections = false;
					break;
				}
			}
		}
		let valid = this.playerCount == this.playerCountRange.nativeElement.valueAsNumber && noIntersections;
		if(!valid){
			if(!noIntersections)
				this.fieldSubmitForm.setErrors({'noIntersections': true});
			if(this.playerCount != this.playerCountRange.nativeElement.valueAsNumber)
				this.fieldSubmitForm.setErrors({'playerCount': true});
		}
		else{
			this.fieldSubmitForm.setErrors(null);
		}
		return valid;
	}

}
