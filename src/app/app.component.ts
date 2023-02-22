import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { Settings } from './components/header-bar/header-bar.component';
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
  intervalSubsription: Subscription;
  cardPileElements: Element[];
  totalMoves = 0;
  elapsedTimeInSeconds = 0;
  gameStarted = false;
  settings$ = new Subject<Settings>();
  nightMode = false;
  showGameWonModal = false;

  @ViewChild('tableau') tableauSection: ElementRef;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.startGame();
    this.watchForCardDrop();
    this.watchForDeckClick();
    this.watchForCardMove();
    this.settings$.subscribe((settings) => {
      this.nightMode = settings.nightMode;
    });
  }

  ngAfterViewInit(): void {
    this.cardPileElements = Array.from(
      document.querySelectorAll('app-card-pile')
    );
  }

  watchForCardDrop() {
    this.cardDrop$.subscribe(
      (event: { card: PlayingCard; clientX: number; clientY: number }) => {
        if (!this.gameStarted) this.startTimer();
        const locationCardWasDroppedOn = this.getLocationCardWasDroppedOn(
          event.card,
          { clientX: event.clientX, clientY: event.clientY }
        );
        if (!locationCardWasDroppedOn)
          return this.cardReset$.next('translate(0px, 0px)');
        if (
          JSON.stringify(locationCardWasDroppedOn) ===
          JSON.stringify(event.card.location)
        )
          return this.cardReset$.next('translate(0px, 0px)');

        const currentTopCardOnRow = this.getTopCardForType(
          locationCardWasDroppedOn
        );

        if (
          AppComponent.cardIsAllowedToBeMovedToNewLocation(
            locationCardWasDroppedOn,
            event.card,
            currentTopCardOnRow
          )
        ) {
          const additionalCardsToUpdate =
            this.getCardsSittingOnTopOfCurrentCard(event.card);
          const allCardsToUpdate = [event.card].concat(additionalCardsToUpdate);
          allCardsToUpdate.forEach((card) => {
            this.updateCardLocation(card, {
              type: locationCardWasDroppedOn.type,
              index: locationCardWasDroppedOn.index,
            });
          });
          this.totalMoves += 1;
          this.setLastCardInEachRowToFaceUp();
          if (
            locationCardWasDroppedOn.type === 'foundation' &&
            this.isGameFinished()
          ) {
            this.openGameWonModal();
          }
        } else {
          this.cardReset$.next('translate(0px, 0px)');
        }
      }
    );
  }

  watchForDeckClick() {
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

  watchForCardMove(): void {
    this.cardIsBeingMoved$.subscribe(({ card, translation }) => {
      const cardsOnTopOfCurrentCard =
        this.getCardsSittingOnTopOfCurrentCard(card);
      if (cardsOnTopOfCurrentCard.length) {
        this.additionalCardsToMove$.next({
          additionalCardsToMove: cardsOnTopOfCurrentCard,
          translation,
        });
      }
    });
  }

  getCardsSittingOnTopOfCurrentCard(currentCard: PlayingCard): PlayingCard[] {
    const cardsInSameLocation = [...this.cards].filter(
      (card) =>
        JSON.stringify(card.location) === JSON.stringify(currentCard.location)
    );
    const indexOfCurrentCard = cardsInSameLocation.findIndex(
      (card) => JSON.stringify(card) === JSON.stringify(currentCard)
    );
    return cardsInSameLocation.slice(indexOfCurrentCard + 1);
  }

  resetStock() {
    const updatedCards = this.cards
      .filter((card) => card.location.type === 'waste')
      .map((card) => ({
        ...card,
        location: { type: 'stock', index: 1 },
        isFacingUp: false,
      }))
      .reverse();
    const cardsWithoutWasteType = this.cards.filter(
      (card) => card.location.type !== 'waste'
    );

    this.cards = cardsWithoutWasteType.concat(updatedCards);
  }

  moveCardFromStockToWaste(cardToMove: PlayingCard) {
    cardToMove.isFacingUp = true;
    const newLocation: PlayingCard['location'] = { type: 'waste', index: 1 };
    this.updateCardLocation(cardToMove, newLocation);
  }

  static cardIsAllowedToBeMovedToNewLocation(
    newLocation: PlayingCard['location'],
    card: PlayingCard,
    topCardOfNewLocation: PlayingCard | null
  ): boolean {
    if (newLocation.type === 'tableau') {
      if (!topCardOfNewLocation) {
        if (card.value === 'K') return true;
        return false;
      }

      if (
        AppComponent.cardsAreSameSuitColor(card.suit, topCardOfNewLocation.suit)
      )
        return false;
      return AppComponent.cardValueIsOneLowerThanNext(
        card.value,
        topCardOfNewLocation.value
      );
    }

    if (newLocation.type === 'foundation') {
      if (!topCardOfNewLocation) {
        if (card.value === 'A') return true;
        return false;
      }

      if (card.suit !== topCardOfNewLocation.suit) return false;
      return AppComponent.cardValueIsOneGreaterThanNext(
        card.value,
        topCardOfNewLocation.value
      );
    }

    return false;
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
    const allPossbleCardValuesInOrder = deckOfCards.filter(
      (card) => card.suit === 'hearts'
    );
    const indexOfValue1InDeck = allPossbleCardValuesInOrder.findIndex(
      (card) => card.value === value1
    );
    const indexOfCardOneValueGreaterThanCard1 = indexOfValue1InDeck + 1;

    if (allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]) {
      return (
        allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]
          .value === value2
      );
    }
    return false;
  }

  static cardValueIsOneGreaterThanNext(
    value1: string,
    value2: string
  ): boolean {
    const allPossbleCardValuesInOrder = deckOfCards.filter(
      (card) => card.suit === 'hearts'
    );
    const indexOfValue1InDeck = allPossbleCardValuesInOrder.findIndex(
      (card) => card.value === value1
    );
    const indexOfCardOneValueGreaterThanCard1 = indexOfValue1InDeck - 1;

    if (allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]) {
      return (
        allPossbleCardValuesInOrder[indexOfCardOneValueGreaterThanCard1]
          .value === value2
      );
    }
    return false;
  }

  getTopCardForType(location: PlayingCard['location']): PlayingCard | null {
    const cardsInReverseOrder = [...this.cards].reverse();
    const indexOfTopCardReversed = cardsInReverseOrder.findIndex((card) => {
      return JSON.stringify(card.location) === JSON.stringify(location);
    });
    if (indexOfTopCardReversed === -1) return null;

    const indexOfTopCard = this.cards.length - 1 - indexOfTopCardReversed;
    return this.cards[indexOfTopCard];
  }

  updateCardLocation(
    movedCard: PlayingCard,
    newLocation: PlayingCard['location']
  ): void {
    const indexOfCardToUpdate = this.cards.findIndex(
      (card) => card === movedCard
    );
    const cardToUpdate = this.cards[indexOfCardToUpdate];
    cardToUpdate.location = newLocation;
    this.cards.splice(indexOfCardToUpdate, 1);
    this.cards.push(cardToUpdate);
  }

  getLocationCardWasDroppedOn(
    card: PlayingCard,
    positionOfCardOnMouseUp: { clientX: number; clientY: number }
  ): PlayingCard['location'] | undefined {
    const positionOfEachCardPile: {
      location: PlayingCard['location'];
      rect: { top: number; bottom: number; left: number; right: number };
    }[] = this.getBoundingClientRectForEachCardPileExpect(card.location);
    let locationCardWasDroppedOn;

    positionOfEachCardPile.forEach((cardToCheck) => {
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
    return locationCardWasDroppedOn;
  }

  getBoundingClientRectForEachCardPileExpect(
    cardPileToExclude: PlayingCard['location']
  ) {
    const boundingClientRectForEachPile: {
      location: PlayingCard['location'];
      rect: { top: number; bottom: number; left: number; right: number };
    }[] = [];
    const allPossibleCardPileLocations = [...cardPileTypes];
    const relevantCardPileDOMElements = [...this.cardPileElements];
    const indexOfCardPileToIgnore = allPossibleCardPileLocations.findIndex(
      (cardPile) =>
        JSON.stringify(cardPile) === JSON.stringify(cardPileToExclude)
    );

    allPossibleCardPileLocations.splice(indexOfCardPileToIgnore, 1);
    relevantCardPileDOMElements.splice(indexOfCardPileToIgnore, 1);

    relevantCardPileDOMElements.forEach((cardPile, index) => {
      const positionsOfEachCardInGivenPile: DOMRect[] = [];
      cardPile.childNodes[0].childNodes.forEach((card: any) => {
        if (card.nodeName === 'APP-CARD') {
          positionsOfEachCardInGivenPile.push(
            card.childNodes[0].getBoundingClientRect()
          );
        }
        if (card.nodeName === 'DIV') {
          positionsOfEachCardInGivenPile.push(card.getBoundingClientRect());
        }
      });
      boundingClientRectForEachPile.push({
        location: allPossibleCardPileLocations[index],
        rect: {
          top: Math.min(
            ...positionsOfEachCardInGivenPile.map((element) => element.top)
          ),
          bottom: Math.max(
            ...positionsOfEachCardInGivenPile.map((element) => element.bottom)
          ),
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
    this.setLastCardInEachRowToFaceUp();
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

  openGameWonModal() {
    this.showGameWonModal = true;
  }

  isGameFinished(): boolean {
    return !this.cards.find((card) => card.location.type !== 'foundation');
  }

  setUpCards(): PlayingCard[] {
    const shuffledCards = this.shuffleCards(deckOfCards);
    return this.setStartingPositions(shuffledCards);
  }

  setLastCardInEachRowToFaceUp() {
    const reversedCards = [...this.cards].reverse();

    const numberOfRows = 7;
    let count = 1;
    const indexesOfCardsToFaceUp = [];

    while (count <= numberOfRows) {
      indexesOfCardsToFaceUp.push(
        reversedCards.findIndex((card) => {
          if (card.location.type !== 'tableau') return false;
          if (card.location.index !== count) return false;
          return true;
        })
      );
      count++;
    }

    indexesOfCardsToFaceUp.forEach((index) => {
      if (index === -1) return;
      reversedCards[index].isFacingUp = true;
    });
    this.cards = reversedCards.reverse();
  }

  shuffleCards(
    unshuffledCards: { suit: string; value: string }[]
  ): { suit: string; value: string }[] {
    // shout out to fisher yates for providing this shuffling algorithm
    const clone = [...unshuffledCards];
    let currentIndex = clone.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [clone[currentIndex], clone[randomIndex]] = [
        clone[randomIndex],
        clone[currentIndex],
      ];
    }
    return clone;
  }

  setStartingPositions(cards: { suit: string; value: string }[]) {
    const cardsWithStartingPositions: PlayingCard[] = [];

    let cardIndex = 0;
    for (let rowIndex = 1; rowIndex <= 7; rowIndex++) {
      let maxCardsInRow = rowIndex;
      for (
        let indexOfCardInRow = 1;
        indexOfCardInRow <= maxCardsInRow;
        indexOfCardInRow++
      ) {
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
    return this.cards.filter(
      (card) =>
        card.location.type === location.type &&
        card.location.index === location.index
    );
  }
}
