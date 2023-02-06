import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent, PlayingCard } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  })

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('cardIsAllowedToBeDropped', () => {
    it('should return false when new top card is the same color as old top card', () => {
      const newTopCard: PlayingCard = {
        suit: 'clubs',
        value: 'Q',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      };
      const currentTopCard: PlayingCard = {
        suit: 'clubs',
        value: 'K',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      }

      expect(AppComponent.cardIsAllowedToBeDropped(newTopCard, currentTopCard)).toBeFalse();
    })

    it('should return false when the current top card is not an acceptable value', () => {
      const newTopCard: PlayingCard = {
        suit: 'diamonds',
        value: '5',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      };
      const currentTopCard: PlayingCard = {
        suit: 'clubs',
        value: '8',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      }

      expect(AppComponent.cardIsAllowedToBeDropped(newTopCard, currentTopCard)).toBeFalse();
    })

    it('should return true when the current top card is an acceptable value and suit', () => {
      const newTopCard: PlayingCard = {
        suit: 'diamonds',
        value: '7',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      };
      const currentTopCard: PlayingCard = {
        suit: 'clubs',
        value: '8',
        location: {
            type: 'tableau',
            index: 1
          },
        isFacingUp: true
      }

      expect(AppComponent.cardIsAllowedToBeDropped(newTopCard, currentTopCard)).toBeTrue();
    })
  })

  describe('getTopCardOnRow', () => {
    describe('when there are cards on a given row', () => {
      it('should return the top card on the given row', () => {
        component.startGame();

        const expectedCard: PlayingCard = {
          suit: 'clubs',
          value: '5',
          location: {
            type: 'tableau',
            index: 1
          },
          isFacingUp: true
        }
        component.cards.push(expectedCard);

        expect(component.getTopCardForType('tableau', 1)).toEqual(expectedCard);
      })
    })

    describe('when there are no cards on a given row', () => {
      it('should return null', () => {
        component.cards = [];

        expect(component.getTopCardForType('tableau', 1)).toEqual(null);
      })
    })
  })

  describe('setLastCardInEachRowToFaceUp', () => {
    it('should set the isFacingUp state of the last card in each row to true', () => {
      component.cards = component.setUpCards();
      component.setLastCardInEachRowToFaceUp();
      const reversedCards = [...component.cards].reverse();
      const rows = [1,2,3,4,5,6,7];

      rows.forEach((row) => {
        const topCardOnRow = reversedCards.find((card) => card.location.type === 'tableau' && card.location.index === row);
        expect(topCardOnRow?.isFacingUp).toBeTrue;
      })
    })
  })
});
