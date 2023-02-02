import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { fromEvent, Observable, repeat, skipUntil, takeUntil } from 'rxjs';
import { AppComponent } from '../../app.component';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements AfterViewInit {
  @Input() card: { suit: string, value: string, location: string };
  @Input() index: number;
  @Input() cardIsOnTop = false;

  style = '';
  cardSelected = false;
  startingCardCoOrdinates: {x: number, y: number} | null;
  moveCard$: Observable<MouseEvent>;
  grabCard$: Observable<MouseEvent>;
  dropCard$: Observable<MouseEvent>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(private app: AppComponent) {}

  ngAfterViewInit() {
    this.initializeEventObservables();
    this.watchForCardMove();
    this.watchForCardDrop();
  }

  initializeEventObservables(){
    this.grabCard$ = fromEvent<MouseEvent>(this.cardElement.nativeElement,'mousedown');
    this.moveCard$ = fromEvent<MouseEvent>(document, 'mousemove');
    this.dropCard$ = fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mouseup');
  }

  watchForCardMove(){
    this.moveCard$.pipe(
      skipUntil(this.grabCard$),
      takeUntil(this.dropCard$),
      repeat()
    ).subscribe((event) => {
      if(!this.startingCardCoOrdinates) return this.initializeStartingCoOrdinates(event);
      this.cardSelected = true;
      const verticalChange =  event.clientY - this.startingCardCoOrdinates.y;
      const horizontalChange = event.clientX - this.startingCardCoOrdinates.x;
      this.moveCard(verticalChange, horizontalChange);
    })
  }

  initializeStartingCoOrdinates(event: MouseEvent){
    this.startingCardCoOrdinates = {
      x: event.clientX,
      y: event.clientY
    }
  }

  watchForCardDrop(){
    this.dropCard$
    .subscribe((event) => {
      this.cardSelected = false;
      const cardDropEvent: { card: { suit: string, value: string, location: string }, clientX: number, clientY: number } = { card: this.card, clientX: event.clientX, clientY: event.clientY }
      this.app.cardDrop$.next(cardDropEvent);
    })
  }

  moveCard(up: number, right: number){
    this.style = `transform: translate(${right}px, ${up}px);`;
  }
}
