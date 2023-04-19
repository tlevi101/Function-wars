import { PointInterface } from './interfaces';
import { Point } from './Shape';

class FuncCalculator {
    private fn: string;
    private width: number;
    private height: number;
    private zeroX: number;
    private zeroY: number;
    private ratio: number;
    private validFunctions: string[] = ['sin', 'cos', 'sqrt', 'log', 'pow', 'abs'];
    private specialValidFunctions: string[] = ['√', '|X|', 'e'];
    private validOperators: string[] = ['+', '-', '*', '/', '^'];
    private invalidFunctions: string[] = ['tan', 'a/x', '[x]', '{x}'];

    constructor(fn: string, zeroX: number, zeroY: number, width = 1000, height = 700, ratio = 35) {
        this.fn = fn;
        (async () => {
            await this.replaceAll();
        })();

        // setTimeout(() => {
        //     this.replaceAll();
        // }, 100);
        this.width = width;
        this.height = height;
        this.zeroX = zeroX;
        this.zeroY = zeroY;
        this.ratio = ratio;
    }
    replaceAll(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.validFunctions.map(validFn => {
                this.fn = this.fn.replaceAll(validFn, `Math.${validFn}`);
            });
            this.replacePowerOperator();
            this.replaceEWithMathE();
            this.replaceAbsWithMathAbs();
            this.replaceSqrtOperator();
            this.insertMultiplicationOperator();
            this.modifyNegativeNumbers();
            resolve();
        });
    }

    /**
     * Throws error if point not found
     */
    public async distanceFromOrigo(point: Point): Promise<number> {
        console.log('distanceFromOrigo');
        console.log('point: ' + point);
        let distance = 0;
        const rightSidePoints = await this.calculateRightSidePoints();
        for await (const [i, rightSidePoint] of rightSidePoints.entries()) {
            const currentPoint = new Point(rightSidePoints[i].x, rightSidePoints[i].y);
            const nextPoint = new Point(rightSidePoints[i + 1].x, rightSidePoints[i + 1].y);
            distance += currentPoint.distance(nextPoint) / this.ratio;
            if (nextPoint.equals(point)) {
                console.log('distance right: ' + distance);
                return distance;
            }
        }
        distance = 0;
        const leftSidePoints = await this.calculateLeftSidePoints();
        for await (const [i, _] of leftSidePoints.entries()) {
            const currentPoint = new Point(leftSidePoints[i].x, leftSidePoints[i].y);
            const nextPoint = new Point(leftSidePoints[i - 1].x, leftSidePoints[i - 1].y);
            distance += currentPoint.distance(nextPoint) / this.ratio;
            if (nextPoint.equals(point)) {
                console.log('distance left: ' + distance);
                return distance;
            }
        }
        return distance;
    }

    public async calculateRightSidePoints(): Promise<PointInterface[]> {
        const points: PointInterface[] = [];
        const firstValidPoint = this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        const xValues = [...Array(this.width - firstValidPoint.x).keys()].map(x => x + firstValidPoint.x);
        await Promise.all(
            xValues.map(x => {
                if (!Number.isFinite(this.f(x))) {
                    if (this.f(x) == Infinity) {
                        points.push({ x: x, y: 0 });
                    }
                    if (this.f(x) == -Infinity) {
                        points.push({ x: x, y: this.height });
                    }
                    return points;
                }
                if (Number.isInteger(this.f(x))) {
                    if (this.f(x) <= this.height && this.f(x) >= 0) {
                        points.push({ x: x, y: this.f(x) });
                    } else {
                        return points;
                    }
                }
            })
        );
        return points;
    }

    public async trimRightSidePoints(
        points: PointInterface[],
        point: PointInterface | Point
    ): Promise<PointInterface[]> {
        return points.filter(p => p.x <= point.x);
    }

    public async calculateLeftSidePoints(): Promise<PointInterface[]> {
        const points: PointInterface[] = [];
        const firstValidPoint = this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        //reverse needed for firstValidPoint.x...0 order
        const xValues = [...Array(firstValidPoint.x).keys()].reverse();
        await Promise.all(
            xValues.map(x => {
                if (!Number.isFinite(this.f(x))) {
                    if (this.f(x) == -Infinity) {
                        points.push({ x: x, y: 0 });
                    }
                    if (this.f(x) == Infinity) {
                        points.push({ x: x, y: this.height });
                    }
                    return points;
                }
                if (Number.isInteger(this.f(x))) {
                    if (this.f(x) <= this.height && this.f(x) >= 0) {
                        points.push({ x: x, y: this.f(x) });
                    } else {
                        return points;
                    }
                }
            })
        );
        return points;
    }

    public async trimLeftSidePoints(
        points: PointInterface[],
        point: PointInterface | Point
    ): Promise<PointInterface[]> {
        return points.filter(p => p.x >= point.x);
    }

    f(x: number): number {
        const fn = this.replaceXWithValue((x - this.zeroX) / this.ratio);
        return Math.round(this.zeroY - eval(fn) * this.ratio);
    }

    firstValidPoint(): PointInterface | null {
        for (let x = this.zeroX; x < this.width; x++) {
            if (Number.isInteger(this.f(x))) {
                return { x: x, y: this.f(x) };
            }
        }
        for (let x = this.zeroX; x > 0; x--) {
            if (Number.isInteger(this.f(x))) {
                return { x: x, y: this.f(x) };
            }
        }
        return null;
    }

    replaceXWithValue(value: number): string {
        const fn = this.fn.replaceAll('X', value.toString());
        return fn;
    }

    isValidFunction(): boolean {
        try {
            console.log(this.fn);
            this.f(this.zeroX);
        } catch (e) {
            return false;
        }
        return (
            this.fn !== '' &&
            this.firstValidPoint() !== null &&
            !this.doesAnyDenominatorContainsX() &&
            !this.isContainsFloorFunction() &&
            !this.fn.includes('tan')
        );
    }

    isContainsFloorFunction(): boolean {
        const regex = /.*\[.*x.*\].*/i;
        return this.fn.includes('floor') || this.fn.match(regex) !== null;
    }

    doesAnyDenominatorContainsX(): boolean {
        const regex = /(\/\(.*x.*\))|(\/x)/gi;
        return this.fn.match(regex) !== null;
    }
    replacePowerOperator(): void {
        this.fn = this.fn.replaceAll('^', '**');
    }

    replaceEWithMathE(): void {
        this.fn = this.fn.replaceAll('e', 'Math.E');
    }
    replaceAbsWithMathAbs(): void {
        const regex = /\|.*x.*\|/gi;
        this.fn = this.fn.replaceAll(regex, 'Math.abs($&)');
        this.fn = this.fn.replaceAll('|', '');
    }
    replaceSqrtOperator(): void {
        const regex = /(√x)|(√\(.*x.*\))/gi;
        this.fn = this.fn.replaceAll(regex, 'Math.sqrt($&)');
        this.fn = this.fn.replaceAll('√', '');
    }
    modifyNegativeNumbers(): void {
        const regex = /(-([1-9]+(\*|\*\*)))|((\*|\*\*)-[1-9]+)/gi;
        const regex2 = /(x(\*|\*\*))|((\*|\*\*)x)|(-x)/gi;
        while (this.fn.search(regex) !== -1) {
            this.fn = this.fn
                .substring(0, this.fn.search(regex))
                .concat(this.fn.substring(this.fn.search(regex)).replace(/-[1-9]+/gi, '($&)'));
        }
        while (this.fn.search(regex2) !== -1) {
            this.fn = this.fn
                .substring(0, this.fn.search(regex2))
                .concat(this.fn.substring(this.fn.search(regex2)).replace(/x/gi, '(X)'));
        }
    }
    insertMultiplicationOperator(): void {
        const case1 = /[0-9]+x/gi;
        const case2 = /\)x/gi;
        const caseGroup1 = { cases: [case1, case2], replace: /x/gi, with: '*X' };

        const case3 = /x[0-9]+/gi;
        const case4 = /x\(/gi;
        const caseGroup2 = { cases: [case3, case4], replace: /x/gi, with: 'X*' };

        caseGroup1.cases.forEach(c => {
            while (this.fn.search(c) !== -1) {
                this.fn = this.fn
                    .substring(0, this.fn.search(c))
                    .concat(this.fn.substring(this.fn.search(c)).replace(caseGroup1.replace, caseGroup1.with));
            }
        });
        caseGroup2.cases.forEach(c => {
            while (this.fn.search(c) !== -1) {
                this.fn = this.fn
                    .substring(0, this.fn.search(c))
                    .concat(this.fn.substring(this.fn.search(c)).replace(caseGroup2.replace, caseGroup2.with));
            }
        });
    }
    get error(): string {
        if (this.fn === '') {
            return 'Function cannot be empty';
        }
        if (this.doesAnyDenominatorContainsX()) {
            return 'Function cannot contain a/x based function';
        }
        if (this.isContainsFloorFunction()) {
            return 'Floor function is not allowed';
        }
        if (this.fn.includes('tan')) {
            return 'Tan function is not allowed';
        }
        try {
            this.f(this.zeroX);
            if (this.firstValidPoint() === null) {
                return `Function does not contain any valid point in [0;${this.width}]}]`;
            }
        } catch (e: any) {
            return 'Invalid function';
        }
        return '';
    }
}
export = FuncCalculator;
