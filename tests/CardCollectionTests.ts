import { Shoe, Deck } from '../app/src/js/CardCollections';
import { randomizeBetween } from '../app/src/js/Utility';
import { expect } from 'chai';
import 'mocha';

interface ShoeRepeatInterface {
    id: string;
    repeats: number;
}

interface ShoeTestsInterface {
    cardIDList: string[];
    decks: number;
}

describe('Deck Generate Whole Deck / GenerateCardList No Repeated Cards Test', () => {

    it('No Repeated Card (Complete Deck)', () => { //lol lazy to refactor it
        let deckTests: string[][] = []
        let results: boolean[] = []
        for (let i = 0; i < 1; i++) {
            let deckObj = new Deck()
            deckTests.push(deckObj.get().map(c => `${c.getSuit()}-${c.getKey()}`))
        };

        deckTests.forEach( (deck, ind) => {
            let idList: string[] = []
            let repeated = false
            deck.forEach( id => {
                if (idList.indexOf(id) == -1) {
                    idList.push(id)
                } else {
                    repeated = true
                }
            })

            results[ind] = repeated
        });

        results.forEach( (r, i) => {
            if (r) {
                console.log(deckTests[i])
            }
            expect(r).to.equal(false);
        })
    });

    it('No Repeated Card (Partial Deck)', () => {
        let deckTests: string[][] = []
        let results: boolean[] = []
        for (let i = 0; i < 10; i++) {
            let deckObj = new Deck({cards: 39})
            deckTests.push(deckObj.get().map(c => `${c.getSuit()}-${c.getKey()}`))
        };

        deckTests.forEach( (deck, ind) => {
            let idList: string[] = []
            let repeated = false
            deck.forEach( id => {
                if (idList.indexOf(id) == -1) {
                    idList.push(id)
                } else {
                    repeated = true
                }
            })

            results[ind] = repeated
        });

        results.forEach( (r, i) => {
            if (r) {
                console.log(deckTests[i])
            }
            expect(r).to.equal(false);
        })
    });

});

describe('Deck Generate Proper Number of Cards Test', () => {

    it('Proper Amount of Card (Complete Deck)', () => { //lol lazy to refactor it
        let deckTests: string[][] = []
        for (let i = 0; i < 2; i++) {
            let deckObj = new Deck()
            deckTests.push(deckObj.get().map(c => `${c.getSuit()}-${c.getKey()}`))
        };

        deckTests.forEach( (deck) => {
            let actualTotalCards = deck.length
            let shouldHaveCards = 52

            expect(actualTotalCards).to.equal(shouldHaveCards)
        });
    });

    it('Proper Amount of Card (Partial Deck)', () => { //lol lazy to refactor it
        let deckTests: string[][] = []
        let leRandom: number[] = []
        for (let i = 0; i < 2; i++) {
            let randomCardAmount = randomizeBetween(1, 51);
            leRandom.push(randomCardAmount)
            let deckObj = new Deck({ cards: randomCardAmount})
            deckTests.push(deckObj.get().map(c => `${c.getSuit()}-${c.getKey()}`))
        };

        deckTests.forEach( (deck, ind) => {
            let actualTotalCards = deck.length
            let shouldHaveCards = leRandom[ind]

            expect(actualTotalCards).to.equal(shouldHaveCards)
        });
    });

});

describe('Shoe Generate Whole Shoe (various # decks) / GenerateCardList No Repeated Cards Test', () => {

    it('No Repeated Card (Complete Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = []
        let results: boolean[] = []
        for (let i = 1; i <= 11; i++) {
            let shoeObj = new Shoe({ deck: i+1 })
            shoeTests.push({
                cardIDList: shoeObj.get().map(c => `${c.getSuit()}-${c.getKey()}`),
                decks: i+1
            })
        };

        shoeTests.forEach( (shoe, ind) => {
            let idList: ShoeRepeatInterface[] = []
            let repeated = false
            shoe.cardIDList.forEach( id => {
                if (idList.filter(iObj => iObj.id == id).length == 0) {
                    idList.push({
                        id,
                        repeats: 0
                    })
                } else {
                    let index = idList.findIndex( iObj => iObj.id == id)
                    idList[index].repeats = idList[index].repeats+1

                    if (idList[index].repeats > shoe.decks - 1) {
                        repeated = true
                    }
                }
            })

            results[ind] = repeated
        });

        results.forEach( (r, i) => {
            if (r) {
                console.log(shoeTests[i])
            }
            expect(r).to.equal(false);
        })
    });

    it('No Repeated Card (Partial Shoe - 2 to 12 decks)', () => {
        let shoeTests: ShoeTestsInterface[] = []
        let results: boolean[] = []
        for (let i = 1; i <= 11; i++) {
            let shoeObj = new Shoe({ cards: 39*(i+1), deck: i+1 })
            shoeTests.push({
                cardIDList: shoeObj.get().map(c => `${c.getSuit()}-${c.getKey()}`),
                decks: i+1
            })
        };

        shoeTests.forEach( (shoe, ind) => {
            let idList: ShoeRepeatInterface[] = []
            let repeated = false
            shoe.cardIDList.forEach( id => {
                if (idList.filter(iObj => iObj.id == id).length == 0) {
                    idList.push({
                        id,
                        repeats: 0
                    })
                } else {
                    let index = idList.findIndex( iObj => iObj.id == id)
                    idList[index].repeats = idList[index].repeats+1

                    if (idList[index].repeats > shoe.decks - 1) {
                        repeated = true
                    }
                }
            })

            results[ind] = repeated
        });

        results.forEach( (r, i) => {
            if (r) {
                console.log(shoeTests[i])
            }
            expect(r).to.equal(false);
        })
    });

});

describe('Shoe Generate Proper Number of Cards Test', () => {

    it('Proper Amount of Cards (Complete Shoe - 2 to 12 decks)', () => {
        
        let shoeTests: ShoeTestsInterface[] = []
        for (let i = 1; i <= 11; i++) {
            let shoeObj = new Shoe({ deck: i+1 })
            shoeTests.push({
                cardIDList: shoeObj.get().map(c => `${c.getSuit()}-${c.getKey()}`),
                decks: i+1
            })
        };

        shoeTests.forEach( (shoe) => {
            let actualTotalCards = shoe.cardIDList.length
            let shouldHaveCards = shoe.decks * 52
            if (actualTotalCards != shouldHaveCards) {
                console.log(shoe)
            }
            expect(actualTotalCards).to.equal(shouldHaveCards);
        });

    });

    it('Proper Amount of Cards (Partial Shoe - 2 to 12 decks)', () => {
        
        let shoeTests: ShoeTestsInterface[] = []
        let leRandom: number[] = []
        for (let i = 1; i <= 11; i++) {
            let randomCardAmount = randomizeBetween(1, 52);
            leRandom.push(randomCardAmount)
            let shoeObj = new Shoe({ cards: randomCardAmount*(i+1)-1, deck: i+1 })
            shoeTests.push({
                cardIDList: shoeObj.get().map(c => `${c.getSuit()}-${c.getKey()}`),
                decks: i+1
            })
        };

        shoeTests.forEach( (shoe, ind) => {
            let actualTotalCards = shoe.cardIDList.length
            let shouldHaveCards = (shoe.decks * leRandom[ind]) -1
            if (actualTotalCards != shouldHaveCards) {
                console.log(shoe)
            }
            expect(actualTotalCards).to.equal(shouldHaveCards);
        });

    });

});