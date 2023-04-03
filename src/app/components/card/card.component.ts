import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, delay, filter, fromEvent, map, merge, of, switchMap, takeUntil, tap, throttleTime } from 'rxjs';
import { AppComponent, PlayingCard } from '../../app.component';

interface MouseOrTouchEvent {
  clientX: number;
  clientY: number;
}

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

  userIsMovingCard = false;
  zIndex = 'unset';
  imageSrc: string;
  isRed: boolean;
  useTop: boolean;
  imagesLoaded = false;

  mouseOrTouchStart$: Observable<MouseOrTouchEvent>;
  mouseOrTouchMove$: Observable<MouseOrTouchEvent>;
  mouseOrTouchEnd$: Observable<MouseOrTouchEvent>;

  mouseUpOnDocument$: Observable<MouseEvent>;
  touchUpOnDocument$: Observable<TouchEvent>;

  cardMove$: Observable<string>;
  translationStyling$: Observable<string>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(private app: AppComponent) {}

  get showCard() {
    return this.imagesLoaded || !this.card.isFacingUp;
  }

  get useBoxShadow() {
    if (this.isLastInPile) return true;
    if (this.card.location.type === 'tableau') return true;
    return false;
  }

  get topStyling() {
    return this.useTop ? this.stackingIndex * 25 + '%' : '0px';
  }

  ngOnInit() {
    this.imageSrc = `assets/images/${this.card.suit.slice(0, -1)}.svg`;
    this.isRed = ['hearts', 'diamonds'].includes(this.card.suit);
    this.useTop = this.card.location.type === 'tableau';
  }

  ngAfterViewInit() {
    this.initializeObservables();
    this.listenForCardDrop();
    this.listenForMouseOrTouchEndOnDocument();
  }

  public static cardIsAllowedToBeDragged(card: PlayingCard): boolean {
    if (card.location.type === 'waste') return true;
    if (card.location.type === 'tableau' && card.isFacingUp) return true;
    return false;
  }

  initializeObservables() {
    this.mouseUpOnDocument$ = fromEvent<MouseEvent>(document, 'mouseup');
    this.touchUpOnDocument$ = fromEvent<TouchEvent>(document, 'touchend');

    this.mouseOrTouchStart$ = merge(
      fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mousedown').pipe(
        switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))
      ),
      fromEvent<TouchEvent>(this.cardElement.nativeElement, 'touchstart').pipe(
        switchMap(event => of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }))
      )
    );
    this.mouseOrTouchMove$ = merge(
      fromEvent<MouseEvent>(document, 'mousemove').pipe(
        switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))
      ),
      fromEvent<TouchEvent>(document, 'touchmove').pipe(
        switchMap(event => of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }))
      )
    );
    this.mouseOrTouchEnd$ = merge(
      fromEvent<MouseEvent>(this.cardElement.nativeElement, 'mouseup').pipe(
        switchMap(event => of({ clientX: event.clientX, clientY: event.clientY }))
      ),
      fromEvent<TouchEvent>(this.cardElement.nativeElement, 'touchend').pipe(
        switchMap(event => of({ clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }))
      )
    );

    this.cardMove$ = this.mouseOrTouchStart$.pipe(
      filter(() => this.cardIsAllowedToBeMoved()),
      switchMap(start => {
        return this.mouseOrTouchMove$.pipe(
          throttleTime(10),
          map(move => {
            const translation = `translate(${move.clientX - start.clientX}px, ${
              move.clientY - start.clientY
            }px) scale(1.2)`;
            this.userIsMovingCard = true;
            this.zIndex = '100';
            this.app.cardIsBeingMoved$.next({ card: this.card, translation });
            return translation;
          }),
          takeUntil(this.mouseOrTouchEnd$)
        );
      })
    );

    this.translationStyling$ = merge(
      this.cardMove$,
      this.app.cardReset$,
      this.app.additionalCardsToMove$.pipe(
        filter(event => event.additionalCardsToMove.includes(this.card)),
        tap(() => (this.zIndex = '101')),
        map(event => event.translation)
      )
    );
  }

  listenForCardDrop() {
    this.mouseOrTouchEnd$
      .pipe(
        tap(event => {
          this.userIsMovingCard = false;
          this.app.cardDrop$.next({ card: this.card, clientX: event.clientX, clientY: event.clientY });
        }),
        delay(CARD_RESET_TRANSITION_TIME),
        tap(() => {
          this.zIndex = 'unset';
        })
      )
      .subscribe();
  }

  listenForMouseOrTouchEndOnDocument() {
    merge(this.mouseUpOnDocument$, this.touchUpOnDocument$)
      .pipe(delay(CARD_RESET_TRANSITION_TIME))
      .subscribe(() => {
        this.zIndex = 'unset';
      });
  }

  cardIsAllowedToBeMoved(): boolean {
    if (this.card.location.type === 'stock') return false;
    return this.isLastInPile || this.card.isFacingUp;
  }

  imagesLoadedHandler(){
    this.imagesLoaded = true;
  };
}
