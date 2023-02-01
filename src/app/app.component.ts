import { Component } from '@angular/core';
import { deckOfCards } from './constants/deck-of-cards';
import { startingCardPositions } from './constants/starting-card-positions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  tableau1: { suit: string, value: string }[] = [];
  cards: { suit: string, value: string, location: string }[];

  startGame(){
    //need to check if a game is already in progress
    this.dealCards();
  }

  dealCards() {
    const shuffledCards = this.shuffleCards(deckOfCards);
    this.cards = this.setStartingPositions(shuffledCards);
  }

  shuffleCards(unshuffledCards: { suit: string, value: string }[]): { suit: string, value: string }[] {
    // shout out to fisher yates for providing this shuffling algorithm
    let currentIndex = unshuffledCards.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [unshuffledCards[currentIndex], unshuffledCards[randomIndex]] = [unshuffledCards[randomIndex], unshuffledCards[currentIndex]];
    }
    return unshuffledCards;
  }

  setStartingPositions(cards: { suit: string, value: string }[]){
    const cardsWithStartingPositions: { suit: string, value: string, location: string }[] = [];
    startingCardPositions.forEach((position, index) => {
      cardsWithStartingPositions.push({...cards[index], location: position});
    });
    return cardsWithStartingPositions;
  }
}
