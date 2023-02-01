import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { fromEvent, Observable, repeat, skipUntil, takeUntil } from 'rxjs';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements AfterViewInit {
  @Input() card: { suit: string, value: string };
  @Input() index: number;
  @Input() cardIsOnTop = false;

  style = '';
  startingCardCoOrdinates: {x: number, y: number} | null;
  move$: Observable<MouseEvent>;
  down$: Observable<MouseEvent>;
  up$: Observable<MouseEvent>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor() { }

  ngAfterViewInit() {
    this.initializeEventObservables();
    this.watchForCardMove();
  }

  initializeEventObservables(){
    this.down$ = fromEvent<MouseEvent>(this.cardElement.nativeElement,'mousedown');
    this.move$ = fromEvent<MouseEvent>(document, 'mousemove');
    this.up$ = fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mouseup');
  }

  watchForCardMove(){
    this.move$.pipe(
      skipUntil(this.down$),
      takeUntil(this.up$),
      repeat()
    ).subscribe((event) => {
      if(!this.startingCardCoOrdinates) return this.initializeStartingCoOrdinates(event);

      const verticalChange =  event.clientY - this.startingCardCoOrdinates.y;
      const horizontalChange = event.clientX - this.startingCardCoOrdinates.x;
      this.transformCard(verticalChange, horizontalChange);
    })
  }

  initializeStartingCoOrdinates(event: MouseEvent){
    this.startingCardCoOrdinates = {
      x: event.clientX,
      y: event.clientY
    }
  }

  transformCard(up: number, right: number){
    this.style = `transform: translate(${right}px, ${up}px);`;
  }
}
