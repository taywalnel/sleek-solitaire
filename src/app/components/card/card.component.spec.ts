import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent, PlayingCard } from 'src/app/app.component';

import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardComponent ],
      providers: [ AppComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    component.card = {
      suit: 'hearts',
      value: 'K',
      location: {
        type: 'tableau',
        index: 1
      },
      isFacingUp: false
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe(`cardIsAllowedToBeDragged`, () => {
    it('should return true when card is waste type', () => {
      const mockCard: PlayingCard = {
        suit: 'hearts',
        value: 'K',
        location: {
          type: 'waste',
          index: 1
        },
        isFacingUp: true
      }
      expect(CardComponent.cardIsAllowedToBeDragged(mockCard)).toBeTrue();
    })
  })
});
