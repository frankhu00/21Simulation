import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'

import Card, { SuitType } from '../js/Card'
import Hand from '../js/Hand'
import { Shoe, Deck } from '../js/CardCollection'
import CSManager, { HiLo, WongHalves, OmegaII, CountingSystemManager } from '../js/CountingSystem'

import { CardView, CardListView } from './pages/main/index'

const AppContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
`

window.CSManager = CSManager
window.deck = new Deck();
window.hand = Hand;
window.card = Card;

class App extends Component {

    componentDidMount() {
        CSManager.add([new HiLo(), new OmegaII(), new WongHalves()])
    }

    render() {
        return (
            <AppContainer>
                <CardView card={new Card('Q', SuitType.Hearts)}/>
                <CardListView cards={ new Deck({cards: 25}).get() }/>
                <CardListView cards={ new Shoe().get() }/>
            </AppContainer>
        )
    }
}

export default hot(module)(App)