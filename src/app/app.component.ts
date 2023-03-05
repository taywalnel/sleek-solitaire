import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, debounceTime, fromEvent, interval, Observable, Subject, Subscription } from 'rxjs';
import { Settings } from './components/settings-menu/settings-menu.component';
import { cardPileTypes } from './constants/card-pile-types';
import { deckOfCards } from './constants/deck-of-cards';

export interface PlayingCard {
  suit: string;
  value: string;
  location: {
    type: string;
    index: number;
  };
  isFacingUp: boolean;
}

export interface CardMovingEvent {
  card: PlayingCard;
  translation: string;
}

export interface AdditionalCardsToMoveEvent {
  additionalCardsToMove: PlayingCard[];
  translation: string;
}

export interface CardDropEvent {
  card: PlayingCard;
  clientX: number;
  clientY: number;
}

const BLACK_CARDS = ['spades', 'clubs'];
const RED_CARDS = ['diamonds', 'hearts'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  cards: PlayingCard[];
  cardDrop$ = new Subject<any>();
  cardReset$ = new Subject<string>();
  cardIsBeingMoved$ = new Subject<CardMovingEvent>();
  additionalCardsToMove$ = new Subject<AdditionalCardsToMoveEvent>();
  stockClicked$ = new Subject<boolean>();
  widthOfGameBoard$ = new Subject<string>();
  intervalSubsription: Subscription;
  cardPileElements: Element[];
  totalMoves = 0;
  elapsedTimeInSeconds = 0;
  gameStarted = false;
  settings$ = new BehaviorSubject<Settings>(new Settings());
  showGameWonModal = false;
  widthOfGameBoard: Observable<string>;

  @ViewChild('tableau') tableauSection: ElementRef;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  get gameIsComplete() {
    return !this.cards.find(card => card.location.type !== 'foundation');
  }

  ngOnInit() {
    this.startGame();
    this.listenForCardDrop();
    this.listenForDeckClick();
    this.listenForCardMove();
    this.listenForWindowResize();
  }

  ngAfterViewInit(): void {
    this.cardPileElements = Array.from(document.querySelectorAll('app-card-pile'));
    this.updateWidthOfGameBoard();
  }

  listenForCardDrop() {
    this.cardDrop$.subscribe((event: CardDropEvent) => {
      if (!this.gameStarted) this.startTimer();
      const originalLocationOfCard = event.card.location;
      const newLocationOfCard = this.getLocationCardWasDroppedOn(event);

      if (!newLocationOfCard) return this.moveCardBackToStartingPosition();
      if (!this.moveIsAllowed(event.card, newLocationOfCard)) return this.moveCardBackToStartingPosition();

      this.moveCardToNewPosition(event.card, newLocationOfCard);
      this.setLastCardInLocationToFaceUp(originalLocationOfCard);
      this.totalMoves += 1;

      if (this.gameIsComplete) return this.onGameWin();
    });
  }

  moveCardToNewPosition(card: PlayingCard, newLocationOfCard: PlayingCard['location']) {
    const additionalCardsThatMoved = this.getCardsSittingOnTopOfCurrentCard(card);
    const allCardsToUpdate = [card].concat(additionalCardsThatMoved);
    this.updateLocationOfCards(allCardsToUpdate, newLocationOfCard);
  }

  moveIsAllowed(cardMoved: PlayingCard, locationOfCardDrop: PlayingCard['location']) {
    if (JSON.stringify(cardMoved.location) === JSON.stringify(locationOfCardDrop)) return false;

    const topCardOnNewLocation = this.getTopCardForType(locationOfCardDrop);

    if (locationOfCardDrop.type === 'tableau')
      return this.cardIsAllowedToBeMovedToTableau(cardMoved, topCardOnNewLocation);
    if (locationOfCardDrop.type === 'foundation')
      return this.cardIsAllowedToBeMovedToFoundation(cardMoved, topCardOnNewLocation);

    return false;
  }

  cardIsAllowedToBeMovedToTableau(cardMoved: PlayingCard, topCardOfNewLocation: PlayingCard | null) {
    if (!topCardOfNewLocation) {
      if (cardMoved.value === 'K') return true;
      return false;
    }
    if (AppComponent.cardsAreSameSuitColor(cardMoved.suit, topCardOfNewLocation.suit)) return false;
    return AppComponent.cardValueIsOneLowerThanNext(cardMoved.value, topCardOfNewLocation.value);
  }

  cardIsAllowedToBeMovedToFoundation(cardMoved: PlayingCard, topCardOfNewLocation: PlayingCard | null) {
    if (!topCardOfNewLocation) {
      if (cardMoved.value === 'A') return true;
      return false;
    }

    if (cardMoved.suit !== topCardOfNewLocation.suit) return false;
    return AppComponent.cardValueIsOneGreaterThanNext(cardMoved.value, topCardOfNewLocation.value);
  }

  moveCardBackToStartingPosition() {
    this.cardReset$.next('translate(0px, 0px)');
  }

  listenForDeckClick() {
    this.stockClicked$.subscribe(() => {
      if (!this.gameStarted) this.startTimer();
      const cardToMove = this.getTopCardForType({ type: 'stock', index: 1 });
      this.totalMoves += 1;
      if (!cardToMove) {
        this.resetStock();
      } else {
        this.moveCardFromStockToWaste(cardToMove);
      }
    });
  }

  listenForCardMove(): void {
    this.cardIsBeingMoved$.subscribe(({ card, translation }) => {
      this.animateAdditionalCardsIfRequired(card, translation);
    });
  }

  listenForWindowResize() {
    const resize = fromEvent(window, 'resize') as Observable<UIEvent>;
    resize.pipe(debounceTime(250)).subscribe(() => {
      this.updateWidthOfGameBoard();
    });
  }

  updateWidthOfGameBoard() {
    const screenWidth = window.innerWidth < window.outerWidth ? window.innerWidth : window.outerWidth;
    const screenHeight = window.innerHeight < window.outerHeight ? window.innerHeight : window.outerHeight;
    const smallestAxis = screenWidth < screenHeight ? screenWidth : screenHeight;
    if (smallestAxis > 800) {
      return this.widthOfGameBoard$.next('760px');
    } else {
      return this.widthOfGameBoard$.next(`${smallestAxis - 40}px`);
    }
  }

  animateAdditionalCardsIfRequired(card: PlayingCard, translation: string) {
    const cardsOnTopOfCurrentCard = this.getCardsSittingOnTopOfCurrentCard(card);
    if (cardsOnTopOfCurrentCard.length) {
      this.additionalCardsToMove$.next({
        additionalCardsToMove: cardsOnTopOfCurrentCard,
        translation,
      });
    }
  }

  getCardsSittingOnTopOfCurrentCard(currentCard: PlayingCard): PlayingCard[] {
    const cardsInSameLocation = [...this.cards].filter(
      card => JSON.stringify(card.location) === JSON.stringify(currentCard.location)
    );
    const indexOfCurrentCard = cardsInSameLocation.findIndex(
      card => JSON.stringify(card) === JSON.stringify(currentCard)
    );
    return cardsInSameLocation.slice(indexOfCurrentCard + 1);
  }

  resetStock() {
    const updatedCards = this.cards
      .filter(card => card.location.type === 'waste')
      .map(card => ({
        ...card,
        location: { type: 'stock', index: 1 },
        isFacingUp: false,
      }))
      .reverse();
    const cardsWithoutWasteType = this.cards.filter(card => card.location.type !== 'waste');

    this.cards = cardsWithoutWasteType.concat(updatedCards);
  }

  moveCardFromStockToWaste(cardToMove: PlayingCard) {
    cardToMove.isFacingUp = true;
    const newLocation: PlayingCard['location'] = { type: 'waste', index: 1 };
    this.updateLocationOfCard(cardToMove, newLocation);
  }

  static cardsAreSameSuitColor(card1Suit: string, card2Suit: string): boolean {
    if (RED_CARDS.includes(card1Suit) && RED_CARDS.includes(card2Suit)) {
      return true;
    }
    if (BLACK_CARDS.includes(card1Suit) && BLACK_CARDS.includes(card2Suit)) {
      return true;
    }
    return false;
  }

  static cardValueIsOneLowerThanNext(value1: string, value2: string): boolean {
    const allPossbleCardValuesInOrder = deckOfCards.filter(card => card.suit === 'hearts');
    const indexOfValue1InDeck = allPossbleCardValuesInOrder.findIndex(card => card.value === value1);
    const indexOfCardOneValueGreaterThanCard1 = indexOfValue1InDeck + 1;

    if (allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]) {
      return allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1].value === value2;
    }
    return false;
  }

  static cardValueIsOneGreaterThanNext(value1: string, value2: string): boolean {
    const allPossbleCardValuesInOrder = deckOfCards.filter(card => card.suit === 'hearts');
    const indexOfValue1InDeck = allPossbleCardValuesInOrder.findIndex(card => card.value === value1);
    const indexOfCardOneValueGreaterThanCard1 = indexOfValue1InDeck - 1;

    if (allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]) {
      return allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1].value === value2;
    }
    return false;
  }

  getTopCardForType(location: PlayingCard['location']): PlayingCard | null {
    const cardsInReverseOrder = [...this.cards].reverse();
    const indexOfTopCardReversed = cardsInReverseOrder.findIndex(card => {
      return JSON.stringify(card.location) === JSON.stringify(location);
    });
    if (indexOfTopCardReversed === -1) return null;

    const indexOfTopCard = this.cards.length - 1 - indexOfTopCardReversed;
    return this.cards[indexOfTopCard];
  }

  updateLocationOfCards(cardsToUpdate: PlayingCard[], newLocation: PlayingCard['location']) {
    cardsToUpdate.forEach(cardToUpdate => this.updateLocationOfCard(cardToUpdate, newLocation));
  }

  updateLocationOfCard(movedCard: PlayingCard, newLocation: PlayingCard['location']): void {
    const indexOfCardToUpdate = this.cards.findIndex(card => card === movedCard);
    const cardToUpdate = this.cards[indexOfCardToUpdate];
    cardToUpdate.location = newLocation;
    this.cards.splice(indexOfCardToUpdate, 1);
    this.cards.push(cardToUpdate);
  }

  getLocationCardWasDroppedOn(positionOfCardOnMouseUp: CardDropEvent): PlayingCard['location'] | false {
    const positionOfEachCardPile: {
      location: PlayingCard['location'];
      rect: { top: number; bottom: number; left: number; right: number };
    }[] = this.getBoundingClientRectForEachCardPile();
    let locationCardWasDroppedOn;

    positionOfEachCardPile.forEach(cardToCheck => {
      const cardInSectionHorizontally =
        positionOfCardOnMouseUp.clientX > cardToCheck.rect.left &&
        positionOfCardOnMouseUp.clientX < cardToCheck.rect.right;
      const cardInSectionVertically =
        positionOfCardOnMouseUp.clientY > cardToCheck.rect.top &&
        positionOfCardOnMouseUp.clientY < cardToCheck.rect.bottom;
      if (cardInSectionHorizontally && cardInSectionVertically) {
        locationCardWasDroppedOn = cardToCheck.location;
      }
    });
    return locationCardWasDroppedOn ? locationCardWasDroppedOn : false;
  }

  getBoundingClientRectForEachCardPile() {
    const boundingClientRectForEachPile: {
      location: PlayingCard['location'];
      rect: { top: number; bottom: number; left: number; right: number };
    }[] = [];
    const allPossibleCardPileLocations = [...cardPileTypes];
    const relevantCardPileDOMElements = [...this.cardPileElements];

    relevantCardPileDOMElements.forEach((cardPile, index) => {
      const positionsOfEachCardInGivenPile: DOMRect[] = [];
      cardPile.childNodes[0].childNodes.forEach((card: any) => {
        if (card.nodeName === 'APP-CARD') {
          positionsOfEachCardInGivenPile.push(card.childNodes[0].getBoundingClientRect());
        }
        if (card.nodeName === 'DIV') {
          positionsOfEachCardInGivenPile.push(card.getBoundingClientRect());
        }
      });
      boundingClientRectForEachPile.push({
        location: allPossibleCardPileLocations[index],
        rect: {
          top: Math.min(...positionsOfEachCardInGivenPile.map(element => element.top)),
          bottom: Math.max(...positionsOfEachCardInGivenPile.map(element => element.bottom)),
          left: positionsOfEachCardInGivenPile[0].left,
          right: positionsOfEachCardInGivenPile[0].right,
        },
      });
    });
    return boundingClientRectForEachPile;
  }

  startGame() {
    this.totalMoves = 0;
    this.cards = this.setUpCards();
    this.setLastCardInEachTableauRowToFaceUp();
  }

  onGameWin() {
    this.stopTimer();
    this.showGameWonModal = true;
  }

  resetGame() {
    this.gameStarted = false;
    if (this.intervalSubsription) {
      this.stopTimer();
    }
    this.elapsedTimeInSeconds = 0;
    this.startGame();
  }

  startTimer() {
    this.gameStarted = true;
    this.elapsedTimeInSeconds = 0;
    this.intervalSubsription = interval(1000).subscribe(() => {
      this.elapsedTimeInSeconds++;
    });
  }

  stopTimer() {
    this.intervalSubsription.unsubscribe();
  }

  gameWonModalEventHandler(command: string) {
    this.showGameWonModal = false;
    if (command === 'startNewGame') {
      this.resetGame();
    }
  }

  isGameFinished(): boolean {
    return !this.cards.find(card => card.location.type !== 'foundation');
  }

  setUpCards(): PlayingCard[] {
    const shuffledCards = this.shuffleCards(deckOfCards);
    return this.setStartingPositions(shuffledCards);
  }

  setLastCardInEachTableauRowToFaceUp() {
    const numberOfRows = 7;
    let count = 1;

    while (count <= numberOfRows) {
      const location = {
        index: count,
        type: 'tableau',
      };
      this.setLastCardInLocationToFaceUp(location);
      count++;
    }
  }

  setLastCardInLocationToFaceUp(location: PlayingCard['location']) {
    const reversedCards = [...this.cards].reverse();
    const indexesOfCardsToFaceUp = [];

    indexesOfCardsToFaceUp.push(
      reversedCards.findIndex(card => {
        if (card.location.type !== 'tableau') return false;
        if (card.location.index !== location.index) return false;
        return true;
      })
    );

    indexesOfCardsToFaceUp.forEach(index => {
      if (index === -1) return;
      reversedCards[index].isFacingUp = true;
    });
    this.cards = reversedCards.reverse();
  }

  shuffleCards(unshuffledCards: { suit: string; value: string }[]): { suit: string; value: string }[] {
    // shout out to fisher yates for providing this shuffling algorithm
    const clone = [...unshuffledCards];
    let currentIndex = clone.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [clone[currentIndex], clone[randomIndex]] = [clone[randomIndex], clone[currentIndex]];
    }
    return clone;
  }

  setStartingPositions(cards: { suit: string; value: string }[]) {
    const cardsWithStartingPositions: PlayingCard[] = [];

    let cardIndex = 0;
    for (let rowIndex = 1; rowIndex <= 7; rowIndex++) {
      let maxCardsInRow = rowIndex;
      for (let indexOfCardInRow = 1; indexOfCardInRow <= maxCardsInRow; indexOfCardInRow++) {
        cardsWithStartingPositions.push({
          ...cards[cardIndex],
          location: { type: 'tableau', index: rowIndex },
          isFacingUp: false,
        });
        cardIndex++;
      }
    }
    for (cardIndex; cardIndex <= 51; cardIndex++) {
      cardsWithStartingPositions.push({
        ...cards[cardIndex],
        location: { type: 'stock', index: 1 },
        isFacingUp: false,
      });
    }
    return cardsWithStartingPositions;
  }

  filterCardsByLocation(location: PlayingCard['location']) {
    if (!this.cards) return [];
    return this.cards.filter(card => card.location.type === location.type && card.location.index === location.index);
  }
}
