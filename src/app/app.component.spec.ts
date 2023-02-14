import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent, PlayingCard } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('getTopCardForType', () => {
    describe('when there are cards on a given row', () => {
      it('should return the top card on the given row', () => {
        component.startGame();

        const expectedCard: PlayingCard = {
          suit: 'clubs',
          value: '5',
          location: {
            type: 'tableau',
            index: 1,
          },
          isFacingUp: true,
        };
        component.cards.push(expectedCard);

        expect(component.getTopCardForType(expectedCard['location'])).toEqual(
          expectedCard
        );
      });
    });

    describe('when there are no cards on a given row', () => {
      it('should return null', () => {
        component.cards = [];

        expect(
          component.getTopCardForType({ type: 'tableau', index: 1 })
        ).toEqual(null);
      });
    });
  });

  describe('setLastCardInEachRowToFaceUp', () => {
    it('should set the isFacingUp state of the last card in each row to true', () => {
      component.cards = component.setUpCards();
      component.setLastCardInEachRowToFaceUp();
      const reversedCards = [...component.cards].reverse();
      const rows = [1, 2, 3, 4, 5, 6, 7];

      rows.forEach((row) => {
        const topCardOnRow = reversedCards.find(
          (card) =>
            card.location.type === 'tableau' && card.location.index === row
        );
        expect(topCardOnRow?.isFacingUp).toBeTrue;
      });
    });
  });

  describe('cardValueIsOneLowerThanNext', () => {
    describe('when card is one value LOWER than card', () => {
      it('should return true', () => {
        const card1Value = '9';
        const card2Value = '10';
        expect(
          AppComponent.cardValueIsOneLowerThanNext(card1Value, card2Value)
        ).toBeTrue();
      });
    });

    describe('when card is NOT one value LOWER than card', () => {
      it('should return true', () => {
        const card1Value = 'A';
        const card2Value = 'K';
        expect(
          AppComponent.cardValueIsOneLowerThanNext(card1Value, card2Value)
        ).toBeFalse();
      });
    });
  });

  describe('cardValueIsOneGreaterThanNext', () => {
    describe('when card is one value GREATER than card', () => {
      it('should return true', () => {
        const card1Value = '2';
        const card2Value = 'A';
        expect(
          AppComponent.cardValueIsOneGreaterThanNext(card1Value, card2Value)
        ).toBeTrue();
      });
    });

    describe('when card is NOT one value GREATER than card', () => {
      it('should return true', () => {
        const card1Value = 'K';
        const card2Value = 'A';
        expect(
          AppComponent.cardValueIsOneGreaterThanNext(card1Value, card2Value)
        ).toBeFalse();
      });
    });
  });

  describe('cardsAreSameSuitColor', () => {
    describe('when cards are same suit color', () => {
      it('should return true', () => {
        const card1Suit = 'hearts';
        const card2Suit = 'diamonds';
        expect(
          AppComponent.cardsAreSameSuitColor(card1Suit, card2Suit)
        ).toBeTrue();
      });
    });

    describe('when cards are same NOT suit color', () => {
      it('should return true', () => {
        const card1Suit = 'hearts';
        const card2Suit = 'clubs';
        expect(
          AppComponent.cardsAreSameSuitColor(card1Suit, card2Suit)
        ).toBeFalse();
      });
    });
  });

  describe('getCardsSittingOnTopOfCurrentCard', () => {
    beforeEach(() => {
      component.cards = [
        {
          suit: 'diamonds',
          value: 'J',
          isFacingUp: true,
          location: {
            type: 'tableau',
            index: 3,
          },
        },
        {
          suit: 'hearts',
          value: '5',
          isFacingUp: true,
          location: {
            type: 'tableau',
            index: 3,
          },
        },
      ];
    });

    describe('when there are cards on top of current card', () => {
      it('should return the cards', () => {
        expect(
          component.getCardsSittingOnTopOfCurrentCard(component.cards[0])
        ).toEqual([component.cards[1]]);
      });
    });

    describe('when there are NO cards on top of current card', () => {
      it('should return an empty array', () => {
        expect(
          component.getCardsSittingOnTopOfCurrentCard(component.cards[1])
        ).toEqual([]);
      });
    });
  });

  describe('resetStock', () => {
    const mockDeck = [
      {
        suit: 'diamonds',
        value: 'J',
        isFacingUp: true,
        location: {
          type: 'waste',
          index: 1,
        },
      },
      {
        suit: 'hearts',
        value: '5',
        isFacingUp: true,
        location: {
          type: 'waste',
          index: 1,
        },
      },
      {
        suit: 'diamonds',
        value: '5',
        isFacingUp: true,
        location: {
          type: 'tableau',
          index: 3,
        },
      },
    ];

    beforeEach(() => {
      component.cards = mockDeck;
    });

    it('should update all cards with type.location = waste to stock and reverse the order', () => {
      component.resetStock();
      const cardsInStockReversed = component.cards
        .filter((card) => card.location.type == 'stock')
        .reverse();
      const originalCardsFilteredByWaste = mockDeck.filter(
        (card) => card.location.type == 'waste'
      );
      expect(cardsInStockReversed.length).toEqual(
        originalCardsFilteredByWaste.length
      );
      expect(cardsInStockReversed[0].suit).toEqual(
        originalCardsFilteredByWaste[0].suit
      );
      expect(cardsInStockReversed[0].value).toEqual(
        originalCardsFilteredByWaste[0].value
      );
      expect(cardsInStockReversed[1].suit).toEqual(
        originalCardsFilteredByWaste[1].suit
      );
      expect(cardsInStockReversed[1].value).toEqual(
        originalCardsFilteredByWaste[1].value
      );
    });
  });

  describe('cardIsAllowedToBeMovedToNewLocation', () => {
    describe('when new location is foundation', () => {
      describe('when card is allowed to be moved to new location', () => {
        it('should return false', () => {
          const newlocation: PlayingCard['location'] = {
            type: 'foundation',
            index: 1,
          };
          const card: PlayingCard = {
            suit: 'diamonds',
            value: 'A',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 3,
            },
          };
          const topCardOfNewLocation = null;
          expect(
            AppComponent.cardIsAllowedToBeMovedToNewLocation(
              newlocation,
              card,
              topCardOfNewLocation
            )
          ).toBeTrue();
        });
      });
      describe('when card is not allowed to be moved to new location', () => {
        it('should return false', () => {
          const newlocation: PlayingCard['location'] = {
            type: 'foundation',
            index: 1,
          };
          const card: PlayingCard = {
            suit: 'diamonds',
            value: '5',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 3,
            },
          };
          const topCardOfNewLocation = null;
          expect(
            AppComponent.cardIsAllowedToBeMovedToNewLocation(
              newlocation,
              card,
              topCardOfNewLocation
            )
          ).toBeFalse();
        });
      });
    });

    describe('when new location is tableau', () => {
      describe('when card is allowed to be moved to new location', () => {
        it('should return false', () => {
          const newlocation: PlayingCard['location'] = {
            type: 'tableau',
            index: 1,
          };
          const card: PlayingCard = {
            suit: 'diamonds',
            value: 'Q',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 3,
            },
          };
          const topCardOfNewLocation: PlayingCard = {
            suit: 'spade',
            value: 'K',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 1,
            },
          };

          expect(
            AppComponent.cardIsAllowedToBeMovedToNewLocation(
              newlocation,
              card,
              topCardOfNewLocation
            )
          ).toBeTrue();
        });
      });
      describe('when card is not allowed to be moved to new location', () => {
        it('should return false', () => {
          const newlocation: PlayingCard['location'] = {
            type: 'tableau',
            index: 1,
          };
          const card: PlayingCard = {
            suit: 'diamonds',
            value: '5',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 3,
            },
          };
          const topCardOfNewLocation: PlayingCard = {
            suit: 'diamonds',
            value: 'K',
            isFacingUp: true,
            location: {
              type: 'tableau',
              index: 1,
            },
          };

          expect(
            AppComponent.cardIsAllowedToBeMovedToNewLocation(
              newlocation,
              card,
              topCardOfNewLocation
            )
          ).toBeFalse();
        });
      });
    });
  });
});
