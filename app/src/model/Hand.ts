import Card from './Card'
import Notifier from './Notifier';
import { PlayerType } from './Player';

export interface PlayingHand {
    hit: (card: Card) => PlayingHand
    stand: () => PlayingHand
    split: () => PlayingHand[];
    surrender: () => void
    computeValue: () => void
    dealFirstCard: (card: Card) => PlayingHand
    dealSecondCard: (card: Card) => PlayingHand
    getFirstCard: () => Card|undefined
    getSecondCard: () => Card|undefined
    getValue: () => number[]
    getRawValue: () => number[]
    getHighestValue: () => number
    getTotalCards: () => number
    getBet: () => number
    setBet: (bet: number) => PlayingHand
    // firstCard?: Card,
    // secondCard?: Card,
    // handCards: Card[]
    // value: number[] //for cases like soft 17
    // bet: number
    isDealer: boolean
    isControllable: boolean
    isBusted: boolean
    isBlackJack: boolean
    isHandValid: boolean
    isEmptyHand: boolean
    isInsured: boolean
    playerType: PlayerType
}

class Hand implements PlayingHand {

    private firstCard?: Card = undefined
    private secondCard?: Card = undefined
    private handCards: Card[] = []
    private bet: number = 0
    private value: number[] = [0]


    public isHandValid: boolean = false
    public isBusted: boolean = false
    public isDealer: boolean = false
    public isControllable: boolean = false
    public isBlackJack: boolean = false
    public isInsured: boolean = false
    public isEmptyHand: boolean = true
    public playerType: PlayerType


    constructor(firstCard?: Card,  bet?: number, playerType: PlayerType = PlayerType.NPC) {
        this.playerType = playerType

        this.bet = (bet) ? bet : 0

        if (playerType == PlayerType.MC) {
            this.isControllable = true
            this.isDealer = false
        }
        else {
            this.isControllable = false
            this.isDealer = (playerType == PlayerType.Dealer)
        }

        if (firstCard) {
            this.firstCard = firstCard
            this.handCards.push(firstCard)
            this.isEmptyHand = false;
        }
        else {
            this.isEmptyHand = true;
            this.bet = 0
        }
    }

    hit(card: Card) {
        if (this.isHandValid && !this.isBusted) {
            this.handCards.push(card)
            this.computeValue()
        } else {
            Notifier.error('Invalid Hand. Cannot hit')
        }

        return this
    }

    dealFirstCard(card: Card) {
        this.firstCard = card
        this.handCards.push(card)
        this.isEmptyHand = false
        this.isHandValid = false

        return this
    }

    dealSecondCard(card: Card) {
        this.secondCard = card
        this.handCards.push(card)
        this.isHandValid = (this.handCards.length >= 2 && this.bet > 0)
        this.isBusted = false

        this.resetValue()
        this.computeValue()

        this.isBlackJack = this.handCards.length == 2 && this.value.indexOf(21) > -1
        return this
    }

    

    getFirstCard = () => {
        return this.firstCard
    }

    getSecondCard = () => {
        return this.secondCard
    }

    getBet = () => {
        return this.bet
    }

    getTotalCards = () => {
        return this.handCards.length
    }

    setBet = (bet: number) => {
        //This only tests for bet can't be < 0, the min/max bet part will be handled via Player class
        this.bet = (bet > 0) ? bet : 0
        return this
    }

    computeValue() {
        if (!this.isHandValid) {
            this.resetValue()
            Notifier.error('Invalid Hand. Cannot compute value')
            return
        }

        let hasSoftValue: boolean = false
        let valueList = this.handCards.map( c => {
            const values = c.getValue()
            if (values.length == 2) {
                hasSoftValue = true
            }
            return values
        })

        let firstValue = valueList.reduce( (a: number[], b) => { 
            return [a[0] + b[0]]
        }, [0])

        if (hasSoftValue) {
            let index = valueList.findIndex( v => {
                return v.length == 2
            })
            valueList[index] = [valueList[index][1]] //only the first A needs to be 1 or 11
            let secondValue = valueList.reduce( (a: number[], b) => { 
                return [a[0] + b[0]]
            }, [0])

            this.value = [firstValue[0], secondValue[0]]
        }
        else {
            this.value = firstValue
        }

        this.isBusted = this.value.every( v => v > 21)
    }

    getValue() {
        return this.value.filter( v => v <= 21)
    }

    getRawValue = () => {
        return this.value
    }

    getHighestValue() {
        if (this.value.length == 1) {
            return this.value[0] > 21 ? 0 : this.value[0]
        }
        else {
            let validValues = this.value.filter(v => v <= 21)
            if (validValues.length > 0) {
                return validValues.reduce((a, b) => {
                    return (a > b) ? a : b
                }, 0)
            } else {
                return 0
            }
        }
    }

    resetValue() {
        this.value = [0]
    }

    stand() {
        return this
    }

    split() {
        //need to run check first
        return [new Hand(this.firstCard), new Hand(this.secondCard as Card)]
    }
    
    surrender() {

    }

}

export default Hand