import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, map, merge, Observable, switchMap, takeUntil, throttleTime } from 'rxjs';
import { AppComponent, PlayingCard } from '../../app.component';

const CARD_RESET_TRANSITION_TIME = 300;

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements AfterViewInit, OnInit {
  @Input() card: PlayingCard;
  @Input() stackingIndex: number;

  style = '';
  userIsMovingCard = false;
  applyZIndex = false;
  startingCardCoOrdinates: {x: number, y: number} | null;
  imageSrc: string;
  isRed: boolean;
  useTop: boolean;

  mouseMove$: Observable<MouseEvent>;
  mouseDown$: Observable<MouseEvent>;
  mouseUp$: Observable<MouseEvent>;
  cardMove$: Observable<string>;
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

    this.cardMove$ = this.mouseDown$.pipe(
      switchMap(
        (start) => {
          return this.mouseMove$.pipe(
            throttleTime(5),
            map(move => {
              move.preventDefault();
              this.userIsMovingCard = true;
              this.applyZIndex = true;
              return `translate(${move.clientX - start.clientX}px, ${move.clientY - start.clientY}px)`;
          }),
            takeUntil(this.mouseUp$));
        })
    );

    this.translateCard$ = merge(this.cardMove$, this.app.cardReset$);
  }

  watchForCardDrop(){
    this.mouseUp$
    .subscribe((event) => {
      this.userIsMovingCard = false;
      setTimeout(() => {
        this.applyZIndex = false;
      }, CARD_RESET_TRANSITION_TIME);
      const cardDropEvent: { card: PlayingCard, clientX: number, clientY: number } = { card: this.card, clientX: event.clientX, clientY: event.clientY }
      this.app.cardDrop$.next(cardDropEvent);
    })
  }
}