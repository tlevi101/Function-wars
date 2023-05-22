import { PointInterface } from './interfaces';
import { Line, Point } from './Shape';
import Player = require('./Player');

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
    private invalidCases: { regex: RegExp; message: string }[] = [
        { regex: /.*\[.*x.*\].*/gi, message: 'Floor function is not allowed!' },
        { regex: /.*\{.*x.*\}.*/gi, message: 'Ceil function is not allowed!' },
        { regex: /.*tan\(.*/gi, message: 'Tan function is not allowed!' },
        {
            regex: /(\/\(.*x.*\))|(\/x)|(\/Math\.[a-z]+\(.*x.*\))|((\||√|e\^)x)|((√|e\^)\(.*x.*\))|(\|.*x.*\|)/gi,
            message: 'Division by x is not allowed!',
        },
        { regex: /((\*|\*\*)-[0-9]+)/gi, message: 'You cannot multiply with negative number without parentheses!' },
        {
            regex: /(\)[0-9]+|[0-9]+\(|\)\()/gi,
            message: 'You cannot multiply without multiply operator! Except ax (a*x)',
        },
    ];

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
        for await (const [i, _] of rightSidePoints.entries()) {
            if (i === rightSidePoints.length - 1) {
                break;
            }
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
            if (i === 0) {
                continue;
            }
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
        const firstValidPoint = await this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        const xValues = [...Array(this.width - firstValidPoint.x).keys()].map(x => x + firstValidPoint.x);
        for await (const x of xValues) {
            if (!Number.isFinite(this.f(x))) {
                let last = points[points.length - 1];
                if (!last) {
                    last = firstValidPoint;
                }
                if (this.f(x) == Infinity) {
                    const line = Line.initFromPointInterface(last, { x: x, y: 0 });
                    let newPoints = line.separateToPoints().map(p => p.toJSON());
                    points.push(...newPoints);
                }
                if (this.f(x) == -Infinity) {
                    const line = Line.initFromPointInterface(last, { x: x, y: this.height });
                    let newPoints = line.separateToPoints().map(p => p.toJSON());
                    points.push(...newPoints);
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
        }
        return points;
    }



    public async calculateLeftSidePoints(): Promise<PointInterface[]> {
        const points: PointInterface[] = [];
        const firstValidPoint = await this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        //reverse needed for firstValidPoint.x...0 order
        const xValues = [...Array(firstValidPoint.x).keys()].reverse();
        for await (const x of xValues) {
            if (!Number.isFinite(this.f(x))) {
                let last = points[points.length - 1];
                if (!last) {
                    last = firstValidPoint;
                }
                if (this.f(x) == -Infinity) {
                    const line = Line.initFromPointInterface(last, { x: x, y: 0 });
                    points.push(... line.separateToPoints().map(p => p.toJSON()));
                }
                if (this.f(x) == Infinity) {
                    const line = Line.initFromPointInterface(last, { x: x, y: this.height });
                    points.push(... line.separateToPoints().map(p => p.toJSON()));
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
        }
        return points;
    }

    f(x: number): number {
        const fn = this.replaceXWithValue((x - this.zeroX) / this.ratio);
        return Math.round(this.zeroY - eval(fn) * this.ratio);
    }

    async firstValidPoint(): Promise<PointInterface | null> {
        const player = new Player(new Point(this.zeroX, this.zeroY), 0, 'none');
        for (let x = this.zeroX; x < this.width; x++) {
            if (Number.isInteger(this.f(x)) && (await player.pointInside(new Point(x, this.f(x))))) {
                return { x: x, y: this.f(x) };
            }
        }
        for (let x = this.zeroX; x > 0; x--) {
            if (Number.isInteger(this.f(x)) && (await player.pointInside(new Point(x, this.f(x))))) {
                return { x: x, y: this.f(x) };
            }
        }
        return null;
    }

    replaceXWithValue(value: number): string {
        const fn = this.fn.replaceAll('X', value.toString());
        return fn;
    }

    async isValidFunction(): Promise<boolean> {
        try {
            console.log(this.fn);
            this.f(this.zeroX);
        } catch (e) {
            return false;
        }
        return this.fn !== '' && (await this.firstValidPoint()) !== null && !this.isSatisfiesAnyInvalidCase();
    }

    isSatisfiesAnyInvalidCase(): boolean {
        return this.invalidCases.some(invalidCase => {
            if (this.fn.search(invalidCase.regex) !== -1) {
                return true;
            }
            return false;
        });
    }

    replacePowerOperator(): void {
        this.fn = this.fn.replaceAll('^', '**');
    }

    replaceEWithMathE(): void {
        this.fn = this.fn.replaceAll('e', 'Math.E');
    }
    replaceAbsWithMathAbs(): void {
        const regex = /\|([^|]*x[^|]*)\|/gi;
        this.fn = this.fn.replaceAll(regex, 'Math.abs($&)');
        this.fn = this.fn.replaceAll('|', '');
    }
    replaceSqrtOperator(): void {
        const regex = /(√x)|(√\([^(]*x[^)]*\))/gi;
        this.fn = this.fn.replaceAll(regex, 'Math.sqrt($&)');
        this.fn = this.fn.replaceAll('√', '');
    }
    modifyNegativeNumbers(): void {
        const regex2 = /(x(\*|\*\*))|((\*|\*\*)x)|(-x)/gi;
        while (this.fn.search(regex2) !== -1) {
            this.fn = this.fn
                .substring(0, this.fn.search(regex2))
                .concat(this.fn.substring(this.fn.search(regex2)).replace(/x/i, '(X)'));
        }
    }
    insertMultiplicationOperator(): void {
        const case1 = /[0-9]+x/gi;
        const case2 = /\)x/gi;
        const caseGroup1 = { cases: [case1, case2], replace: /x/i, with: '*X' };

        const case3 = /x[0-9]+/gi;
        const case4 = /x\(/gi;
        const caseGroup2 = { cases: [case3, case4], replace: /x/i, with: 'X*' };

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
    public async error(): Promise<string> {
        if (this.fn === '') {
            return 'Function cannot be empty';
        }
        if (this.isSatisfiesAnyInvalidCase()) {
            return this.invalidCases.find(invalidCase => {
                if (this.fn.search(invalidCase.regex) !== -1) {
                    return true;
                }
                return false;
            })!.message;
        }
        try {
            for (let x = 0; x <= this.width; x++) {
                this.f(x);
            }
            if ((await this.firstValidPoint()) === null) {
                return 'Function must intersects with your base!';
            }
        } catch (e: any) {
            console.log(e);
            return 'Invalid function';
        }
        return '';
    }
}
export = FuncCalculator;
