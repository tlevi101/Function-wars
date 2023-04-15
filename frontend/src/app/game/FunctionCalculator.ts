export interface Point {
    x: number;
    y: number;
}

export class FunctionCalculator {
    private fn: string;
    private width: number;
    private height: number;
    private zeroX: number;
    private zeroY: number;
    private ratio: number;
    private limit: number;
    private validFunctions: string[] = ['sin', 'cos', 'sqrt', 'log', 'pow', 'abs'];
    private specialValidFunctions: string[] = ['√', '|X|', 'e'];
    private validOperators: string[] = ['+', '-', '*', '/', '^'];
    private invalidFunctions: string[] = ['tan', 'a/x', '[x]', '{x}'];

    constructor(
        fn: string,
        zeroX: number,
        zeroY: number,
        width = 1000,
        height = 700,
        ratio = 35,
        limit: undefined | number = undefined
    ) {
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
        this.limit = limit || width;
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
            resolve();
        });
    }

    calculateRightSidePoints(): Point[] {
        const points: Point[] = [];
        const firstValidPoint = this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        for (let x = firstValidPoint.x; x < this.width && x < firstValidPoint.x + this.limit; x++) {
            console.log('x: ' + x);
            console.log('y: ' + this.f(x));
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
                points.push({ x: x, y: this.f(x) });
                if (this.f(x) >= this.height || this.f(x) <= 0) {
                    // console.log("returning");
                    // console.log("x: "+x);
                    // console.log("y: "+this.f(x));
                    // console.log(firstValidPoint);
                    return points;
                }
            }
        }
        return points;
    }

    calculateLeftSidePoints(): Point[] {
        const points: Point[] = [];
        const firstValidPoint = this.firstValidPoint();
        if (!firstValidPoint) {
            return points;
        }
        for (let x = firstValidPoint.x; x > 0 && x > firstValidPoint.x - this.limit; x--) {
            console.log('x: ' + x);
            console.log('y: ' + this.f(x));
            console.log(firstValidPoint.x - this.limit);
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
                points.push({ x: x, y: this.f(x) });
                if (this.f(x) >= this.height || this.f(x) <= 0) {
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

    firstValidPoint(): Point | null {
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
    static get ValidFunctions(): string[] {
        let validFunctions: string[] = ['sin', 'cos', 'log'];
        validFunctions = validFunctions.map(fn => fn + '(X)');
        const specialValidFunctions = ['√(X)', '|X|', 'e^(X)'];
        return [...validFunctions, ...specialValidFunctions];
    }
}
