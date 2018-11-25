import Card, { CardNumberMap, SuitType } from './Card'


class Deck {

    public cards : Card[];

    constructor() {
        this.cards = this.generateDecks()
    }

    generateDecks(set: number = 1) {
        set = set < 1 ? 1 : set
        let cardList : Card[] = []
        for (let i = 1; i <= 52*set; i++) {
            let cardIndex = i % 4;
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

            let cardKey = CardNumberMap[Math.ceil(i / 4)]
            cardList.push(new Card(cardKey, suit))
        }

        return cardList
    }

}

export default Deck