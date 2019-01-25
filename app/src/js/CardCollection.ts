import Card, { CardNumberMap, SuitType } from './Card'
import Notifier from './Notifier'
import { CountingSystem } from './CountingSystem'
import { randomizeBetween } from './Utility'

type RCObjectType = {[key: string]: CountingSystem | number}
type setRCType = RCObjectType | boolean
type deckConstructorType = { cards?: Card[] | number, setRC?: setRCType }
type shoeConstructorType = { deck?: number, cards?: Card[] | number, setRC?: setRCType }

const ShuffleType = {
    RNG: 'RNG Shuffle',
    Riffle: 'Riffle Shuffle',
    Mimic: 'Mimic Shuffle Flow'
}

interface CardStateLog {
    action: string
    state: Card[]
    changes?: any
}

export interface CardCollectionInterface {
    cards: Card[];
    pastCardState: Array<CardStateLog>;
    get: () => Card[];
    deal: () => Card|undefined;
    clone: () => CardCollectionInterface;
    count: () => number;
    saveCardState: (action: string, changes?: any) => void;
    shuffle: (repeat?: number) => CardCollectionInterface;
    setShuffleMethod: (shuffle: string, options?: number) => CardCollectionInterface;
    setShuffleIteration: (iteration: number) => CardCollectionInterface;
    getCardsRemaining: (cardList?: Card[]) => number;
    getCards: (cardList: Card[] | Card, matchSuit: boolean) => Card[] | boolean;
    addCard: (card: Card | Card[]) => CardCollectionInterface;
    removeCards: (card: Card | number, matchSuit: boolean) => Card[] | boolean;
    tossCard: () => CardCollectionInterface;
    createCard: (representation: number, deck: number) => Card;
    generateDecks: (deck: number) => Card[];
    generateCardList: (numCards: number, deck: number, setRC: setRCType ) => Card[];
}

class CardCollection implements CardCollectionInterface {

    cards: Card[] = []
    pastCardState: Array<CardStateLog> = [] //stores the previous card ordering. index 0 = most recent
    
    private shuffleIteration: number = 2
    private doShuffle: () => CardCollectionInterface

    constructor(cards?: Card[]) {
        this.cards = cards ? cards : []
        this.doShuffle = this.rngShuffle.bind(this, this.shuffleIteration)
    }

    get() {
        return this.cards
    }

    deal() {
        let dealtCard = this.cards.shift()
        if (!dealtCard) {
            Notifier.error('Ran out of cards to dealt')
        }
        return dealtCard
    }

    clone() {
        return new CardCollection(this.cards)
    }

    count() {
        return this.cards.length
    }

    saveCardState(action: string, changes?: any) {
        let stateLog: CardStateLog = {
            action,
            state: this.cards,
            changes
        }
        this.pastCardState.unshift(stateLog)
    }

    shuffle(repeat?: number) {
        this.saveCardState('Shuffle')
        if (repeat) {
            this.setShuffleIteration(repeat)
        }

        return this.doShuffle()
    }

    setShuffleMethod(shuffle: string, options?: number) {
        if (ShuffleType.RNG == shuffle) {
            Notifier.notify(`Shuffling method set to: ${shuffle} with intensity ${options ? options : '"default"'}`)
            this.doShuffle = this.rngShuffle.bind(this, this.shuffleIteration, options)
        } else if (ShuffleType.Riffle == shuffle) {
            Notifier.notify(`Shuffling method set to: ${shuffle}`)
            this.doShuffle = this.riffle.bind(this, this.shuffleIteration)
        } else if (ShuffleType.Mimic == shuffle) {
            Notifier.notify(`Shuffling method set to: ${shuffle}`)
            this.doShuffle = this.mimicShufflePattern.bind(this, this.shuffleIteration)
        } else {
            Notifier.warn(`Unknown shuffling method. Shuffling method set to: ${ShuffleType.RNG} with intensity "default"`)
            this.doShuffle = this.rngShuffle.bind(this, this.shuffleIteration, options)
        }
        return this
    }

    setShuffleIteration(iteration: number) {
        iteration = iteration > 0 ? iteration : 2
        this.shuffleIteration = iteration
        return this
    }

    getCardsRemaining(cardList?: Card[]) {
        cardList = cardList ? cardList : this.cards
        return cardList.length
    }

