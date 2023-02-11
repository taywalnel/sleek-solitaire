import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardPileComponent } from './card-pile.component';


describe('CardPileComponent', () => {
  let component: CardPileComponent;
  let fixture: ComponentFixture<CardPileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardPileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardPileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
