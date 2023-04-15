class MyNode<Type> {
    public value: Type;
    public next: MyNode<Type> | null;
    constructor(value: Type) {
        this.value = value;
        this.next = null;
    }
}

/**
 * Iterator for LinkedList, use with do while loop
 * example:
 *  do{
 * ...
 * }while(iter.next()); (or iter.prev())
 */
export class LinkedListIterator<Type> {
    private current: MyNode<Type>;
    private prev: MyNode<Type> | null = null;
    constructor(current: MyNode<Type>) {
        this.current = current;
    }

    public next(): boolean {
        if (this.current === null) return false;
        if (this.current.next) {
            this.prev = this.current;
            this.current = this.current.next;
            return true;
        }
        return false;
    }

    public hasNext(): boolean {
        return this.current.next !== null;
    }

    get value(): Type | null {
        if (this.current === null) return null;
        return this.current.value;
    }
    get Current(): MyNode<Type> {
        return this.current;
    }
    public modifyPrevNext(node: MyNode<Type> | null): void {
        if (this.prev) this.prev.next = node;
    }
    get Prev(): MyNode<Type> | null {
        return this.prev;
    }
}

export class LinkedList<Type> {
    private head: MyNode<Type> | null;
    private tail: MyNode<Type> | null;
    private length: number;
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    public add(value: Type): void {
        const node = new MyNode<Type>(value);
        if (this.tail === null) {
            this.tail = node;
            this.length++;
            return;
        }
        if (this.head === null) {
            this.head = this.tail;
            this.tail = node;
            this.head.next = this.tail;
            this.length++;
            return;
        }
        let tmp = this.tail;
        this.tail = node;
        tmp.next = this.tail;
        this.length++;
    }

    public removeFirstWhere(callback: (iter: Type) => boolean): void {
        if (!this.head) return;
        let iter = this.iterator();
        if (iter === null) return;
        let i = 0;
        do {
            if (callback(iter.value!)) {
                if (i === 0) {
                    this.head = iter.Current.next;
                    this.length--;
                    return;
                }
                if (!iter.hasNext()) {
                    this.tail = iter.Current;
                    this.tail!.next = null;
                    this.length--;
                    iter.modifyPrevNext(iter.Current.next);
                    return;
                }
            }
            i++;
        } while (iter.next());
    }

    removeTail(): void {
        if (!this.tail) return;
        if (this.length === 1) {
            this.head = null;
            this.tail = null;
            this.length--;
            return;
        }
        if (this.length === 2) {
            this.tail = this.head;
            this.tail!.next = null;
            this.head = null;
            this.length--;
            return;
        }
        let iter = this.iterator();
        if (iter === null) return;
        do {} while (iter.next());
        this.tail = iter.Prev;
        this.tail!.next = null;
        this.length--;
    }

    public toTailFirst(callback: (current: Type) => boolean): void {
        if (!this.tail) return;
        if (callback(this.tail.value!)) return;
        let iter = this.iterator();
        if (iter === null) return;
        let i = 0;
        do {
            if (callback(iter.value!)) {
                iter.modifyPrevNext(iter.Current.next);
                this.tail.next = iter.Current;
                if (i === 0) {
                    if (this.length === 2) this.head = this.tail;
                    else this.head = this.head?.next ? this.head.next : null;
                }
                this.tail = iter.Current;
                this.tail.next = null;
                return;
            }
            i++;
        } while (iter.next());
    }

    public filter(callback: (current: Type) => boolean): Type[] {
        if (!this.head) return [];
        let iter = this.iterator();
        if (iter === null) return [];
        let result: Type[] = [];
        do {
            if (callback(iter.value!)) {
                result.push(iter.value!);
            }
        } while (iter.next());
        return result;
    }

    public find(callback: (current: Type) => boolean): Type | null {
        if (!this.head) return null;
        let iter = this.iterator();
        if (iter === null) return null;
        do {
            if (callback(iter.value!)) {
                return iter.value;
            }
        } while (iter.next());
        return null;
    }
    printList(): void {
        let iter = this.iterator();
        if (iter === null) return;
        do {} while (iter.next());
    }

    public iterator(): LinkedListIterator<Type> | null {
        if (this.head === null) {
            if (this.tail === null) return null;
            else return new LinkedListIterator<Type>(this.tail);
        }
        return new LinkedListIterator<Type>(this.head);
    }

    get Length(): number {
        return this.length;
    }
    get size(): number {
        return this.length;
    }
    get Head(): Type | null {
        if (this.head === null) return null;
        return this.head.value;
    }
    get Tail(): Type | null {
        if (this.tail === null) return null;
        return this.tail.value;
    }
    set Tail(value: Type | null) {
        if (this.tail === null) return;
        if (!value) return;
        this.tail.value = value;
    }
    set Head(value: Type | null) {
        if (this.head === null) return;
        if (!value) return;
        this.head.value = value;
    }
}
