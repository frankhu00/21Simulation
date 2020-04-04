interface LinkedListInterface {
    value: any;
    prev: () => LinkedListInterface | null;
    next: () => LinkedListInterface | null;
    setPrev: (before: LinkedListInterface | null) => void;
    setNext: (after: LinkedListInterface | null) => void;
    getPointer: () => LinkedListInterface;
}

class LinkedItem implements LinkedListInterface {
    private before: LinkedListInterface | null = null;
    private after: LinkedListInterface | null = null;
    public value = null;

    constructor(value: any, before?: LinkedListInterface, after?: LinkedListInterface) {
        this.value = value;
        this.setPrev(before ? before : null);
        this.setNext(after ? after : null);
    }

    prev() {
        return this.before;
    }

    next() {
        return this.after;
    }

    setPrev(before: LinkedListInterface | null) {
        this.before = before;
    }

    setNext(after: LinkedListInterface | null) {
        this.after = after;
    }

    getPointer() {
        return this;
    }
}

export default class CycleDataType {
    private head: any = null;
    private tail: any = null;
    private current: LinkedListInterface;
    private list: LinkedListInterface[];

    constructor(...args: any[]) {
        const end = args.length - 1;
        this.list = args.map((arg) => new LinkedItem(arg));
        this.list.forEach((item, ind) => {
            if (ind == 0) {
                item.setPrev(this.list[end]);
                item.setNext(this.list[ind + 1]);
            } else if (ind == end) {
                item.setPrev(this.list[ind - 1]);
                item.setNext(this.list[0]);
            } else {
                item.setPrev(this.list[ind - 1]);
                item.setNext(this.list[ind + 1]);
            }
        });
        this.head = this.list[0].getPointer();
        this.tail = this.list[end].getPointer();
        this.current = this.list[0];
    }

    prev() {
        const prev = this.current.prev();
        if (prev) {
            this.current = prev;
            return this.current;
        } else {
            throw new Error('CycleDataType Ended Unexpectedly');
        }
    }

    next() {
        const next = this.current.next();
        if (next) {
            this.current = next;
            return this.current;
        } else {
            throw new Error('CycleDataType Ended Unexpectedly');
        }
    }

    nthPrev(n: number) {
        for (let i = 0; i < n; i++) {
            this.prev();
        }
        return this.get();
    }

    nthNext(n: number) {
        for (let i = 0; i < n; i++) {
            this.next();
        }
        return this.get();
    }

    get() {
        return this.current;
    }

    getCycleHead() {
        return this.head;
    }

    getCycleTail() {
        return this.tail;
    }
}
