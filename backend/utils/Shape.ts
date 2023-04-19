import {ObjectInterface, PointInterface} from "./interfaces";

export class Point {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    public distance(p: Point): number {
        const d = Math.sqrt(Math.pow(Math.abs(this.x - p.x), 2) + Math.pow(Math.abs(this.y - p.y), 2));
        return d;
    }

    public toJSON(): PointInterface {
        return {
            x: this.x,
            y: this.y
        };
    }

    public equals(p:Point):boolean{
        return this.x === p.x && this.y === p.y;
    }
}

export interface Dimension {
    width: number;
    height: number;
}

export class Shape {
    protected location: Point;
    protected dimension: Dimension;
    protected avoidArea: Circle;
    protected damages: DamageCircle[] = [];
    constructor(location: Point, dimension: Dimension) {
        this.location = location;
        this.dimension = dimension;
        this.avoidArea = new Circle(location, Math.round(dimension.width / 2) + 50);
    }

    /**
     * This method will create a damage circle and add it to the damages array,
     * if the point is not inside the shape, it will throw an error.
     * @param point
     */
    public damageMe(point:Point, distance:number):DamageCircle{
        if(!this.pointInside(point)){
            throw new Error('I cannot be damaged, point is not inside!');
        }
        const damage = new DamageCircle(point, distance);
        this.damages.push(damage);
        return damage;
    }
    public toJSON(): ObjectInterface {
        throw new Error('Method not implemented.');
    }
    public async pointInside(point: Point): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    protected async pointIsInsideOfADamage(point:Point):Promise<boolean>{
        for await (const damage of this.damages){
            if(damage.pointIsInside(point)){
                return true;
            }
        }
        return false;
    }
    get Dimension(): Dimension {
        return this.dimension;
    }
    set Dimension(dimension: Dimension) {
        this.dimension = dimension;
        this.avoidArea.Location = this.location;
        this.changeAvoidAreaRadius();
        this.changeAvoidAreaLocation();
    }
    get Location(): Point {
        return this.location;
    }
    set Location(location: Point) {
        this.location = location;
        this.changeAvoidAreaLocation();
    }
    set width(width: number) {
        this.dimension.width = width;
        this.changeAvoidAreaLocation();
        this.changeAvoidAreaRadius();
    }
    set height(height: number) {
        this.dimension.height = height;
        this.changeAvoidAreaLocation();
        this.changeAvoidAreaRadius();
    }
    changeAvoidAreaRadius() {
        if (this.dimension.width > this.dimension.height) {
            this.avoidArea.Radius = Math.round(this.dimension.width / 2) + 50;
        } else {
            this.avoidArea.Radius = Math.round(this.dimension.height / 2) + 50;
        }
    }
    changeAvoidAreaLocation() {
        this.avoidArea.Location = this.location;
    }
    get AvoidArea(): Circle {
        return this.avoidArea;
    }
    get Damages(): DamageCircle[] {
        return this.damages;
    }
}

export class Ellipse extends Shape {
    constructor(location: Point, dimension: Dimension) {
        super(location, { width: Math.round(dimension.width / 2), height: Math.round(dimension.height / 2) });
        this.changeAvoidAreaRadius();
    }
    public override async pointInside(point: Point): Promise<boolean> {
        if(this.damages.length>0 && await this.pointIsInsideOfADamage(point)){
            return false;
        }
        const x = point.x - this.Location.x;
        const y = point.y - this.Location.y;
        const a = this.Dimension.width;
        const b = this.Dimension.height;
        return (x * x) / (a * a) + (y * y) / (b * b) <= 1;
    }

    public toJSON(): ObjectInterface {
        return {
            type: "Ellipse",
            location: this.location.toJSON(),
            dimension: this.dimension,
            avoidArea: this.avoidArea.toJSON(),
            damages: this.damages.map(damage => damage.toJSON())
        };
    }
    override get Dimension(): Dimension {
        return this.dimension;
    }
    override set Dimension(dimension: Dimension) {
        this.dimension = { width: Math.round(dimension.width / 2), height: Math.round(dimension.height / 2) };
        this.changeAvoidAreaRadius();
    }
    override set width(width: number) {
        this.dimension.width = Math.round(width / 2);
        this.changeAvoidAreaLocation();
        this.changeAvoidAreaRadius();
    }
    override set height(height: number) {
        this.dimension.height = Math.round(height / 2);
        this.changeAvoidAreaLocation();
        this.changeAvoidAreaRadius();
    }
    override changeAvoidAreaRadius() {
        if (this.dimension.width > this.dimension.height) {
            this.avoidArea.Radius = this.dimension.width + 50;
        } else {
            this.avoidArea.Radius = this.dimension.height + 50;
        }
    }
}

