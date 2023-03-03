import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { AppComponent } from 'src/app/app.component';

export interface Settings {
  nightMode: boolean;
}

@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent {
  @Input() totalMoves = 0;
  @Input() elapsedTimeInSeconds = 0;
  @Output() resetGameEvent = new EventEmitter<null>();

  settings: Settings = {
    nightMode: false,
  };
  rotateImageStyling: string = '';
  rotationCount = 0;
  showSettingsMenu = false;
  nightModeActive = false;

  constructor(private app: AppComponent) {}

  settingsClickHandler() {
    this.showSettingsMenu = !this.showSettingsMenu;
  }

  toggleNightMode() {
    this.settings.nightMode = !this.settings.nightMode;
    this.app.settings$.next(this.settings);
  }

  get formattedTotalMoves() {
    return String(this.totalMoves).padStart(4, '0');
  }

  get formattedElapsedTime() {
    const minutes = Math.floor(this.elapsedTimeInSeconds / 60);
    const seconds = this.elapsedTimeInSeconds % 60;
    const minutesString = minutes >= 10 ? `${minutes}` : `0${minutes}`;
    const secondsString = seconds >= 10 ? `${seconds}` : `0${seconds}`;
    return `${minutesString}:${secondsString}`;
  }

  resetGame() {
    this.resetGameEvent.emit();
  }
}
