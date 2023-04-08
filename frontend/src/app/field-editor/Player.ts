import {Shape, AvoidArea, Ellipse } from "./Shape";
import { Point } from "./Shape";
import { Dimension } from "./Shape";


export class Player{
	private object: Ellipse;
	private avoidArea: AvoidArea;
	constructor(location: Point){
		this.object = new Ellipse(location, {width: 80, height: 80});
		this.avoidArea = new AvoidArea(location, 130);
	}
	public objectTooClose(object: Shape) : boolean{
		return this.avoidArea.intersectsWith(object.AvoidArea);
	}
	get Shape() : Ellipse{
		return this.object;
	}
	get Location() : Point{
		return this.object.Location;
	}
	set Location(value: Point){
		this.object.Location = value;
		this.avoidArea.Location = value;
	}
	get Dimension() : Dimension{
		return this.object.Dimension;
	}
	get AvoidArea() : AvoidArea{
		return this.avoidArea;
	}
}