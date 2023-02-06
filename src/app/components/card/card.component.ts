import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { fromEvent, Observable, repeat, skipUntil, takeUntil } from 'rxjs';
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
  moveCard$: Observable<MouseEvent>;
  grabCard$: Observable<MouseEvent>;
  dropCard$: Observable<MouseEvent>;

  @ViewChild('cardElement') cardElement: ElementRef;

  constructor(private app: AppComponent) {}

  ngOnInit(){
    this.imageSrc = `assets/images/${this.card.suit.slice(0, -1)}.svg`;
    this.isRed = ['hearts', 'diamonds'].includes(this.card.suit);
    this.useTop = this.card.location.type === 'tableau';
  }

  ngAfterViewInit() {
    this.initializeEventObservables();
    this.watchForCardMove();
    this.watchForCardDrop();
    this.watchForResetCardDrag();
  }

  public static cardIsAllowedToBeDragged(card: PlayingCard): boolean{
    if(card.location.type === 'waste') return true
    if(card.location.type === 'tableau' && card.isFacingUp) return true
    return false;
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
      if(!CardComponent.cardIsAllowedToBeDragged(this.card)) return;
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
