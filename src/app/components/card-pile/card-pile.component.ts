import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { AppComponent, PlayingCard } from 'src/app/app.component';

@Component({
  selector: 'app-card-pile',
  templateUrl: './card-pile.component.html',
  styleUrls: ['./card-pile.component.scss'],
})
export class CardPileComponent implements AfterViewInit {
  @Input() cards: PlayingCard[] = [];
  @Input() type: string;
  @Input() index: number;
  @Input() placeHolderImageSrc: string;

  clickCard$: Observable<MouseEvent>;
  @ViewChild('rowElement') rowElement: ElementRef;

  constructor(private app: AppComponent) {}

  ngAfterViewInit(): void {
    this.clickCard$ = fromEvent<MouseEvent>(this.rowElement.nativeElement, 'click');
    if (this.type === 'stock' && this.index === 1) {
      this.listenForPileClick();
    }
  }

  listenForPileClick() {
    this.clickCard$.subscribe(() => {
      this.app.stockClicked$.next(true);
    });
  }
}
