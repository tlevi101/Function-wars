export interface Point {
    x: number;
    y: number;
}
class PointClass implements Point{
    public x: number;
    public y: number;

    constructor(x:number, y:number) {
        this.x = x;
        this.y = y;
    }

    public distance(p: PointClass | Point): number {
        const d = Math.sqrt(Math.pow(Math.abs(this.x - p.x), 2) + Math.pow(Math.abs(this.y - p.y), 2));
        return d;
    }
}
class Player{
    private location:PointClass;
    private radius:number;

    constructor(point:Point | PointClass, radius = 40) {
        this.location = new PointClass(point.x, point.y);
        this.radius =  radius;
    }

    public pointInside(p:Point){
        return this.location.distance(p)<=this.radius;
    }
}

export class FunctionCalculator {
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
    private invalidCases: {regex:RegExp, message:string}[] = [
        { regex: /.*\[.*x.*\].*/gi, message: 'Floor function is not allowed!' },
        { regex: /.*\{.*x.*\}.*/gi, message: 'Ceil function is not allowed!' },
        { regex: /.*tan\(.*/gi, message: 'Tan function is not allowed!' },
        { regex: /(\/\(.*x.*\))|(\/x)|(\/Math\.[a-z]+\(.*x.*\))|((\||√|e\^)x)|((√|e\^)\(.*x.*\))|(\|.*x.*\|)/gi, message: 'Division by x is not allowed!' },
        { regex: /((\*|\*\*)-[0-9]+)/gi, message: 'You cannot multiply with negative number without parentheses!' },
        { regex: /(\)[0-9]+|[0-9]+\(|\)\()/gi, message: 'You cannot multiply without multiply operator! Except ax (a*x)' },
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
            this.modifyNegativeNumbers();
            this.insertMultiplicationOperator();
            resolve();
        });
    }

    f(x: number): number {
        const fn = this.replaceXWithValue((x - this.zeroX) / this.ratio);
        return Math.round(this.zeroY - eval(fn) * this.ratio);
    }

    async firstValidPoint(): Promise<Point | null> {
        const player = new Player(new PointClass(this.zeroX, this.zeroY));
        for (let x = this.zeroX; x < this.width; x++) {
            if (Number.isInteger(this.f(x)) && await player.pointInside(new PointClass(x, this.f(x)))){
                return { x: x, y: this.f(x) };
            }
        }
        for (let x = this.zeroX; x > 0; x--) {
            if (Number.isInteger(this.f(x)) && await player.pointInside(new PointClass(x, this.f(x)))) {
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
        return this.fn !== '' && await this.firstValidPoint() !== null && !this.isSatisfiesAnyInvalidCase();
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
            if (await this.firstValidPoint() === null) {
                return 'Function must intersects with your base!'
            }
        } catch (e: any) {
            console.log(e);
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

