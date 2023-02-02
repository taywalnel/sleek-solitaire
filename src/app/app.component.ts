import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { deckOfCards } from './constants/deck-of-cards';
import { startingCardPositions } from './constants/starting-card-positions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  tableau1: { suit: string, value: string }[] = [];
  cards: { suit: string, value: string, location: string }[];
  cardDrop$ = new Subject<any>;

  @ViewChild('tableau') tableauSection: ElementRef;

  ngOnInit(){
    this.cardDrop$.subscribe((event: { card: { suit: string, value: string, location: string }, clientX: number, clientY: number }) => {
      const listOfCardsWithPositions = this.getBoundingClientRectForEachCard();
      const indexOfRowCardWasDroppedOn = this.checkIfCardWasDroppedOnARow(event, listOfCardsWithPositions);
      if(indexOfRowCardWasDroppedOn !== -1){
        this.updateCardLocation(event.card, indexOfRowCardWasDroppedOn);
      }
    })
  }

  updateCardLocation(movedCard: { suit: string, value: string, location: string }, newLocation: number ){
    const indexOfCardToUpdate = this.cards.findIndex((card) => {
      if(card === movedCard){
        return true;
      }
      return false;
    });
    const cardToUpdate = this.cards[indexOfCardToUpdate];
    cardToUpdate.location = newLocation.toString();
    this.cards.splice(indexOfCardToUpdate, 1);
    this.cards.push(cardToUpdate);
  }

  getBoundingClientRectForEachCard(){
    const rects: { row: number, rect: DOMRect}[] = [];
    this.tableauSection.nativeElement.childNodes.forEach((row: any, rowIndex: number) => {
      row.childNodes[0].childNodes.forEach((card: any) => {
        if(card.nodeName === 'APP-CARD'){
          rects.push({ row: rowIndex + 1, rect: card.childNodes[0].getBoundingClientRect() });
        }
      });
    })
    return rects;
  }

  checkIfCardWasDroppedOnARow(event: any, listOfCardsWithPositions: { row: number, rect: DOMRect}[]){
    const previousLocationOfCard = event.card.location;
    let indexOfRowCardWasDroppedOn = -1;

    listOfCardsWithPositions.forEach((cardToCheck) => {
      if(cardToCheck.row == previousLocationOfCard) return;
      const cardInSectionHorizontally = event.clientX > cardToCheck.rect.left && event.clientX < cardToCheck.rect.right;
      const cardInSectionVertically = event.clientY > cardToCheck.rect.top && event.clientY < cardToCheck.rect.bottom;
      if(cardInSectionHorizontally && cardInSectionVertically){
        indexOfRowCardWasDroppedOn = cardToCheck.row;
      }
    })
    return indexOfRowCardWasDroppedOn;
  }

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

  filterCardsByLocation(location: string){
    if(!this.cards) return [];
    return this.cards.filter((card) => card.location === location);
  }
}
