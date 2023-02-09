import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { deckOfCards } from './constants/deck-of-cards';

export interface PlayingCard {
  suit: string;
  value: string;
  location: {
    type: string,
    index: number
  };
  isFacingUp: boolean;
}

const BLACK_CARDS = ['spades', 'clubs'];
const RED_CARDS = ['diamonds', 'hearts'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  cards: PlayingCard[];
  cardDrop$ = new Subject<any>;
  cardReset$ = new Subject<string>;
  stockClicked$ = new Subject<boolean>;
  cardPileElements: NodeList;

  @ViewChild('tableau') tableauSection: ElementRef;

  constructor (@Inject(DOCUMENT) private document: Document) {}

  ngOnInit(){
    this.startGame();
    this.watchForCardDrop();
    this.watchForDeckClick();
  }

  ngAfterViewInit(): void {
    this.cardPileElements = document.querySelectorAll('app-card-pile');
  }

  watchForDeckClick(){
    this.stockClicked$.subscribe(() => {
      const cardToMove = this.getTopCardForType('stock');
      if(!cardToMove){
        this.resetStock();
      }else{
        this.moveCardFromStockToWaste(cardToMove);
      }
    })
  }

  resetStock(){
    const updatedCards = this.cards
      .filter((card) => card.location.type === 'waste')
      .map((card) => ({...card, location: {type: 'stock', index: 1}, isFacingUp: false})
    ).reverse();
    const cardsWithoutWasteType = this.cards.filter(card => card.location.type !== 'waste');

    this.cards = cardsWithoutWasteType.concat(updatedCards);
  }

  moveCardFromStockToWaste(cardToMove: PlayingCard){
    cardToMove.isFacingUp = true;
    const newLocation: PlayingCard["location"] = {type: 'waste', index: 1};
    this.updateCardLocation(cardToMove, newLocation);
  }

  watchForCardDrop(){
    this.cardDrop$.subscribe((event: { card: PlayingCard, clientX: number, clientY: number }) => {
      const locationCardWasDroppedOn = this.getLocationCardWasDroppedOn(event.card, {clientX: event.clientX, clientY: event.clientY});
      if(!locationCardWasDroppedOn) return this.cardReset$.next('translate(0px, 0px)');

      const currentTopCardOnRow = this.getTopCardForType(locationCardWasDroppedOn.type, locationCardWasDroppedOn.index);

      if(AppComponent.cardIsAllowedToBeMovedToNewLocation(locationCardWasDroppedOn, event.card, currentTopCardOnRow)){
        this.updateCardLocation(event.card, {type: locationCardWasDroppedOn.type, index: locationCardWasDroppedOn.index});
        this.setLastCardInEachRowToFaceUp();
      }else {
        this.cardReset$.next('translate(0px, 0px)');
      }
    })
  }

  public static cardIsAllowedToBeMovedToNewLocation(newLocation: PlayingCard["location"], card: PlayingCard, topCardOfNewLocation: PlayingCard | null): boolean {
    // tableau
    if(newLocation.type === 'tableau'){
      if(!topCardOfNewLocation){
        if(card.value === 'K') return true
        return false;
      }

      if(AppComponent.cardsAreSameSuitColor(card.suit, topCardOfNewLocation.suit)) return false;
      return AppComponent.cardIsOneValueLowerThanCard(card.value, topCardOfNewLocation.value);
    }

    // foundation
    if(newLocation.type === 'foundation'){
      if(!topCardOfNewLocation){
        if(card.value === 'A') return true;
        return false;
      }

      if(card.suit !== topCardOfNewLocation.suit) return false;
      return AppComponent.cardIsOneValueLowerThanCard(card.value, topCardOfNewLocation.value);
    }

    return false;
  }

  public static cardsAreSameSuitColor(card1Suit: string, card2Suit: string): boolean {
    if(RED_CARDS.includes(card1Suit) && RED_CARDS.includes(card2Suit)){
      return true;
    }
    if(BLACK_CARDS.includes(card1Suit) && BLACK_CARDS.includes(card2Suit)){
      return true;
    }
    return false;
  }

  public static cardIsOneValueLowerThanCard(card1Value: string, card2Value: string): boolean {
    const valueCard1MustBe =  deckOfCards[deckOfCards.findIndex((card) => card.value === card2Value) - 1].value;
    return card1Value === valueCard1MustBe;
  }

  public static cardIsAllowedToBeDropped(newTopCard: PlayingCard, currentTopCard: PlayingCard | null){
    if(!currentTopCard){
      if(newTopCard.value === 'K') return true
      return false;
    }

    if(RED_CARDS.includes(newTopCard.suit) && RED_CARDS.includes(currentTopCard.suit)){
      return false;
    }
    if(BLACK_CARDS.includes(newTopCard.suit) && BLACK_CARDS.includes(currentTopCard.suit)){
      return false;
    }
    const valueCurrentTopCardMustHaveToBeAllowed = deckOfCards[deckOfCards.findIndex((card) => card.value === newTopCard.value) + 1].value;
    if(currentTopCard.value !== valueCurrentTopCardMustHaveToBeAllowed){
      return false;
    }
    return true;
  }

  getTopCardForType(type: string, index?: number): PlayingCard | null {
    const cardsInReverseOrder = [...this.cards].reverse();
    const indexOfTopCardReversed = cardsInReverseOrder.findIndex((card) => {
      if(card.location.type !== type) return false;
      if(index && card.location.index !== index) return false;
      return true;
    });
    if(indexOfTopCardReversed === -1) return null;

    const indexOfTopCard = (this.cards.length -1) - indexOfTopCardReversed;
    return this.cards[indexOfTopCard];
  }

  updateCardLocation(movedCard: PlayingCard, newLocation: PlayingCard["location"]): void {
    const indexOfCardToUpdate = this.cards.findIndex((card) => card === movedCard);
    const cardToUpdate = this.cards[indexOfCardToUpdate];
    cardToUpdate.location = newLocation;
    this.cards.splice(indexOfCardToUpdate, 1);
    this.cards.push(cardToUpdate);
  }

  getLocationCardWasDroppedOn(movedCard: PlayingCard, cardDropPosition: {clientX: number, clientY: number}): PlayingCard["location"] | undefined {
    const listOfCardsWithPositions: { location: PlayingCard["location"], rect: { top: number, bottom: number, left: number, right: number }}[] = this.getBoundingClientRectForEachCard();
    const previousLocationOfCard = movedCard.location;
    let locationCardWasDroppedOn;

    listOfCardsWithPositions.forEach((cardToCheck) => {
      if(movedCard.location.type === 'tableau'){
        if(cardToCheck.location.index == previousLocationOfCard.index) return;
      }

      const cardInSectionHorizontally = cardDropPosition.clientX > cardToCheck.rect.left && cardDropPosition.clientX < cardToCheck.rect.right;
      const cardInSectionVertically = cardDropPosition.clientY > cardToCheck.rect.top && cardDropPosition.clientY < cardToCheck.rect.bottom;
      if(cardInSectionHorizontally && cardInSectionVertically){
        locationCardWasDroppedOn = cardToCheck.location;
      }
    })
    return locationCardWasDroppedOn;
  }

  getBoundingClientRectForEachCard(){
    const cardPileElements: { location: PlayingCard["location"], rect: { top: number, bottom: number, left: number, right: number }}[] = [];
    const cardPileLocations = [
      {
        type: 'deck',
        index: 1
      },
      {
        type: 'waste',
        index: 1
      },
      {
        type: 'foundation',
        index: 1
      },
      {
        type: 'foundation',
        index: 2
      },
      {
        type: 'foundation',
        index: 3
      },
      {
        type: 'foundation',
        index: 4
      },
      {
        type: 'tableau',
        index: 1
      },
      {
        type: 'tableau',
        index: 2
      },
      {
        type: 'tableau',
        index: 3
      },
      {
        type: 'tableau',
        index: 4
      },
      {
        type: 'tableau',
        index: 5
      },
      {
        type: 'tableau',
        index: 6
      },
      {
        type: 'tableau',
        index: 7
      },
    ]
    this.cardPileElements.forEach((cardPile, index) => {
      const childElementDimensions: DOMRect[] = [];
      cardPile.childNodes[0].childNodes.forEach((card: any) => {
        if(card.nodeName === 'APP-CARD'){
          childElementDimensions.push(card.childNodes[0].getBoundingClientRect());
        }
        if(card.nodeName === 'DIV'){
          childElementDimensions.push(card.getBoundingClientRect());
        }
      })
      cardPileElements.push({
        location: cardPileLocations[index],
        rect: {
          top: Math.min(...childElementDimensions.map(element => element.top)),
          bottom: Math.max(...childElementDimensions.map(element => element.bottom)),
          left: childElementDimensions[0].left,
          right: childElementDimensions[0].right
        }
      })
    })
    return cardPileElements;
  }

  // getBoundingClientRectForEachCard(){
  //   const rects: { row: number, rect: DOMRect}[] = [];
  //   this.tableauSection.nativeElement.childNodes.forEach((row: any, rowIndex: number) => {
  //     row.childNodes[0].childNodes.forEach((card: any) => {
  //       if(card.nodeName === 'APP-CARD'){
  //         rects.push({ row: rowIndex + 1, rect: card.childNodes[0].getBoundingClientRect() });
  //       }
  //       if(card.nodeName === 'DIV'){
  //         rects.push({ row: rowIndex + 1, rect: card.getBoundingClientRect() });
  //       }
  //     });
  //   })
  //   return rects;
  // }

  startGame(){
    this.cards = this.setUpCards();
    this.setLastCardInEachRowToFaceUp();
  }

  setUpCards(): PlayingCard[] {
    const shuffledCards = this.shuffleCards(deckOfCards);
    return this.setStartingPositions(shuffledCards);
  }

  setLastCardInEachRowToFaceUp(){
    const reversedCards = [...this.cards].reverse();

    const numberOfRows = 7;
    let count = 1;
    const indexesOfCardsToFaceUp = [];

    while(count <=  numberOfRows){
      indexesOfCardsToFaceUp.push(reversedCards.findIndex((card) => {
        if(card.location.type !== 'tableau') return false;
        if(card.location.index !== count) return false;
        return true;
      }));
      count++;
    }

    indexesOfCardsToFaceUp.forEach((index) => {
      if(index === -1) return
      reversedCards[index].isFacingUp = true;
    })
    this.cards = reversedCards.reverse();
  }

  shuffleCards(unshuffledCards: { suit: string, value: string }[]): { suit: string, value: string }[] {
    // shout out to fisher yates for providing this shuffling algorithm
    const clone = [...unshuffledCards];
    let currentIndex = clone.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [clone[currentIndex], clone[randomIndex]] = [clone[randomIndex], clone[currentIndex]];
    }
    return clone;
  }

  setStartingPositions(cards: { suit: string, value: string }[]){
    const cardsWithStartingPositions: PlayingCard[] = [];

    let cardIndex = 0;
    for(let rowIndex = 1; rowIndex <= 7; rowIndex++){
      let maxCardsInRow = rowIndex;
      for(let indexOfCardInRow = 1; indexOfCardInRow <= maxCardsInRow; indexOfCardInRow++){
        cardsWithStartingPositions.push({...cards[cardIndex], location: {type: 'tableau', index: rowIndex}, isFacingUp: false});
        cardIndex++;
      }
    }
    for(cardIndex; cardIndex <= 51; cardIndex++){
      cardsWithStartingPositions.push({...cards[cardIndex], location: {type: 'stock', index: 1}, isFacingUp: false});
    }
    return cardsWithStartingPositions;
  }

  filterCardsByLocation(location: PlayingCard["location"]){
    if(!this.cards) return [];
    return this.cards.filter((card) => card.location.type === location.type && card.location.index === location.index);
  }
}
