import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameWonModalComponent } from './game-won-modal.component';

describe('GameWonModalComponent', () => {
  let component: GameWonModalComponent;
  let fixture: ComponentFixture<GameWonModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameWonModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameWonModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
