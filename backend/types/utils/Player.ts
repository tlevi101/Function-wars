import { Shape, Circle, Ellipse } from './Shape';
import { Point } from './Shape';
import { Dimension } from './Shape';
import { PlayerInterface } from './interfaces';

class Player {
    private id: number | string;
    private name: string;
    private object: Circle;
    private avoidArea: Circle;
    private online: boolean = true;
    constructor(location: Point, id: number | string, name: string) {
        this.object = new Circle(location, 40);
        this.avoidArea = new Circle(location, 130);
        this.id = id;
        this.name = name;
    }
    public objectTooClose(object: Shape): boolean {
        return this.avoidArea.intersectsWith(object.AvoidArea);
    }
    toJSON(): PlayerInterface {
        return {
            id: this.id,
            name: this.name,
            location: this.object.Location,
            dimension: this.Dimension,
            avoidArea: this.avoidArea.toJSON(),
        };
    }

    async pointInside(point: Point): Promise<boolean> {
        return await this.object.pointIsInside(point);
    }
    get Shape(): Circle {
        return this.object;
    }
    get Location(): Point {
        return this.object.Location;
    }
    set Location(value: Point) {
        this.object.Location = value;
        this.avoidArea.Location = value;
    }
	/**

	 * @returns {Dimension} Dimension of the player, 
	*/
    get Dimension(): Dimension {
		//FIXME width and height is not being multiplied bcs frontend will do this anyway
        return { width: this.object.Radius, height: this.object.Radius};
    }
    get AvoidArea(): Circle {
        return this.avoidArea;
    }
    get ID(): number | string {
        return this.id;
    }
    get Name(): string {
        return this.name;
    }
    get Online(): boolean {
        return this.online;
    }
    public disconnect(): void {
        this.online = false;
    }
    public reconnect(): void {
        this.online = true;
    }
}
export = Player;
