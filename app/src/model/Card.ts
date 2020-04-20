let BJCardValueMap: { [key: string]: number[] } = {
    K: [10],
    Q: [10],
    J: [10],
    '10': [10],
    '9': [9],
    '8': [8],
    '7': [7],
    '6': [6],
    '5': [5],
    '4': [4],
    '3': [3],
    '2': [2],
    A: [1, 11],
};

let CardNumberMap: { [key: number]: string } = {
    1: 'A',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '10',
    11: 'J',
    12: 'Q',
    13: 'K',
};

const SuitType = {
    Spades: 'Spades',
    Hearts: 'Hearts',
    Diamonds: 'Diamonds',
    Clubs: 'Clubs',
    None: 'None', //doesn't matter
};

class Card {
    public suit: string;
    public key: string;
    public value: number[];
    public isVisible: boolean;

    constructor(key: string, suit?: string) {
        this.isVisible = false;
        this.key = key;
        this.value = BJCardValueMap[key.toUpperCase()];
        this.suit = suit ? suit : SuitType.None;
    }

    get() {
        return {
            key: this.key,
            value: this.value,
            suit: this.suit,
        };
    }

    getValue() {
        return this.value;
    }

    getKey() {
        return this.key;
    }

    getSuit() {
        return this.suit;
    }

    /**
     * So dealer can do the "flip over second card" action
     */
    show() {
        this.isVisible = true;
        return this;
    }

    /**
     * Test if a given card is one of the search cards
     * @param {any[]} keys - Card key values (toString is called so '4' and 4 is the same)
     */
    isOneOf(keys: any[]) {
        return keys.filter((k: any) => k.toString() == this.getKey()).length > 0;
    }
}

export { BJCardValueMap, CardNumberMap, SuitType };
export default Card;
