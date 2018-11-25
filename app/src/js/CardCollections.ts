import Card, { CardNumberMap, SuitType } from './Card'
import Notifier from './Notifier'
import { CountingSystem } from './CountingSystem'
import { randomizeBetween } from './Utility'

type RCObjectType = {[key: string]: CountingSystem | number}
type setRCType = RCObjectType | boolean
type deckConstructorType = { cards?: Card[] | number, setRC?: setRCType }
type shoeConstructorType = { deck?: number, cards?: Card[] | number, allowRepeats?: number, setRC?: setRCType }

const ShuffleType = {
    RNG: 'RNG Shuffle',
    Riffle: 'Riffle Shuffle',
    Mimic: 'Mimic Shuffle Flow'
}

class CardCollections {

    public cards: Card[] = []
    public pastCardsState: Array<Card[]> = [] //stores the previous card ordering. index 0 = most recent
    protected shuffleIteration: number = 2
    protected doShuffle: (repeat: number) => void

    constructor() {
        this.doShuffle = this.rngShuffle.bind(this, this.shuffleIteration)
    }

    get() {
        return this.cards
    }

    shuffle(repeat: number) {
        //Save current card ordering before shuffling... might have reference issue
        this.pastCardsState.push(this.cards)
        return this.doShuffle(repeat)
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
    }

    setShuffleIteration(iteration: number) {
        iteration = iteration > 0 ? iteration : 2
        this.shuffleIteration = iteration
    }

    getCardsRemaining(cardList?: Card[]) {
        cardList = cardList ? cardList : this.cards
        return cardList.length
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

class Deck extends CardCollections {

    constructor({ cards, setRC = false } : deckConstructorType = {}) {
        super()
        if (cards) {
            this.cards = Array.isArray(cards) ? cards as Card[] : this.generateCardList(cards as number, 1, setRC)
        } else {
            //generate standard deck
            this.cards = this.generateDecks(1)
        }
    }

}

class Shoe extends CardCollections {

    //use allowRepeats = -1 to turn off restriction completely
    //                 = 0 to default it to (deck-1) (max repeat possible)
    //                 = 1 means 1 REPEAT (so it can have two "A of Spades")
    constructor({ cards, deck = 2, allowRepeats = 0, setRC = false } : shoeConstructorType = {}) {
        super()
        deck = deck < 1 ? 2 : deck //default to 2 decks if invalid
        allowRepeats = allowRepeats === 0 ? deck-1 : allowRepeats 
        if (cards) {
            this.cards = Array.isArray(cards) ? cards as Card[] : this.generateCardList(cards as number, deck, setRC)
        } else {
            //generate standard shoe with specified decks
            this.cards = this.generateDecks(deck)
        }
    }

}

export { Deck, Shoe, ShuffleType }
export default CardCollections