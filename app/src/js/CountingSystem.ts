import Card from "./card";
import { uniqueFilter } from './Utility';
import Notifier from "./Notifier";
import CardCollection, { CardCollectionInterface } from "./CardCollection";

export interface CountingSystemInterface {
    tc: number;
    rc: number; //running count
    name: string;
    rules: Array<CountingRule>;
    endCount: number; //end count for counting down one deck (balanced system = 0)

    getName: () => string;
    getRules: () => Array<CountingRule>;
    getTC: () => number;
    getRC: () => number;
    processCardCount: (card: Card) => number;
    countCards: (cards: Card[] | CardCollectionInterface) => CountingSystemInterface
}

class CountingSystem implements CountingSystemInterface {
    
    public tc: number = 0;
    public rc: number = 0;
    public name: string = '';
    public rules: Array<CountingRule> = [];
    public endCount: number = 0;

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

        if (value == null) {
            Notifier.error(`No rules found for this card: ${card.key}. Count of 0 is assumed`);
            value = 0;
        }
        return value
    }

    countCards = (cards: Card[] | CardCollectionInterface) => {
        this.rc = 0 // reset running count
        if (!Array.isArray(cards)) {
            cards = cards as CardCollectionInterface
            cards = cards.get()
        }

        cards.forEach( (c) => {
            this.rc += this.processCardCount(c)
        })

        return this
    }
}

export interface CountingRuleInterface {
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
    public systemListName: string[] = [];
    public systemList: CountingSystemInterface[] = [];

    constructor(systems?: CountingSystemInterface | CountingSystemInterface[]) {
        this.systemList = systems ? 
                            (Array.isArray(systems)) ? systems : [systems]
                            :
                            []
        this.updateSystemListName()
    }

    add(systems: CountingSystemInterface | CountingSystemInterface[]) {
        let addRequested = (Array.isArray(systems)) ? systems : [systems]
        let addRequestdUnique = uniqueFilter(addRequested, (system) => system.getName())
        addRequestdUnique = addRequestdUnique.filter( a => this.systemListName.indexOf(a.getName()) == -1)
        
        if (addRequestdUnique.length > 0) { 
            this.systemList.push(...addRequestdUnique)
            this.updateSystemListName()
        }
        return this
    }

    remove(systems: CountingSystemInterface | CountingSystemInterface[] | number) {
        if (typeof systems == 'number') {
            if (typeof this.systemList[systems as number] != 'undefined') {
                this.systemList.splice(systems as number, 1)
            }
            else {
                Notifier.warn('Index to remove does not exist')
            }
        } 
        else {
            let removeList = (Array.isArray(systems)) ? systems : [systems]
            let newSystemList : CountingSystemInterface[] = []
            this.systemList.forEach( s => {
                let shouldStay: boolean = true
                removeList.forEach( (r) => {
                    if (s.getName() == r.getName()) {
                        shouldStay = false
                    }
                })
                if (shouldStay) {
                    newSystemList.push(s)
                }
            })

            this.systemList = newSystemList
        }

        this.updateSystemListName()
        return this
    }

    removeAll() {
        this.systemList = []
        this.updateSystemListName()
        return this
    }


    updateSystemListName() {
        this.systemListName = this.systemList.map( s => s.getName() )
    }

    getSystemNames() {
        return this.systemListName
    }

    getSystem() {
        return this.systemList
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

const CSManager = new CountingSystemManager()

export { HiLo, WongHalves, OmegaII, CountingSystem, CountingSystemManager }
export default CSManager