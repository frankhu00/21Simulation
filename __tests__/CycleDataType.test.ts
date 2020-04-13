import CycleDataType from '~model/CycleDataType';

describe('CycleDataType Tests', () => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

    it('Can step forwards through a cycle', () => {
        const cycle = new CycleDataType(9, 8, 7);
        const actual = [
            cycle.get(),
            cycle.next().get(),
            cycle.next().get(),
            cycle.next().get(),
            cycle.next().get(),
            cycle.next().get(),
        ];
        const expected = [9, 8, 7, 9, 8, 7];

        expect(actual).toStrictEqual(expected);
    });

    it('Can step backwards through a cycle', () => {
        const cycle = new CycleDataType(9, 8, 7);
        const actual = [
            cycle.get(),
            cycle.prev().get(),
            cycle.prev().get(),
            cycle.prev().get(),
            cycle.prev().get(),
            cycle.prev().get(),
        ];
        const expected = [9, 7, 8, 9, 7, 8];

        expect(actual).toStrictEqual(expected);
    });

    it('Can get head of the cycle', () => {
        const cycle = new CycleDataType('dog', 'cats', 'birds');
        cycle.next();
        expect(cycle.getCycleHead().value).toStrictEqual('dog');
    });

    it('Can get tail of the cycle', () => {
        const cycle = new CycleDataType('dog', 'cats', 'birds');
        cycle.next();
        expect(cycle.getCycleTail().value).toStrictEqual('birds');
    });

    it('Can step forwards n times', () => {
        const cycle = new CycleDataType(4, 8, 3, 'dog', 0, 'cat');
        expect(cycle.nthNext(7).get()).toStrictEqual(8);
    });

    it('Can step backwards n times', () => {
        const cycle = new CycleDataType(4, 8, 3, 'dog', 0, 'cat');
        expect(cycle.nthPrev(15).get()).toStrictEqual('dog');
    });

    it('Can skip to the head of the cycle', () => {
        const cycle = new CycleDataType('bird', 1, 3, 'cat', 0, 'dog');
        cycle.nthNext(3);
        expect(cycle.get()).toBe('cat');
        cycle.skipToHead();
        expect(cycle.get()).toBe('bird');
    });

    it('Can skip to the tail of the cycle', () => {
        const cycle = new CycleDataType('bird', 1, 3, 'cat', 0, 'dog');
        cycle.nthNext(2);
        expect(cycle.get()).toBe(3);
        cycle.skipToTail();
        expect(cycle.get()).toBe('dog');
    });
});
