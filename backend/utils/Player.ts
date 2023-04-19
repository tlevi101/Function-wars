import { Shape, Circle, Ellipse } from './Shape';
import { Point } from './Shape';
import { Dimension } from './Shape';
import { PlayerInterface } from './interfaces';

class Player {
    private id: number;
    private name: string;
    private object: Ellipse;
    private avoidArea: Circle;
    constructor(location: Point, id: number, name: string) {
        this.object = new Ellipse(location, { width: 80, height: 80 });
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
            dimension: this.object.Dimension,
            avoidArea: this.avoidArea.toJSON(),
        };
    }
    async pointInside(point: Point): Promise<boolean> {
        return await this.object.pointInside(point);
    }
    get Shape(): Ellipse {
        return this.object;
    }
    get Location(): Point {
        return this.object.Location;
    }
    set Location(value: Point) {
        this.object.Location = value;
        this.avoidArea.Location = value;
    }
    get Dimension(): Dimension {
        return this.object.Dimension;
    }
    get AvoidArea(): Circle {
        return this.avoidArea;
    }
    get ID(): number {
        return this.id;
    }
    get Name(): string {
        return this.name;
    }
}
export = Player;
