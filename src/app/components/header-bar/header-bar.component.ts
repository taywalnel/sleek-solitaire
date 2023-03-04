import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppComponent } from 'src/app/app.component';

export interface Settings {
  nightMode: boolean;
  settingsMenu: boolean;
}

@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent implements OnInit {
  @Input() totalMoves = 0;
  @Input() elapsedTimeInSeconds = 0;
  @Output() resetGameEvent = new EventEmitter<null>();

  rotateImageStyling: string = '';
  rotationCount = 0;
  showSettingsMenu = false;
  settings: Settings = {
    nightMode: false,
    settingsMenu: false,
  };

  constructor(private app: AppComponent) {}

  ngOnInit(): void {
    this.app.settings$.subscribe(settings => (this.settings = settings));
  }

  settingsClickHandler() {
    this.settings.settingsMenu = !this.settings.settingsMenu;
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
