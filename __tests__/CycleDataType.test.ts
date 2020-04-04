import CycleDataType from '~model/CycleDataType';

describe('CycleDataType Tests', () => {
    it('Can step forwards through a cycle', () => {
        const cycle = new CycleDataType(9, 8, 7);
        const actual = [
            cycle.get().value,
            cycle.next().value,
            cycle.next().value,
            cycle.next().value,
            cycle.next().value,
            cycle.next().value,
        ];
        const expected = [9, 8, 7, 9, 8, 7];

        expect(actual).toStrictEqual(expected);
    });

    it('Can step backwards through a cycle', () => {
        const cycle = new CycleDataType(9, 8, 7);
        const actual = [
            cycle.get().value,
            cycle.prev().value,
            cycle.prev().value,
            cycle.prev().value,
            cycle.prev().value,
            cycle.prev().value,
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
        expect(cycle.nthNext(7).value).toStrictEqual(8);
    });

    it('Can step backwards n times', () => {
        const cycle = new CycleDataType(4, 8, 3, 'dog', 0, 'cat');
        expect(cycle.nthPrev(15).value).toStrictEqual('dog');
    });
});
