import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { filter, fromEvent, map, merge, Observable, of, switchMap, takeUntil, tap, throttleTime } from 'rxjs';
import { AppComponent, PlayingCard } from '../../app.component';

const CARD_RESET_TRANSITION_TIME = 300;

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent implements AfterViewInit, OnInit {
  @Input() card: PlayingCard;
  @Input() stackingIndex: number;
  @Input() isLastInPile: boolean;

  style = '';
  userIsMovingCard = false;
  zIndex = 'unset';
  startingCardCoOrdinates: { x: number; y: number } | null;
  imageSrc: string;
  isRed: boolean;
  useTop: boolean;

  mouseMove$: Observable<MouseEvent>;
  mouseDown$: Observable<MouseEvent>;
  mouseUp$: Observable<MouseEvent>;
  mouseUpOnDocument$: Observable<MouseEvent>;

  touchDown$: Observable<TouchEvent>;
  touchMove$: Observable<TouchEvent>;
  touchUp$: Observable<TouchEvent>;
  touchUpOnDocument$: Observable<TouchEvent>;

  cardMove$: Observable<string>;
  translateCard$: Observable<string>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(private app: AppComponent) {}

  get useBoxShadow() {
    if (this.isLastInPile) return true;
    if (this.card.location.type === 'tableau') return true;
    return false;
  }

  get topElementStyling() {
    return this.useTop ? this.stackingIndex * 25 + '%' : '0px';
  }

  ngOnInit() {
    this.imageSrc = `assets/images/${this.card.suit.slice(0, -1)}.svg`;
    this.isRed = ['hearts', 'diamonds'].includes(this.card.suit);
    this.useTop = this.card.location.type === 'tableau';
  }

  ngAfterViewInit() {
    this.initializeEventObservables();
    this.watchForCardDrop();
  }

  public static cardIsAllowedToBeDragged(card: PlayingCard): boolean {
    if (card.location.type === 'waste') return true;
    if (card.location.type === 'tableau' && card.isFacingUp) return true;
    return false;
  }

  initializeEventObservables() {
    this.mouseDown$ = fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mousedown');
    this.mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove');
    this.mouseUp$ = fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mouseup');
    this.mouseUpOnDocument$ = fromEvent<MouseEvent>(document, 'mouseup');

    this.touchDown$ = fromEvent<TouchEvent>(this.cardElement.nativeElement, 'touchstart');
    this.touchMove$ = fromEvent<TouchEvent>(document, 'touchmove');
    this.touchUp$ = fromEvent<TouchEvent>(this.cardElement.nativeElement, 'touchend');
    this.touchUpOnDocument$ = fromEvent<TouchEvent>(document, 'touchend');

    merge(this.mouseUpOnDocument$, this.touchUpOnDocument$).subscribe(() => {
      setTimeout(() => {
        this.zIndex = 'unset';
      }, CARD_RESET_TRANSITION_TIME);
    });

    this.cardMove$ = merge(
      this.mouseDown$.pipe(switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))),
      this.touchDown$.pipe(
        switchMap(event => of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }))
      )
    ).pipe(
      switchMap(start => {
        return merge(
          this.mouseMove$.pipe(switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))),
          this.touchMove$.pipe(
            switchMap(event =>
              of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY })
            )
          )
        ).pipe(
          filter(() => this.isLastInPile || this.card.isFacingUp),
          throttleTime(5),
          map(move => {
            const translation = `translate(${move.clientX - start.clientX}px, ${move.clientY - start.clientY}px)`;
            // move.preventDefault();
            this.userIsMovingCard = true;
            this.zIndex = '100';
            this.app.cardIsBeingMoved$.next({ card: this.card, translation });
            return translation;
          }),
          takeUntil(merge(this.mouseUp$, this.touchUp$))
        );
      })
    );

    this.translateCard$ = merge(
      this.cardMove$,
      this.app.cardReset$,
      this.app.additionalCardsToMove$.pipe(
        filter(event => event.additionalCardsToMove.includes(this.card)),
        tap(() => (this.zIndex = '101')),
        map(event => event.translation)
      )
    );
  }

  watchForCardDrop() {
    merge(
      this.mouseUp$.pipe(switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))),
      this.touchUp$.pipe(
        switchMap(event => of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }))
      )
    ).subscribe(event => {
      this.userIsMovingCard = false;
      setTimeout(() => {
        this.zIndex = 'unset';
      }, CARD_RESET_TRANSITION_TIME);
      const cardDropEvent: {
        card: PlayingCard;
        clientX: number;
        clientY: number;
      } = { card: this.card, clientX: event.clientX, clientY: event.clientY };
      this.app.cardDrop$.next(cardDropEvent);
    });
  }
}
