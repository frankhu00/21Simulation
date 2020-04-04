import { Deck } from '~model/CardCollection';
import Card from '~model/Card';
import CSManager, { HiLo, WongHalves, OmegaII } from '~model/CountingSystem';

describe('CSManager / Counting System Test', () => {
    describe('CSManager Methods Test', () => {
        beforeEach(() => {
            CSManager.removeAll();
        });

        it('CSManager add new counting systems', () => {
            CSManager.add([new OmegaII(), new WongHalves()]);
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [
                new OmegaII().getName(),
                new WongHalves().getName(),
            ];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager does not add repeated systems (multiple calls to add method with repeated systems)', () => {
            CSManager.add(new HiLo());
            CSManager.add(new HiLo());
            CSManager.add(new OmegaII());
            CSManager.add(new HiLo());
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [new HiLo().getName(), new OmegaII().getName()];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager does not add repeated systems (array input with repeated systems)', () => {
            CSManager.add([new HiLo(), new HiLo(), new HiLo()]);
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames = [new HiLo().getName()];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager remove one counting system via CountingSystem class', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove(new OmegaII());
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [
                new HiLo().getName(),
                new WongHalves().getName(),
            ];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager remove mulitple systems via CountingSystem class', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove([
                new OmegaII(),
                new HiLo(),
            ]);
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [new WongHalves().getName()];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager remove one counting system via systemList index', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove(2);
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [new HiLo().getName(), new OmegaII().getName()];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });

        it('CSManager remove all systems', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).removeAll();
            let systemNames = CSManager.getSystemNames();
            let shouldHaveSystemNames: string[] = [];

            expect(systemNames).toStrictEqual(shouldHaveSystemNames);
        });
    });

    describe('Card Counting Test - Using HiLo, WongHavles, and OmegaII', () => {
        //countListOne = HL -> +2
        //               WH -> +1.5
        //               OII -> +4
        let countListOne = [
            // (RC) HL : WH : OII
            new Card('K'), // -1   : -1   : -2
            new Card('J'), // -2   : -2   : -4
            new Card('8'), // -2   : -2   : -4
            new Card('A'), // -3   : -3   : -4
            new Card('4'), // -2   : -2   : -2
            new Card('6'), // -1   : -1   : 0
            new Card('6'), // 0    : 0    : 2
            new Card('10'), // -1   : -1   : 0
            new Card('J'), // -2   : -2   : -2
            new Card('4'), // -1   : -1   : 0
            new Card('5'), // 0    : 0.5  : 2
            new Card('8'), // 0    : 0.5  : 2
            new Card('9'), // 0    : 0    : 1
            new Card('Q'), // -1   : -1   : -1
            new Card('A'), // -2   : -2   : -1
            new Card('J'), // -3   : -3   : -3
            new Card('2'), // -2   : -2.5 : -2
            new Card('3'), // -1   : -1.5 : -1
            new Card('2'), // 0    : -1   : 0
            new Card('8'), // 0    : -1   : 0
            new Card('7'), // 0    : -0.5 : 1
            new Card('2'), // 1    : 0    : 2
            new Card('5'), // 2    : 1.5  : 4
        ];

        //countListTwo = HL -> -3
        //               WH -> -4
        //               OII -> -7
        let countListTwo = [
            // (RC) HL : WH : OII
            new Card('2'), // 1    : 0.5   : 1
            new Card('J'), // 0    : -0.5  : -1
            new Card('J'), // -1   : -1.5  : -3
            new Card('10'), // -2   : -2.5  : -5
            new Card('9'), // -2   : -3    : -6
            new Card('3'), // -1   : -2    : -5
            new Card('6'), // 0    : -1    : -3
            new Card('8'), // 0    : -1    : -3
            new Card('8'), // 0    : -1    : -3
            new Card('9'), // 0    : -1.5  : -4
            new Card('Q'), // -1   : -2.5  : -6
            new Card('Q'), // -2   : -3.5  : -8
            new Card('K'), // -3   : -4.5  : -10
            new Card('J'), // -4   : -5.5  : -12
            new Card('10'), // -5   : -6.5  : -14
            new Card('4'), // -4   : -5.5  : -12
            new Card('3'), // -3   : -4.5  : -11
            new Card('2'), // -2   : -4    : -10
            new Card('9'), // -2   : -4.5  : -11
            new Card('7'), // -2   : -4    : -10
            new Card('7'), // -2   : -3.5  : -9
            new Card('5'), // -1   : -2    : -7
            new Card('A'), // -2   : -3    : -7
            new Card('A'), // -3   : -4    : -7
        ];

        let deck1 = new Deck({ cards: countListOne });
        let deck2 = new Deck({ cards: countListTwo });
        let deck3 = new Deck();

        it('HiLo - Predefined Deck - Running Count should be +2, -3, and 0', () => {
            let HiLoSystem = new HiLo();
            let result: { [key: string]: number } = {
                rcP2: HiLoSystem.countCards(deck1).getRC(),
                rcN3: HiLoSystem.countCards(deck2).getRC(),
                rc0: HiLoSystem.countCards(deck3).getRC(),
            };

            expect(result).toStrictEqual({
                rcP2: 2,
                rcN3: -3,
                rc0: 0,
            });
        });

        it('WongHavles - Predefined Deck - Running Count should be +1.5, -4, and 0', () => {
            let WHSystem = new WongHalves();
            let result: { [key: string]: number } = {
                rcP2: WHSystem.countCards(deck1).getRC(),
                rcN3: WHSystem.countCards(deck2).getRC(),
                rc0: WHSystem.countCards(deck3).getRC(),
            };

            expect(result).toStrictEqual({
                rcP2: 1.5,
                rcN3: -4,
                rc0: 0,
            });
        });

        it('OmegaII - Predefined Deck - Running Count should be +4, -7, and 0', () => {
            let OIISystem = new OmegaII();
            let result: { [key: string]: number } = {
                rcP2: OIISystem.countCards(deck1).getRC(),
                rcN3: OIISystem.countCards(deck2).getRC(),
                rc0: OIISystem.countCards(deck3).getRC(),
            };

            expect(result).toStrictEqual({
                rcP2: 4,
                rcN3: -7,
                rc0: 0,
            });
        });
    });
});
