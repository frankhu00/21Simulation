import { Shoe, Deck } from '../app/src/js/CardCollection';
import { randomizeBetween } from '../app/src/js/Utility';
import { expect } from 'chai';
import 'mocha';
import Card, { SuitType } from '../app/src/js/Card';
import CSManager, { HiLo, WongHalves, OmegaII } from '../app/src/js/CountingSystem';



describe('CSManager / Counting System Test', () => {

    describe('CSManager Methods Test', () => {

        beforeEach(() => {
            CSManager.removeAll()
        })

        it('CSManager add new counting systems', () => {
            CSManager.add([new OmegaII(), new WongHalves()])
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames: string[] = [
                new OmegaII().getName(),
                new WongHalves().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager does not add repeated systems (multiple calls to add method with repeated systems)', () => {
            CSManager.add(new HiLo())
            CSManager.add(new HiLo())
            CSManager.add(new OmegaII())
            CSManager.add(new HiLo())
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames: string[] = [
                new HiLo().getName(),
                new OmegaII().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager does not add repeated systems (array input with repeated systems)', () => {
            CSManager.add([new HiLo(), new HiLo(), new HiLo()])
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames = [
                new HiLo().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager remove one counting system via CountingSystem class', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove(new OmegaII)
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames: string[] = [
                new HiLo().getName(),
                new WongHalves().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager remove mulitple systems via CountingSystem class', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove([new OmegaII, new HiLo()])
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames:string[] = [
                new WongHalves().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager remove one counting system via systemList index', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).remove(2)
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames: string[] = [
                new HiLo().getName(),
                new OmegaII().getName()
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })
    
        it('CSManager remove all systems', () => {
            CSManager.add([new HiLo(), new OmegaII(), new WongHalves()]).removeAll()
            let systemNames = CSManager.getSystemNames()
            let shouldHaveSystemNames: string[] = [
            ]
    
            expect(systemNames).to.eql(shouldHaveSystemNames);
        })

    })


    describe('Card Counting Test - Using HiLo, WongHavles, and OmegaII', () => {

        let rcP2_List = [new Card("K"), new Card("J"), new Card("8"), new Card("A"), new Card("4"), new Card("6"), new Card("6"), new Card("10"), new Card("J"), new Card("4"), new Card("5"), new Card("8"), new Card("9"), new Card("Q"), new Card("A"), new Card("J"), new Card("2"), new Card("3"), new Card("2"), new Card("8"), new Card("7"), new Card("2"), new Card("5")];
        let rcN3_List = [new Card("2"), new Card("J"), new Card("J"), new Card("10"), new Card("9"), new Card("3"), new Card("6"), new Card("8"), new Card("8"), new Card("9"), new Card("Q"), new Card("Q"), new Card("K"), new Card("J"), new Card("10"), new Card("4"), new Card("3"), new Card("2"), new Card("9"), new Card("7"), new Card("7"), new Card("5"), new Card("A"), new Card("A")];

        it('HiLo - Predefined Deck - Running Count should be +2, -3, and 0', () => {
            let deck1 = new Deck({ cards: rcP2_List})
            let deck2 = new Deck({ cards: rcN3_List})
            let deck3 = new Deck()
            let HiLoSystem = new HiLo()
            let result: {[key: string]: number} = {
                'rcP2': HiLoSystem.countCards(deck1).getRC(),
                'rcN3': HiLoSystem.countCards(deck2).getRC(),
                'rc0': HiLoSystem.countCards(deck3).getRC()
            }

            expect(result).to.eql({
                'rcP2': 2,
                'rcN3': -3,
                'rc0': 0
            });
        })

    })
})
