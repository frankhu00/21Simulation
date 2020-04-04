import { Shoe, Deck } from '~model/CardCollection';
import { randomizeBetween } from '~model/Utility';
import Card, { SuitType } from '~model/Card';

interface ShoeRepeatInterface {
    id: string;
    repeats: number;
}

interface ShoeTestsInterface {
    cardIDList: string[];
    decks: number;
}

describe('Deck Generate Whole Deck / GenerateCardList No Repeated Cards Test', () => {
    it('No Repeated Card (Complete Deck)', () => {
        //lol lazy to refactor it
        let deckTests: string[][] = [];
        let results: boolean[] = [];
        for (let i = 0; i < 1; i++) {
            let deckObj = new Deck();
            deckTests.push(deckObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`));
        }

        deckTests.forEach((deck, ind) => {
            let idList: string[] = [];
            let repeated = false;
            deck.forEach((id) => {
                if (idList.indexOf(id) == -1) {
                    idList.push(id);
                } else {
                    repeated = true;
                }
            });

            results[ind] = repeated;
        });

        results.forEach((r, i) => {
            if (r) {
                console.log(deckTests[i]);
            }
            expect(r).toBe(false);
        });
    });

    it('No Repeated Card (Partial Deck)', () => {
        let deckTests: string[][] = [];
        let results: boolean[] = [];
        for (let i = 0; i < 10; i++) {
            let randomAmt = randomizeBetween(1, 51);
            let deckObj = new Deck({ cards: randomAmt });
            deckTests.push(deckObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`));
        }

        deckTests.forEach((deck, ind) => {
            let idList: string[] = [];
            let repeated = false;
            deck.forEach((id) => {
                if (idList.indexOf(id) == -1) {
                    idList.push(id);
                } else {
                    repeated = true;
                }
            });

            results[ind] = repeated;
        });

        results.forEach((r, i) => {
            if (r) {
                console.log(deckTests[i]);
            }
            expect(r).toBe(false);
        });
    });
});

describe('Deck Generate Proper Number of Cards Test', () => {
    it('Proper Amount of Card (Complete Deck)', () => {
        //lol lazy to refactor it
        let deckTests: string[][] = [];
        for (let i = 0; i < 2; i++) {
            let deckObj = new Deck();
            deckTests.push(deckObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`));
        }

        deckTests.forEach((deck) => {
            let actualTotalCards = deck.length;
            let shouldHaveCards = 52;

            expect(actualTotalCards).toBe(shouldHaveCards);
        });
    });

    it('Proper Amount of Card (Partial Deck)', () => {
        //lol lazy to refactor it
        let deckTests: string[][] = [];
        let leRandom: number[] = [];
        for (let i = 0; i < 2; i++) {
            let randomCardAmount = randomizeBetween(1, 51);
            leRandom.push(randomCardAmount);
            let deckObj = new Deck({ cards: randomCardAmount });
            deckTests.push(deckObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`));
        }

        deckTests.forEach((deck, ind) => {
            let actualTotalCards = deck.length;
            let shouldHaveCards = leRandom[ind];

            expect(actualTotalCards).toBe(shouldHaveCards);
        });
    });
});

describe('Shoe Generate Whole Shoe (various # decks) / GenerateCardList No Repeated Cards Test', () => {
    it('No Repeated Card (Complete Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = [];
        let results: boolean[] = [];
        for (let i = 1; i <= 11; i++) {
            let shoeObj = new Shoe({ deck: i + 1 });
            shoeTests.push({
                cardIDList: shoeObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`),
                decks: i + 1,
            });
        }

        shoeTests.forEach((shoe, ind) => {
            let idList: ShoeRepeatInterface[] = [];
            let repeated = false;
            shoe.cardIDList.forEach((id) => {
                if (idList.filter((iObj) => iObj.id == id).length == 0) {
                    idList.push({
                        id,
                        repeats: 0,
                    });
                } else {
                    let index = idList.findIndex((iObj) => iObj.id == id);
                    idList[index].repeats = idList[index].repeats + 1;

                    if (idList[index].repeats > shoe.decks - 1) {
                        repeated = true;
                    }
                }
            });

            results[ind] = repeated;
        });

        results.forEach((r, i) => {
            if (r) {
                console.log(shoeTests[i]);
            }
            expect(r).toBe(false);
        });
    });

    it('No Repeated Card (Partial Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = [];
        let results: boolean[] = [];
        for (let i = 1; i <= 11; i++) {
            let randomAmt = randomizeBetween(2, 52);
            let shoeObj = new Shoe({ cards: randomAmt * (i + 1) - 1, deck: i + 1 });
            shoeTests.push({
                cardIDList: shoeObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`),
                decks: i + 1,
            });
        }

        shoeTests.forEach((shoe, ind) => {
            let idList: ShoeRepeatInterface[] = [];
            let repeated = false;
            shoe.cardIDList.forEach((id) => {
                if (idList.filter((iObj) => iObj.id == id).length == 0) {
                    idList.push({
                        id,
                        repeats: 0,
                    });
                } else {
                    let index = idList.findIndex((iObj) => iObj.id == id);
                    idList[index].repeats = idList[index].repeats + 1;

                    if (idList[index].repeats > shoe.decks - 1) {
                        repeated = true;
                    }
                }
            });

            results[ind] = repeated;
        });

        results.forEach((r, i) => {
            if (r) {
                console.log(shoeTests[i]);
            }
            expect(r).toBe(false);
        });
    });
});

