import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, map, Observable, switchMap, takeUntil, throttleTime } from 'rxjs';
import { AppComponent, PlayingCard } from '../../app.component';

const DRAGGABLE_CARD_TYPES = ['tableau', 'waste'];

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements AfterViewInit, OnInit {
  @Input() card: PlayingCard;
  @Input() stackingIndex: number;

  style = '';
  cardSelected = false;
  startingCardCoOrdinates: {x: number, y: number} | null;
  imageSrc: string;
  isRed: boolean;
  useTop: boolean;

  mouseMove$: Observable<MouseEvent>;
  mouseDown$: Observable<MouseEvent>;
  mouseUp$: Observable<MouseEvent>;
  translateCard$: Observable<string>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(private app: AppComponent) {}

  ngOnInit(){
    this.imageSrc = `assets/images/${this.card.suit.slice(0, -1)}.svg`;
    this.isRed = ['hearts', 'diamonds'].includes(this.card.suit);
    this.useTop = this.card.location.type === 'tableau';
  }

  ngAfterViewInit() {
    this.initializeEventObservables();
    this.watchForCardDrop();
    this.watchForResetCardDrag();
  }

  public static cardIsAllowedToBeDragged(card: PlayingCard): boolean{
    if(card.location.type === 'waste') return true
    if(card.location.type === 'tableau' && card.isFacingUp) return true
    return false;
  }

  initializeEventObservables(){
    this.mouseDown$ = fromEvent<MouseEvent>(this.cardElement.nativeElement,'mousedown');
    this.mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    this.mouseUp$ = fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mouseup');
    this.translateCard$ = this.mouseDown$.pipe(
      switchMap(
        (start) => {
          return this.mouseMove$.pipe(
            throttleTime(10),
            map(move => {
              move.preventDefault();
              this.cardSelected = true;
              return `translate(${move.clientX - start.clientX}px, ${move.clientY - start.clientY}px)`;
          }),
            takeUntil(this.app.resetCard$));
        })
    );
  }

  watchForCardDrop(){
    this.mouseUp$
    .subscribe((event) => {
      debugger;
      this.cardSelected = false;
      const cardDropEvent: { card: PlayingCard, clientX: number, clientY: number } = { card: this.card, clientX: event.clientX, clientY: event.clientY }
      this.app.cardDrop$.next(cardDropEvent);
    })
  }

  watchForResetCardDrag(){
    this.app.resetCard$.subscribe((card) => {
      if(card === this.card){
        this.moveCard(0, 0);
      }
    })
  }

  moveCard(up: number, right: number){
    this.style = `transform: translate(${right}px, ${up}px);`;
  }
}
