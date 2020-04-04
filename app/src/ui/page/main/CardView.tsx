import React, { Component } from 'react';
import styled from 'styled-components';

import Card, { SuitType } from '~model/Card';

const CardHolder = styled.div`
    border: 1px solid black;
    border-radius: 2px;
    padding: 10px;
    margin: 5px 0px;
`;

interface CardViewProps {
    card?: Card;
}

interface CardViewStates {
    card: Card;
}

const getInitialCard = (props: CardViewProps) =>
    props.card ? props.card : new Card('A', SuitType.Spades);

export default class CardView extends Component<CardViewProps, CardViewStates> {
    readonly state = { card: getInitialCard(this.props) };

    render() {
        return (
            <CardHolder>{`${this.state.card.getSuit()} ${this.state.card.getKey()}`}</CardHolder>
        );
    }
}
