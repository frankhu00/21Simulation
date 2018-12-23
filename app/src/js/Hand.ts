import Card from './Card'
import Notifier from './Notifier';

export interface PlayingHand {
    hit: (card: Card) => PlayingHand
    stand: () => PlayingHand
    split: () => void
    doubleDown: () => PlayingHand
    insurance: () => void
    surrender: () => void
    canHit: () => boolean
    canSplit: () => boolean
    canDoubleDown: () => boolean
    canSurrender: () => boolean
    computeValue: () => void
    getSecondCard: (card: Card) => PlayingHand
    firstCard: Card,
    secondCard: Card | undefined,
    handCards: Card[]
    value: number[] //for cases like soft 17
    bet: number
    isDealer: boolean
    isBusted: boolean
    isHandValid: boolean
    // gameRule: PlayRuleOption //hmmm.... NO this should not be here
}

// class Hand implements PlayingHand {
class Hand {

    public firstCard: Card
    public secondCard?: Card = undefined
    public handCards: Card[] = []
    public isHandValid: boolean = false
    public isBusted: boolean = false
    public isDealer: boolean = false
    public value: number[] = [0]


    constructor(firstCard: Card, isDealer: boolean = false) {
        this.firstCard = firstCard
        this.handCards.push(firstCard)
    }

    hit(card: Card) {
        //need isHandValid testW
        if (this.isHandValid && !this.isBusted) {
            this.handCards.push(card)
            this.computeValue()
        } else {
            Notifier.error('Invalid Hand. Cannot hit')
        }

        return this
    }

    getSecondCard(card: Card) {
        this.secondCard = card
        this.handCards.push(card)
        this.isHandValid = (this.handCards.length >= 2)
        this.isBusted = false

        this.resetValue()
        this.computeValue()

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
            if (this.value.length == 2) {
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

    resetValue() {
        this.value = [0]
    }

}

export default Hand