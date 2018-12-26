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
    getHighestValue: () => number
    firstCard: Card,
    secondCard: Card | undefined,
    handCards: Card[]
    value: number[] //for cases like soft 17
    bet: number
    isDealer: boolean
    isBusted: boolean
    isBlackJack: boolean
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
    public isBlackJack: boolean = false
    public value: number[] = [0]


    constructor(firstCard: Card, isDealer: boolean = false) {
        this.firstCard = firstCard
        this.handCards.push(firstCard)
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

    getSecondCard(card: Card) {
        this.secondCard = card
        this.handCards.push(card)
        this.isHandValid = (this.handCards.length >= 2)
        this.isBusted = false

        this.resetValue()
        this.computeValue()

        this.isBlackJack = this.handCards.length == 2 && this.value.indexOf(21) > -1
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

}

export default Hand