import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements AfterViewInit {
  @Input() totalMoves = 0;
  @Input() elapsedTimeInSeconds = 0;
  @Output() resetGameEvent = new EventEmitter<null>;

  rotateImageStyling: string = '';
  rotationCount = 0;

  @ViewChild('resetGameButton') resetGameButton: ElementRef;

  ngAfterViewInit(){
    fromEvent(this.resetGameButton.nativeElement, 'click').subscribe(() => {
      this.rotationCount =  this.rotationCount - 180;
      this.rotateImageStyling = `rotate(${this.rotationCount}deg)`;
    });
  }

  get formattedTotalMoves() {
    return String(this.totalMoves).padStart(4, '0');
  }

  get formattedElapsedTime() {
    const minutes = Math.floor(this.elapsedTimeInSeconds / 60);
    const seconds = (this.elapsedTimeInSeconds % 60);
    const minutesString = minutes >= 10 ? `${minutes}` : `0${minutes}`;
    const secondsString = seconds >= 10 ? `${seconds}` : `0${seconds}`;
    return `${minutesString}:${secondsString}`;
  }

  resetGame(){
    this.resetGameEvent.emit();
  }
}