    getCards(cardList: Card[] | Card, matchSuit: boolean = false) {
        cardList = (Array.isArray(cardList)) ? cardList : [cardList]
        let searchList = cardList as Card[]
        let comparator = matchSuit ? 
            (card: Card, searchCard: Card) => searchCard.getKey() == card.getKey() && searchCard.getSuit() == card.getSuit()
            :
            (card: Card, searchCard: Card) => searchCard.getKey() == card.getKey()
        let foundCards = this.cards.filter( c => {
            let found = searchList.filter(s => {
                return comparator(c, s)
            });
            return found.length > 0
        })

        if (foundCards.length > 0) {
            return foundCards
        } else {
            Notifier.notify('No card found')
            return false
        }
    }

    addCard(card: Card | Card[]) {
        this.saveCardState('Add Cards', card)
        this.cards.concat(card)
        return this
    }

    //Removes all matched cards
    removeCards(card: Card | number, matchSuit: boolean = false) {
        if (typeof card == 'number') {
            if (typeof this.cards[card] != 'undefined') {
                this.saveCardState('Remove Cards', [this.cards[card]])
                let removed = this.cards.splice(card, 1)
                return removed
            }
            else {
                Notifier.error('Invalid index')
                return false
            }
        }
        else {
            let comparator = matchSuit ? 
                (card: Card, searchCard: Card) => searchCard.getKey() == card.getKey() && searchCard.getSuit() == card.getSuit()
                :
                (card: Card, searchCard: Card) => searchCard.getKey() == card.getKey()
            let removedCards: Card[] = []
            let newCardList = this.cards.filter( c => {
                if (comparator(c, card)) {
                    //this is the card to remove, so return false
                    removedCards.push(c)
                    return false
                } else {
                    return true
                }
            })
            if (removedCards.length > 0) {
                this.saveCardState('Remove Cards', removedCards)
                this.cards = newCardList
                return removedCards
            } else {
                Notifier.notify('Cannot find specified cards to remove')
                return false
            }
        }
    }

    //Removes first card (goes straight to tha shoe bin)
    tossCard() {
        this.cards.shift()
        return this
    }

    createCard(representation: number, deck: number = 1) {
        // deck means the # of decks
        // representation means the index value (1-indexed) when cards are ordered in 
        // A (all suits), 2 (all suits), 3, 4, 5, ..., K (all suits)
        // i.e for 1 deck it would be
        // [A (spades), A (hearts), A (diamonds), A (clubs), 2(spades), 2 (hearts), 2 (diamonds), 2 (clubs), ...]
        // The corresponding values would be
        // [1 (represents A of spades), 2 (represents A of hearts), 3 (represents A of diamonds), 4 (represents A of clubs), ...]
        //
        // For two decks it would be
        // [1 (represents A of spades for deck 1), 2 (represents A of hearts for deck 1), 3 (represents A of diamonds for deck 1), 4 (represents A of clubs for deck 1),
        //  5 (represents A of spades for deck 2), 6 (represents A of hearts for deck 2), 7 (represents A of diamonds for deck 2), 8 (represents A of clubs for deck 2), ...]

        let cardIndex = representation % 4;
        let suit = SuitType.None;
        if (cardIndex == 0) {
            suit = SuitType.Spades
        } else if (cardIndex == 1) {
            suit = SuitType.Hearts
        } else if (cardIndex == 2) {
            suit = SuitType.Diamonds
        } else if (cardIndex == 3) {
            suit = SuitType.Clubs
        }

        let cardKey = CardNumberMap[Math.ceil(representation / (4*deck))]
        return new Card(cardKey, suit)
    }

    generateDecks(deck: number = 1) {
        deck = deck < 1 ? 1 : deck
        let cardList : Card[] = []
        
        for (let i = 1; i <= 52*deck; i++) {
            cardList.push(this.createCard(i, deck))
        }
        return cardList
    }

