import 'mocha';
import { expect } from 'chai';

import Card from '../app/src/js/Card';
import Hand from '../app/src/js/Hand';

describe('Playing Hand Tests', () => {

    let CA = new Card('A')
    let C2 = new Card('2')
    let C3 = new Card('3')
    let C4 = new Card('4')
    let C5 = new Card('5')
    let C6 = new Card('6')
    let C7 = new Card('7')
    let C8 = new Card('8')
    let C9 = new Card('9')
    let C10 = new Card('10')
    let CJ = new Card('j')
    let CQ = new Card('q')
    let CK = new Card('K')

    it('Can Compute Values', () => {

        let hand1 = new Hand(C3)
        let hand2 = new Hand(C8)
        let hand3 = new Hand(C5)
        let hand4 = new Hand(CA)
        let hand5 = new Hand(CA)
        let hand6 = new Hand(CQ)
        let invalidHand = new Hand(CK)

        hand1.getSecondCard(C7)

        hand2.getSecondCard(C7)
        hand2.hit(C10)

        hand3.getSecondCard(C6)
        hand3.hit(C2).hit(C7)
        
        hand4.getSecondCard(C6).hit(CA)

        hand5.getSecondCard(C2)

        hand6.getSecondCard(C6).hit(CA).hit(C3)

        let shouldBe: {[key: string]: any[]} = {
            'hand1': [3+7, false],
            'hand2': [8+7+10, true],
            'hand3': [5+6+2+7, false],
            'hand4': [11+6+1, 1+6+1, false],
            'hand5': [11+2, 1+2, false],
            'hand6': [10+6+1+3, 10+6+11+3, false],
            'invalidHand': [0, false]
        }
 
        let results: {[key: string]: any[]} = {
            'hand1': [...hand1.value, hand1.isBusted],
            'hand2': [...hand2.value, hand2.isBusted],
            'hand3': [...hand3.value, hand3.isBusted],
            'hand4': [...hand4.value, hand4.isBusted],
            'hand5': [...hand5.value, hand5.isBusted],
            'hand6': [...hand6.value, hand6.isBusted],
            'invalidHand': [0, invalidHand.isBusted]
        }

        for (let key in shouldBe) {
            expect(results[key]).to.have.members(shouldBe[key])
            expect(results[key].length).to.equal(shouldBe[key].length)
        }
    })

    it('Can Get Highest Valid Value', () => {
        let hand1 = new Hand(C4)
        let hand2 = new Hand(C9)
        let hand3 = new Hand(CJ)

        hand1.getSecondCard(C8).hit(CA) //value = [4+8+1, 4+8+11]
        hand2.getSecondCard(CJ)
        hand3.getSecondCard(C5).hit(CA).hit(CK)

        let results: {[key: string]: number} = {
            'hand1': hand1.getHighestValue(),
            'hand2': hand2.getHighestValue(),
            'hand3': hand3.getHighestValue()
        }

        let shouldBe: {[key: string]: number} = {
            'hand1': 4+8+1,
            'hand2': 10+9,
            'hand3': 0
        }

        for (let key in shouldBe) {
            expect(results[key]).to.equal(shouldBe[key])
        }

    })

});