class Vector {
    private x: number;
    private y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    public static async initFromPoints(p1: Point, p2: Point): Promise<Vector> {
        const x = p1.x - p2.x;
        const y = p1.y - p2.y;
        return new Vector(x, y);
    }
    public static async initFromPoint(p: Point): Promise<Vector> {
        return new Vector(p.x, p.y);
    }
    public crossProduct(vector: Vector): number {
        return this.x * vector.y - this.y * vector.x;
    }
}

export class Rectangle extends Shape {
    private angles: Point[] = [];
    constructor(location: Point, dimension: Dimension) {
        super(location, dimension);
        this.location = new Point(location.x - this.dimension.width / 2, location.y - this.dimension.height / 2);
        this.updateAngles();
    }
    public override toJSON() :ObjectInterface{
        return {
            location: this.location.toJSON(),
            dimension: this.dimension,
            avoidArea: this.avoidArea.toJSON(),
            damages: this.damages.map(damage => damage.toJSON()),
            type: 'Rectangle'
        };
    }
    private updateAngles() {
        this.angles = [];
        this.angles.push(new Point(this.location.x, this.location.y));
        this.angles.push(new Point(this.location.x + this.dimension.width, this.location.y));
        this.angles.push(new Point(this.location.x + this.dimension.width, this.location.y + this.dimension.height));
        this.angles.push(new Point(this.location.x, this.location.y + this.dimension.height));
    }
    override set Location(location: Point) {
        this.location = new Point(location.x - this.dimension.width / 2, location.y - this.dimension.height / 2);
        this.avoidArea.Location = this.location;
        this.changeAvoidAreaLocation();
        this.updateAngles();
    }
    override get Location(): Point {
        return this.location;
    }

    override get Dimension(): Dimension {
        return this.dimension;
    }
    override set Dimension(dimension: Dimension) {
        this.dimension = dimension;
        this.changeAvoidAreaRadius();
        this.changeAvoidAreaLocation();
        this.updateAngles();
    }
    override set width(width: number) {
        this.dimension.width = width;
        this.changeAvoidAreaRadius();
        this.changeAvoidAreaLocation();
    }
    override set height(height: number) {
        this.dimension.height = height;
        this.changeAvoidAreaRadius();
        this.changeAvoidAreaLocation();
    }
    override changeAvoidAreaLocation() {
        this.avoidArea.Location = new Point(
            this.location.x + this.dimension.width / 2,
            this.location.y + this.dimension.height / 2
        );
    }
    /**
     *
     * Decides if a point is inside the rectangle with the help of the cross products of the vectors from the point to
     * the corners of the rectangle and the vectors from the corners of the rectangle to the next corner.
     * @param point
     * @return boolean
     */
    public override async pointInside(point: Point): Promise<boolean> {
        if(this.damages.length>0 && await this.pointIsInsideOfADamage(point)){
            return false;
        }
        const crossProducts: number[] = [];
        for (let i = 0; i < this.angles.length - 1; i++) {
            const sideVector = await Vector.initFromPoints(this.angles[i], this.angles[i + 1]);
            const toThePoint = await Vector.initFromPoints(this.angles[i], point);
            crossProducts.push(sideVector.crossProduct(toThePoint));
        }
        const sideVector = await Vector.initFromPoints(this.angles[this.angles.length - 1], this.angles[0]);
        const toThePoint = await Vector.initFromPoints(this.angles[this.angles.length - 1], point);
        crossProducts.push(sideVector.crossProduct(toThePoint));
        let alwaysLowerThanZero = true;
        let alwaysBiggerThanZero = true;

        let i = 0;
        while (i < crossProducts.length && (alwaysLowerThanZero || alwaysBiggerThanZero)) {
            alwaysLowerThanZero = alwaysLowerThanZero && crossProducts[i] <= 0;
            alwaysBiggerThanZero = alwaysBiggerThanZero && crossProducts[i] >= 0;
            i++;
        }
        const inside = alwaysLowerThanZero || alwaysBiggerThanZero;
        return inside;
    }
}

export class Circle {
    protected location: Point;
    protected radius: number;
    constructor(location: Point, r: number) {
        this.location = location;
        this.radius = r;
    }
    public intersectsWith(AvoidArea: Circle): boolean {
        const distance = this.location.distance(AvoidArea.Location);
        return distance < this.radius + AvoidArea.Radius;
    }
    public toJSON(): {location: PointInterface, radius: number} {
        return {location: this.location.toJSON(), radius: this.radius};
    }

    get Location(): Point {
        return this.location;
    }
    set Location(location: Point) {
        this.location = location;
    }
    get Radius(): number {
        return this.radius;
    }
    set Radius(radius: number) {
        this.radius = radius;
    }
}

export class DamageCircle  extends Circle{
    private baseRadius = 20;
    private baseRadiusMultiplier = 0.8;
    constructor(location: Point, pathLength:number) {
        super(location,10);
        this.radius = this.baseRadius+pathLength*this.baseRadiusMultiplier;
    }

    public pointIsInside(point:Point) :boolean{
        return point.distance(this.location) < this.radius;
    }
}
