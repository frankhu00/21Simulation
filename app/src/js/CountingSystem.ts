import Card from "./card";
import Notifier from "./Notifier";

abstract class CountingSystem {
    public tc: number = 0;
    public rc: number = 0; //running count
    abstract name: string;
    abstract rules: Array<CountingRule>;
    abstract endCount: number; //end count for counting down one deck (balanced system = 0)

    getName = () => {
        return this.name
    }

    getRules = () => {
        return this.rules
    }

    getTC = () => {
        return this.tc
    }

    getRC = () => {
        return this.rc
    }

    processCardCount = (card: Card) => {
        let value = null
        for (let i = 0; i < this.rules.length; i++) {
            if (this.rules[i].hasCard(card)) {
                value = this.rules[i].value
                break
            }
        }

        if (!value) {
            Notifier.error(`No rules found for this card: ${card.key}. Count of 0 is assumed`);
            value = 0;
        }
        return value
    }
}

interface CountingRuleInterface {
    cards: Array<Card>;
    value: number;
    hasCard(card: Card) : boolean;
}

class CountingRule implements CountingRuleInterface {
    public cards:  Array<Card>;
    public value:  number;

    constructor(cards: Array<Card>, value: number) {
        this.cards = cards
        this.value = value
    }

    hasCard(card: Card) {
        return this.cards.filter( c => c.key == card.key).length > 0
    }
}

class HiLo extends CountingSystem {
    public endCount: number
    public name: string
    public rules: Array<CountingRule>

    constructor() {
        super();
        this.name = 'Hi Lo'
        this.endCount = 0
        this.rules = [
            new CountingRule([
                new Card('2'),
                new Card('3'),
                new Card('4'),
                new Card('5'),
                new Card('6')
            ], 1),
            new CountingRule([
                new Card('10'),
                new Card('J'),
                new Card('Q'),
                new Card('K'),
                new Card('A')
            ], -1),
            new CountingRule([
                new Card('7'),
                new Card('8'),
                new Card('9')
            ], 0)
        ]
    }
}

class WongHalves extends CountingSystem {
    public endCount: number
    public name: string
    public rules: Array<CountingRule>

    constructor() {
        super();
        this.name = 'WongHalves'
        this.endCount = 0
        this.rules = [
            new CountingRule([
                new Card('2'),
                new Card('7')
            ], 0.5),
            new CountingRule([
                new Card('3'),
                new Card('4'),
                new Card('6')
            ], 1),
            new CountingRule([
                new Card('5')
            ], 1.5),
            new CountingRule([
                new Card('9')
            ], -0.5),
            new CountingRule([
                new Card('10'),
                new Card('J'),
                new Card('Q'),
                new Card('K'),
                new Card('A')
            ], -1),
            new CountingRule([
                new Card('8')
            ], 0)
        ]
    }
}

class OmegaII extends CountingSystem {
    public endCount: number
    public name: string
    public rules: Array<CountingRule>

    constructor() {
        super();
        this.name = 'Omega II'
        this.endCount = 0
        this.rules = [
            new CountingRule([
                new Card('2'),
                new Card('3'),
                new Card('7')
            ], 1),
            new CountingRule([
                new Card('4'),
                new Card('5'),
                new Card('6')
            ], 2),
            new CountingRule([
                new Card('9')
            ], -1),
            new CountingRule([
                new Card('10'),
                new Card('J'),
                new Card('Q'),
                new Card('K')
            ], -2),
            new CountingRule([
                new Card('8'),
                new Card('A')
            ], 0)
        ]
    }
}

class CountingSystemManager {
    public systemListName: string[];
    public systemList: CountingSystem[];

    constructor(systems: CountingSystem | CountingSystem[]) {
        this.systemList = (Array.isArray(systems)) ? systems : [systems]
        this.systemListName = this.systemList.map( s => s.getName() )
    }

    add(systems: CountingSystem | CountingSystem[]) {
        let addRequested = (Array.isArray(systems)) ? systems : [systems]
        addRequested = addRequested.filter( a => this.systemListName.indexOf(a.getName()) == -1)
        
        if (addRequested.length > 0) { this.systemList.push(...addRequested) }
        return this
    }

    remove(systems: CountingSystem | CountingSystem[]) {
        let removeList = (Array.isArray(systems)) ? systems : [systems]
        let newSystemList : CountingSystem[] = []
        this.systemList.forEach( s => {
            removeList.forEach( (r) => {
                if (s.getName() != r.getName()) {
                    newSystemList.push(s)
                }
            })
        })

        this.systemList = newSystemList
        return this
    }

    getSystemCount() {
        return this.systemList.map( s => {
            return { 
                [s.getName()]: { 
                    'TC': s.getTC(),
                    'RC': s.getRC()
                }
            }
        })
    }
}

const CSManager = new CountingSystemManager(new HiLo())

export { HiLo, WongHalves, OmegaII, CountingSystem, CountingSystemManager }
export default CSManager