    generateCardList(numCards: number, deck: number = 1, setRC: setRCType = false ) {
        let cardList: Card[] = []
        
        deck = deck >= 1 ? deck : 1
        numCards = numCards < 1 ? 52 : numCards
        numCards = numCards > 52*deck ? 52*deck : numCards

        
        if (setRC === false) {
            //Determine which logic to use for performance
            if ( numCards/(52*deck) >= 0.6 ) {
                //Faster to remove the cards
                // console.log('Create cards by creating complete deck then removing random cards')
                let completeCardList: Card[] = this.generateDecks(deck)
                let totalCards = completeCardList.length
                //Start removing card until only numCards left
                let removedList = []
                for (let i = 1; i <= totalCards - numCards; i++) {
                    let randomIndex = randomizeBetween(0, 52*deck-1)
                    while (removedList.indexOf(randomIndex) > -1) {
                        randomIndex = randomizeBetween(0, 52*deck-1)
                    }
                    removedList.push(randomIndex)
                    delete completeCardList[randomIndex]
                }
                cardList = completeCardList.filter(val => val)
            } else {
                //Faster to generate the cards
                // console.log('Create cards by creating random cards')
                let createdCards:number[] = []
                for (let i = 1; i <= numCards; i++) {
                    let represenationValue = randomizeBetween(1, 52*deck)
                    while (createdCards.indexOf(represenationValue) > -1) {
                        represenationValue = randomizeBetween(1, 52*deck)
                    }
                    createdCards.push(represenationValue)
                }
                cardList = createdCards.map( presentationVal => this.createCard(presentationVal, deck))
            }

        } else {
            //NOT AVAILABLE ATM
            Notifier.warn('This functionality is WIP')
            cardList = this.generateDecks()
            //NOT AVAILABLE ATM
        }

        return cardList
    }

    private rngShuffle(repeat: number, intensity?: number) {
        // intensity means how many swaps to do (1 swap is 1 card switch position with another card)
        // default intensity is # of cards * 3
        // This is purely shuffling by RNG, does not mimic human shuffling
        // This may be what machine shuffling does for 2 decks

        let shuffling : Card[] = this.cards.map( c => Object.assign({}, c))
        intensity = intensity && intensity > 0 ? intensity : shuffling.length*3
        for (let iter = 0; iter < repeat; iter++) {
            for (let i = 0; i < intensity; i++) {
                let randomized1 = randomizeBetween(0, shuffling.length-1)
                let randomized2 = randomizeBetween(0, shuffling.length-1)
                while (randomized2 === randomized1) {
                    randomized2 = randomizeBetween(0, shuffling.length-1)
                }
                let swapped: Card = shuffling[randomized1]
                shuffling[randomized1] = shuffling[randomized2]
                shuffling[randomized2] = swapped;
            }
        }

        this.cards = shuffling
        return this
    }

    private riffle(repeat: number) {
        //This mimics the riffle (common) shuffling method with introduced roughness to simulate human riffle shuffle
        Notifier.warn(`Riffle Shuffle is WIP`)
        return this
    }

    private mimicShufflePattern(repeat: number = 2, decks: number = 6) {
        // NOTE: RANDOMNESS IS KEY HERE. DO NOT CODE SO IT HAS PRECISE SHUFFLING
        // Can try to mimic the shuffling flow for 6 or 8 decks
        // 1) Need to cut off last % (1-penetration), split that into ROUGHLY 3 parts
        // 2) Insert those 3 parts in ROUGHLY even spread into the remaining stack [name = whole stack ]
        // 3) Split the whole stack into ROUGHLY 2 halves [names = 1st half, 2nd half]
        // 4) Take ROUGHLY 33% from 1st half and 2 half, and call shuffle fn [names = shuffled1, shuffled2]
        // 5) Stack from bottom to top: shuffled1, shuffled2, shuffled3
        // 6) Repeat step 3 - 5 for n times
        // 7) Done
        Notifier.warn(`Mimic Shuffle Flow is WIP`)
        return this
    }
}

class Deck extends CardCollection implements CardCollectionInterface {

    constructor({ cards, setRC = false } : deckConstructorType = {}) {
        super()
        if (cards) {
            this.cards = Array.isArray(cards) ? cards as Card[] : this.generateCardList(cards as number, 1, setRC)
        } else {
            //generate standard deck
            this.cards = this.generateDecks(1)
        }
    }

    clone() {
        return new Deck({cards: this.cards})
    }

}

class Shoe extends CardCollection implements CardCollectionInterface {

    protected deck: number;

    constructor({ cards, deck = 2, setRC = false } : shoeConstructorType = {}) {
        super()
        this.deck = deck < 1 ? 2 : deck //default to 2 decks if invalid
        if (cards) {
            this.cards = Array.isArray(cards) ? cards as Card[] : this.generateCardList(cards as number, this.deck, setRC)
        } else {
            //generate standard shoe with specified decks
            this.cards = this.generateDecks(this.deck)
        }
    }

    clone() {
        return new Shoe({cards: this.cards, deck: this.deck})
    }

}

export { Deck, Shoe, ShuffleType }
export default CardCollection