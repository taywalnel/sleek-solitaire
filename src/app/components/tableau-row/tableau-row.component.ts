import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { AppComponent, PlayingCard } from 'src/app/app.component';

@Component({
  selector: 'app-tableau-row',
  templateUrl: './tableau-row.component.html',
  styleUrls: ['./tableau-row.component.scss']
})
export class TableauRowComponent implements AfterViewInit {
  @Input() cards: PlayingCard[] = [];
  @Input() type: string;
  @Input() index: number;
  @Input() placeHolderImageSrc: string;

  clickCard$: Observable<MouseEvent>;
  @ViewChild('rowElement') rowElement: ElementRef;

  constructor(private app: AppComponent) { }

  ngAfterViewInit(): void {
    this.clickCard$ = fromEvent<MouseEvent>(this.rowElement.nativeElement, 'click');
    if(this.type === 'stock' && this.index === 1){
      this.watchForCardClick();
    }
  }

  watchForCardClick(){
    this.clickCard$.subscribe((event) => {
      this.app.stockClicked$.next(true);
    })
  }
}