describe('Shoe Generate Proper Number of Cards Test', () => {
    it('Proper Amount of Cards (Complete Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = [];
        for (let i = 1; i <= 11; i++) {
            let shoeObj = new Shoe({ deck: i + 1 });
            shoeTests.push({
                cardIDList: shoeObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`),
                decks: i + 1,
            });
        }

        shoeTests.forEach((shoe) => {
            let actualTotalCards = shoe.cardIDList.length;
            let shouldHaveCards = shoe.decks * 52;
            if (actualTotalCards != shouldHaveCards) {
                console.log(shoe);
            }
            expect(actualTotalCards).toBe(shouldHaveCards);
        });
    });

    it('Proper Amount of Cards (Partial Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = [];
        let leRandom: number[] = [];
        for (let i = 1; i <= 11; i++) {
            let randomCardAmount = randomizeBetween(2, 52);
            leRandom.push(randomCardAmount);
            let shoeObj = new Shoe({ cards: randomCardAmount * (i + 1) - 1, deck: i + 1 });
            shoeTests.push({
                cardIDList: shoeObj.get().map((c) => `${c.getSuit()}-${c.getKey()}`),
                decks: i + 1,
            });
        }

        shoeTests.forEach((shoe, ind) => {
            let actualTotalCards = shoe.cardIDList.length;
            let shouldHaveCards = shoe.decks * leRandom[ind] - 1;
            if (actualTotalCards != shouldHaveCards) {
                console.log(shoe);
            }
            expect(actualTotalCards).toBe(shouldHaveCards);
        });
    });
});

let DefinedCardOrder = [
    new Card('K', SuitType.Spades),
    new Card('Q', SuitType.Spades),
    new Card('J', SuitType.Spades),
    new Card('10', SuitType.Spades),
    new Card('9', SuitType.Spades),
    new Card('8', SuitType.Spades),
    new Card('7', SuitType.Spades),
    new Card('6', SuitType.Spades),
    new Card('5', SuitType.Spades),
    new Card('4', SuitType.Spades),
    new Card('3', SuitType.Spades),
    new Card('2', SuitType.Spades),
    new Card('A', SuitType.Spades),
    new Card('K', SuitType.Hearts),
    new Card('Q', SuitType.Hearts),
    new Card('J', SuitType.Hearts),
    new Card('10', SuitType.Hearts),
    new Card('9', SuitType.Hearts),
    new Card('8', SuitType.Hearts),
    new Card('7', SuitType.Hearts),
    new Card('6', SuitType.Hearts),
    new Card('5', SuitType.Hearts),
    new Card('4', SuitType.Hearts),
    new Card('3', SuitType.Hearts),
    new Card('2', SuitType.Hearts),
    new Card('A', SuitType.Hearts),
];
let DeckWithKnownOrder = new Deck({ cards: DefinedCardOrder });

describe('Card Collect Class Shuffle', () => {
    it('Can shuffle via RNG Shuffle method', () => {
        expect(DefinedCardOrder).toBe(DeckWithKnownOrder.get());
        DeckWithKnownOrder.shuffle();
        expect(DefinedCardOrder).not.toBe(DeckWithKnownOrder.get());
    });
});
